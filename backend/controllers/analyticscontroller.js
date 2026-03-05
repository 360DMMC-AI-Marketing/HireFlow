import Job from '../models/job.js';
import Candidate from '../models/candidate.js';
import AIInterviewSession from '../models/AIInterviewSession.js';

// ─── DASHBOARD STATS (existing, refined) ─────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'Active' });
    const jobCount = activeJobs > 0 ? activeJobs : totalJobs;

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [newApplicants, prevApplicants, todayInterviews, hiredThisMonth] = await Promise.all([
      Candidate.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Candidate.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Candidate.countDocuments({ status: 'Interview' }),
      Candidate.countDocuments({ status: 'Hired', updatedAt: { $gte: startOfMonth } })
    ]);

    const applicantChange = prevApplicants > 0
      ? `${newApplicants >= prevApplicants ? '+' : ''}${Math.round(((newApplicants - prevApplicants) / prevApplicants) * 100)}%`
      : newApplicants > 0 ? `+${newApplicants}` : '+0';

    const prevWeekJobs = await Job.countDocuments({ createdAt: { $lt: sevenDaysAgo } });
    const jobChange = totalJobs - prevWeekJobs;

    res.json({
      success: true,
      stats: {
        activeJobs: { value: jobCount, change: jobChange > 0 ? `+${jobChange}` : `${jobChange}` },
        newApplicants: { value: newApplicants, change: applicantChange },
        interviews: { value: todayInterviews, change: 'Active' },
        hired: { value: hiredThisMonth, change: 'This Month' }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── APPLICATION VELOCITY (existing, refined) ────────────────────────────────

export const getApplicationVelocity = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0,0,0,0);
      const next = new Date(date); next.setDate(next.getDate() + 1);

      const [applicants, hires] = await Promise.all([
        Candidate.countDocuments({ createdAt: { $gte: date, $lt: next } }),
        Candidate.countDocuments({ status: 'Hired', updatedAt: { $gte: date, $lt: next } })
      ]);

      data.push({
        name: days <= 7 ? dayNames[date.getDay()] : `${date.getMonth()+1}/${date.getDate()}`,
        date: date.toISOString().slice(0, 10),
        applicants,
        hires
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── RECENT CANDIDATES ───────────────────────────────────────────────────────

export const getRecentCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .sort({ matchScore: -1, createdAt: -1 })
      .limit(10)
      .populate('jobId', 'title')
      .select('name email matchScore status positionApplied jobId createdAt source');

    res.json({
      success: true,
      candidates: candidates.map(c => {
        const nameParts = c.name ? c.name.split(' ') : ['Unknown'];
        const first = nameParts[0] || 'Unknown';
        const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        return {
          id: c._id,
          name: c.name || 'Unknown',
          role: c.positionApplied || c.jobId?.title || 'Candidate',
          status: c.status,
          score: c.matchScore || 0,
          source: c.source,
          appliedAt: c.createdAt,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(first)}+${encodeURIComponent(last)}&background=random`
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── COMPANY OVERVIEW (cross-job metrics) ────────────────────────────────────

export const getOverview = async (req, res) => {
  try {
    const [totalJobs, totalCandidates, statusBreakdown, departmentBreakdown] = await Promise.all([
      Job.countDocuments(),
      Candidate.countDocuments(),
      Candidate.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Job.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Funnel: count candidates at each stage
    const stages = ['New', 'Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    const funnel = {};
    for (const s of statusBreakdown) { funnel[s._id] = s.count; }

    // Avg match score
    const scoreAgg = await Candidate.aggregate([
      { $match: { matchScore: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$matchScore' }, count: { $sum: 1 } } }
    ]);

    // Avg time to hire (from createdAt to updatedAt for Hired candidates)
    const hireTimeAgg = await Candidate.aggregate([
      { $match: { status: 'Hired' } },
      { $project: { days: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 86400000] } } },
      { $group: { _id: null, avg: { $avg: '$days' } } }
    ]);

    // AI interview stats
    const aiStats = await AIInterviewSession.aggregate([
      { $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgScore: { $avg: '$overallAnalysis.overallScore' }
      }}
    ]).catch(() => []);

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCandidates,
        funnel: stages.map(s => ({ stage: s, count: funnel[s] || 0 })),
        departments: departmentBreakdown.map(d => ({ name: d._id || 'Other', count: d.count })),
        avgMatchScore: Math.round(scoreAgg[0]?.avg || 0),
        avgTimeToHire: Math.round(hireTimeAgg[0]?.avg || 0),
        aiInterviews: {
          total: aiStats[0]?.total || 0,
          completed: aiStats[0]?.completed || 0,
          avgScore: Math.round(aiStats[0]?.avgScore || 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── JOB-LEVEL ANALYTICS (funnel, time-to-hire per job) ──────────────────────

export const getJobAnalytics = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId).select('title department status createdAt analytics');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const candidates = await Candidate.find({ jobId }).select('status matchScore source createdAt updatedAt');

    const stages = ['New', 'Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    const funnel = {};
    const sources = {};
    const scores = [];
    let hireTimeTotal = 0, hireCount = 0;

    for (const c of candidates) {
      funnel[c.status] = (funnel[c.status] || 0) + 1;
      sources[c.source || 'Unknown'] = (sources[c.source || 'Unknown'] || 0) + 1;
      if (c.matchScore > 0) scores.push(c.matchScore);
      if (c.status === 'Hired') {
        hireTimeTotal += (c.updatedAt - c.createdAt) / 86400000;
        hireCount++;
      }
    }

    // Score distribution in ranges
    const ranges = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 }
    ];
    const scoreDistribution = ranges.map(r => ({
      range: r.label,
      count: scores.filter(s => s >= r.min && s <= r.max).length
    }));

    res.json({
      success: true,
      data: {
        job: { title: job.title, department: job.department, status: job.status, createdAt: job.createdAt },
        totalCandidates: candidates.length,
        funnel: stages.map(s => ({ stage: s, count: funnel[s] || 0 })),
        sources: Object.entries(sources).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        scoreDistribution,
        avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        avgTimeToHire: hireCount > 0 ? Math.round(hireTimeTotal / hireCount) : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SCORE DISTRIBUTION (company-wide) ───────────────────────────────────────

export const getScoreDistribution = async (req, res) => {
  try {
    const distribution = await Candidate.aggregate([
      { $match: { matchScore: { $gt: 0 } } },
      { $bucket: {
        groupBy: '$matchScore',
        boundaries: [0, 21, 41, 61, 81, 101],
        default: 'Other',
        output: { count: { $sum: 1 } }
      }}
    ]);

    const labels = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const boundaries = [0, 21, 41, 61, 81];
    const result = labels.map((label, i) => {
      const bucket = distribution.find(d => d._id === boundaries[i]);
      return { range: label, count: bucket?.count || 0 };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── APPLICATION SOURCES BREAKDOWN ───────────────────────────────────────────

export const getSourcesBreakdown = async (req, res) => {
  try {
    const sources = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = sources.reduce((a, s) => a + s.count, 0);

    res.json({
      success: true,
      data: sources.map(s => ({
        name: s._id || 'Unknown',
        count: s.count,
        percentage: total > 0 ? Math.round((s.count / total) * 100) : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TIME METRICS ────────────────────────────────────────────────────────────

export const getTimeMetrics = async (req, res) => {
  try {
    // Time to screen: createdAt → status changed from New/Applied to Screening
    // We approximate by looking at candidates currently in each stage
    const stages = {
      screening: ['Screening', 'Interview', 'Offer', 'Hired'],
      interview: ['Interview', 'Offer', 'Hired'],
      hire: ['Hired']
    };

    const results = {};

    for (const [metric, statusList] of Object.entries(stages)) {
      const agg = await Candidate.aggregate([
        { $match: { status: { $in: statusList } } },
        { $project: { days: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 86400000] } } },
        { $group: { _id: null, avg: { $avg: '$days' }, min: { $min: '$days' }, max: { $max: '$days' }, count: { $sum: 1 } } }
      ]);

      results[metric] = {
        avgDays: Math.round(agg[0]?.avg || 0),
        minDays: Math.round(agg[0]?.min || 0),
        maxDays: Math.round(agg[0]?.max || 0),
        count: agg[0]?.count || 0
      };
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TOP CANDIDATES ──────────────────────────────────────────────────────────

export const getTopCandidates = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const candidates = await Candidate.find({ matchScore: { $gt: 0 } })
      .sort({ matchScore: -1 })
      .limit(limit)
      .populate('jobId', 'title department')
      .select('name email matchScore status source positionApplied jobId createdAt skills');

    res.json({
      success: true,
      data: candidates.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        score: c.matchScore,
        status: c.status,
        source: c.source,
        position: c.positionApplied || c.jobId?.title || 'N/A',
        department: c.jobId?.department,
        skills: (c.skills || []).slice(0, 5),
        appliedAt: c.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ACTIVITY FEED ───────────────────────────────────────────────────────────

export const getActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get recent candidates (new applications, status changes)
    const recentCandidates = await Candidate.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('jobId', 'title')
      .select('name status positionApplied jobId createdAt updatedAt source');

    // Get recent jobs
    const recentJobs = await Job.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status department createdAt updatedAt');

    // Get recent AI interviews
    const recentInterviews = await AIInterviewSession.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('candidateId', 'name')
      .populate('jobId', 'title')
      .select('status candidateId jobId overallAnalysis.overallScore createdAt completedAt')
      .catch(() => []);

    // Merge into timeline
    const timeline = [];

    for (const c of recentCandidates) {
      const isNew = Math.abs(c.createdAt - c.updatedAt) < 60000;
      timeline.push({
        type: isNew ? 'application' : 'status_change',
        message: isNew
          ? `${c.name} applied for ${c.positionApplied || c.jobId?.title || 'a position'}`
          : `${c.name} moved to ${c.status}`,
        detail: isNew ? `Source: ${c.source || 'Direct'}` : c.positionApplied || c.jobId?.title,
        timestamp: c.updatedAt
      });
    }

    for (const j of recentJobs) {
      timeline.push({
        type: 'job',
        message: `Job "${j.title}" ${j.status === 'Active' ? 'published' : j.status.toLowerCase()}`,
        detail: j.department,
        timestamp: j.updatedAt
      });
    }

    for (const i of (recentInterviews || [])) {
      if (i.status === 'completed') {
        timeline.push({
          type: 'interview',
          message: `AI interview completed for ${i.candidateId?.name || 'candidate'}`,
          detail: i.jobId?.title ? `${i.jobId.title} — Score: ${i.overallAnalysis?.overallScore || 'N/A'}` : '',
          timestamp: i.completedAt || i.updatedAt
        });
      }
    }

    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, data: timeline.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── JOB COMPARISON (all jobs side by side) ──────────────────────────────────

export const getJobComparison = async (req, res) => {
  try {
    const jobs = await Job.find({ status: { $in: ['Active', 'Paused', 'Closed'] } })
      .select('title department status analytics createdAt')
      .sort('-createdAt')
      .limit(20);

    const comparison = await Promise.all(jobs.map(async (job) => {
      const candidateCount = await Candidate.countDocuments({ jobId: job._id });
      const hiredCount = await Candidate.countDocuments({ jobId: job._id, status: 'Hired' });
      const avgScore = await Candidate.aggregate([
        { $match: { jobId: job._id, matchScore: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$matchScore' } } }
      ]);

      return {
        id: job._id,
        title: job.title,
        department: job.department,
        status: job.status,
        candidates: candidateCount,
        hired: hiredCount,
        avgScore: Math.round(avgScore[0]?.avg || 0),
        conversionRate: candidateCount > 0 ? Math.round((hiredCount / candidateCount) * 100) : 0,
        createdAt: job.createdAt
      };
    }));

    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TIER USAGE (plan limits) ────────────────────────────────────────────────

export const getTierUsage = async (req, res) => {
  try {
    const [jobCount, candidateCount, interviewCount] = await Promise.all([
      Job.countDocuments({ status: { $in: ['Active', 'Draft'] } }),
      Candidate.countDocuments(),
      AIInterviewSession.countDocuments().catch(() => 0)
    ]);

    // Current plan limits (will be dynamic when Stripe is integrated)
    const plan = 'free';
    const limits = {
      free: { jobs: 5, candidates: 50, aiInterviews: 3 },
      pro: { jobs: -1, candidates: -1, aiInterviews: 50 },
      enterprise: { jobs: -1, candidates: -1, aiInterviews: -1 }
    };

    const current = limits[plan];

    res.json({
      success: true,
      data: {
        plan,
        usage: {
          jobs: { used: jobCount, limit: current.jobs, unlimited: current.jobs === -1 },
          candidates: { used: candidateCount, limit: current.candidates, unlimited: current.candidates === -1 },
          aiInterviews: { used: interviewCount, limit: current.aiInterviews, unlimited: current.aiInterviews === -1 }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── EXPORT (CSV) ────────────────────────────────────────────────────────────

export const exportData = async (req, res) => {
  try {
    const { type } = req.params; // 'candidates' or 'jobs'

    if (type === 'candidates') {
      const candidates = await Candidate.find()
        .populate('jobId', 'title department')
        .select('name email phone status source matchScore positionApplied skills createdAt')
        .sort('-createdAt');

      const header = 'Name,Email,Phone,Status,Source,Match Score,Position,Skills,Applied Date\n';
      const rows = candidates.map(c =>
        `"${c.name}","${c.email}","${c.phone || ''}","${c.status}","${c.source || ''}",${c.matchScore},"${c.positionApplied || c.jobId?.title || ''}","${(c.skills || []).join('; ')}","${c.createdAt.toISOString().slice(0,10)}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=candidates-export-${Date.now()}.csv`);
      return res.send(header + rows);
    }

    if (type === 'jobs') {
      const jobs = await Job.find().select('title department status employmentType location createdAt analytics').sort('-createdAt');

      const header = 'Title,Department,Status,Type,Location,Applicants,Created Date\n';
      const rows = jobs.map(j =>
        `"${j.title}","${j.department}","${j.status}","${j.employmentType}","${j.location}",${j.analytics?.totalApplicants || 0},"${j.createdAt.toISOString().slice(0,10)}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=jobs-export-${Date.now()}.csv`);
      return res.send(header + rows);
    }

    res.status(400).json({ success: false, message: 'Invalid export type. Use "candidates" or "jobs".' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
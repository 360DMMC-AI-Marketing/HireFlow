import Job from '../models/job.js';
import Candidate from '../models/candidate.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Count ALL jobs (not just Active, since user has 4 jobs)
        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        
        // Use total jobs if no active jobs
        const jobCount = activeJobs > 0 ? activeJobs : totalJobs;
        
        // Count new applicants (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newApplicants = await Candidate.countDocuments({ 
            createdAt: { $gte: sevenDaysAgo } 
        });
        
        // Count interviews scheduled for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Count interviews (candidates in Interview status)
        const todayInterviews = await Candidate.countDocuments({ status: 'Interview' });
        
        // Count hired this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const hiredThisMonth = await Candidate.countDocuments({ 
            status: 'Hired',
            updatedAt: { $gte: startOfMonth }
        });
        
        // Calculate changes (compare with previous period)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const prevPeriodApplicants = await Candidate.countDocuments({ 
            createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } 
        });
        
        const applicantChange = prevPeriodApplicants > 0 
            ? `+${Math.round((newApplicants - prevPeriodApplicants) / prevPeriodApplicants * 100)}%` 
            : newApplicants > 0 ? `+${newApplicants}` : '+0';
        
        // Calculate job change from last week
        const prevWeekJobs = await Job.countDocuments({
            createdAt: { $lt: sevenDaysAgo }
        });
        const jobChange = totalJobs - prevWeekJobs;
        const jobChangeStr = jobChange > 0 ? `+${jobChange}` : jobChange < 0 ? `${jobChange}` : '0';
        
        res.json({
            success: true,
            stats: {
                activeJobs: {
                    value: jobCount,
                    change: jobChangeStr
                },
                newApplicants: {
                    value: newApplicants,
                    change: applicantChange
                },
                interviews: {
                    value: todayInterviews,
                    change: 'Today'
                },
                hired: {
                    value: hiredThisMonth,
                    change: 'This Month'
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching dashboard statistics',
            error: error.message 
        });
    }
};

// Get application velocity data (for the chart)
export const getApplicationVelocity = async (req, res) => {
    try {
        // Get data for the last 7 days
        const data = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const applicants = await Candidate.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });
            
            // Count hired candidates for this day
            const hires = await Candidate.countDocuments({
                status: 'Hired',
                updatedAt: { $gte: date, $lt: nextDate }
            });
            
            data.push({
                name: dayNames[date.getDay()],
                applicants,
                hires
            });
        }
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching application velocity:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching application velocity',
            error: error.message 
        });
    }
};

// Get recent candidates for active pipeline (sorted by best match score)
export const getRecentCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .sort({ matchScore: -1, createdAt: -1 })
            .limit(5)
            .populate('jobId', 'title')
            .select('name email matchScore status positionApplied jobId createdAt');
        
        const formatted = candidates.map(c => {
            const nameParts = c.name ? c.name.split(' ') : ['Unknown'];
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'User';
            
            return {
                id: c._id,
                name: c.name || 'Unknown Candidate',
                role: c.positionApplied || (c.jobId?.title) || 'Candidate',
                status: c.status || 'New',
                score: c.matchScore || 0,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=random`
            };
        });
        
        res.json({
            success: true,
            candidates: formatted
        });
    } catch (error) {
        console.error('Error fetching recent candidates:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching recent candidates',
            error: error.message 
        });
    }
};

// Placeholder for other analytics endpoints
export const getOverview = (req, res) => {
    res.send('Analytics API is working');
};

export const getTierUsage = (req, res) => {
    res.send('Tier Usage API is working');
};

export const getJobComparison = (req, res) => {
    res.send('Job Comparison API is working');
};

export const getTopCandidates = (req, res) => {
    res.send('Top Candidates API is working');
};

export const getActivity = (req, res) => {
    res.send('Activity API is working');
};

import Job from '../models/job.js';
import Candidate from '../models/candidate.js';
import AIInterviewSession from '../models/AIInterviewSession.js';

// Plan limits configuration
const PLAN_LIMITS = {
  free: { jobs: 5, candidates: 50, aiInterviews: 3 },
  pro: { jobs: -1, candidates: -1, aiInterviews: 50 },
  enterprise: { jobs: -1, candidates: -1, aiInterviews: -1 }
};

// ── Generic limit checker ────────────────────────────────────────────────────

const checkLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const plan = req.user?.subscription?.plan || 'free';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
      const limit = limits[resource];

      // -1 means unlimited
      if (limit === -1) return next();

      let currentCount = 0;

      switch (resource) {
        case 'jobs':
          currentCount = await Job.countDocuments({
            createdBy: req.user._id,
            status: { $in: ['Active', 'Draft'] }
          });
          break;

        case 'candidates':
          currentCount = await Candidate.countDocuments();
          break;

        case 'aiInterviews':
          // Count interviews this month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          currentCount = await AIInterviewSession.countDocuments({
            createdAt: { $gte: startOfMonth }
          });
          break;
      }

      if (currentCount >= limit) {
        return res.status(403).json({
          success: false,
          error: `Plan limit reached`,
          message: `Your ${plan} plan allows ${limit} ${resource}. You've used ${currentCount}. Please upgrade your plan.`,
          upgrade: true,
          resource,
          used: currentCount,
          limit
        });
      }

      next();
    } catch (err) {
      console.error('[UsageLimit] Check failed:', err);
      // Don't block the request if limit check fails
      next();
    }
  };
};

// ── Export pre-built middleware ───────────────────────────────────────────────

export const checkJobLimit = checkLimit('jobs');
export const checkCandidateLimit = checkLimit('candidates');
export const checkAIInterviewLimit = checkLimit('aiInterviews');
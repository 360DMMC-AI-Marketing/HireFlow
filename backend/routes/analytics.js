import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDashboardStats,
  getApplicationVelocity,
  getRecentCandidates,
  getOverview,
  getJobAnalytics,
  getScoreDistribution,
  getSourcesBreakdown,
  getTimeMetrics,
  getTopCandidates,
  getActivity,
  getJobComparison,
  getTierUsage,
  exportData
} from '../controllers/analyticsController.js';

const router = Router();

router.use(protect);

// Dashboard (existing)
router.get('/dashboard-stats', getDashboardStats);
router.get('/application-velocity', getApplicationVelocity);
router.get('/recent-candidates', getRecentCandidates);

// Company-wide analytics
router.get('/overview', getOverview);
router.get('/score-distribution', getScoreDistribution);
router.get('/sources', getSourcesBreakdown);
router.get('/time-metrics', getTimeMetrics);
router.get('/top-candidates', getTopCandidates);
router.get('/activity', getActivity);
router.get('/job-comparison', getJobComparison);
router.get('/tier-usage', getTierUsage);

// Job-level analytics
router.get('/job/:jobId', getJobAnalytics);

// Export
router.get('/export/:type', exportData);

export default router;
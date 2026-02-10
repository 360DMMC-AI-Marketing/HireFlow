import { Router } from "express";
import {
    getDashboardStats,
    getApplicationVelocity,
    getRecentCandidates,
    getOverview,
    getTierUsage,
    getJobComparison,
    getTopCandidates,
    getActivity
} from '../controllers/analyticscontroller.js';

const router = Router();

// Dashboard analytics endpoints
router.get('/dashboard-stats', getDashboardStats);
router.get('/application-velocity', getApplicationVelocity);
router.get('/recent-candidates', getRecentCandidates);

// Other analytics endpoints
router.get('/api/analytics/overview', getOverview);
router.get('/api/analytics/tier-usage', getTierUsage);
router.get('/api/analytics/job-comparison', getJobComparison);
router.get('/api/analytics/top-candidates', getTopCandidates);
router.get('/api/analytics/activity', getActivity);

export default router;  
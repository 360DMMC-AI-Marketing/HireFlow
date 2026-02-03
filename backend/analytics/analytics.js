import { Router } from "express";
const router = Router();    
router.get('/api/analytics/overview', (req, res) => {
    res.send('Analytics API is working');
}   );

router.get('/api/analytics/tier-usage', (req, res) => {
    res.send('Tier Usage API is working');
}   );
router.get('/api/analytics/job-comparison', (req, res) => {
    res.send('Job Comparison API is working');
}   );  
router.get('/api/analytics/top-candidates', (req, res) => {
    res.send('Top Candidates API is working');
}   );
router.get('/api/analytics/activity', (req, res) => {
    res.send('Activity API is working');
}   );  
export default router;  
import { Router } from "express";
const router = Router();
import authrouter from '../auth/auth.js';
import jobsrouter from '../jobs/jobs.js';
router.get('/api/integrations/status', (req, res) => {
    res.send('API is working');
});
export default router;
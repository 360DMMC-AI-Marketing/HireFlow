import { Router } from "express";
const router = Router();
import authrouter from '../auth/auth.js';
import jobsrouter from '../jobs/jobs.js';
import integrationsrouter from './integrations.js'; 
router.get('/api/integrations/status', (req, res) => {
    res.send('API is working');
});
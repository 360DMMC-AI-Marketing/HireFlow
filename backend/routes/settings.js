import { Router } from "express";
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Protect ALL settings routes
router.use(protect);

// Only ADMINS can change integrations
router.use(authorize('admin')); 

// Note: Removed '/api/settings' prefix since it's mounted in app.js
router.get('/integrations', (req, res) => res.send('Settings API'));
router.post('/integrations/linkedin/connect', (req, res) => res.send('Connect LinkedIn'));
router.post('/integrations/linkedin/disconnect', (req, res) => res.send('Disconnect LinkedIn'));
// ... etc

export default router;
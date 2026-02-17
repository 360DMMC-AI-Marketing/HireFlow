// backend/routes/schedule.js
// Public scheduling routes — candidates access these via magic links
import { Router } from 'express';
import * as ctrl from '../controllers/interviewController.js';

const router = Router();

// Validate token & get available slots
router.get('/:token', ctrl.validateScheduleToken);

// Book a slot via magic link
router.post('/:token/book', ctrl.bookViaToken);

export default router;
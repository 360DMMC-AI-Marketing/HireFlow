// backend/routes/interviews.js
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/interviewController.js';

const router = Router();

// ─── PUBLIC: Magic Link Scheduling ───────────────────────────────────────────
router.get('/schedule/:token', ctrl.validateScheduleToken);
router.post('/schedule/:token/book', ctrl.bookViaToken);

// ─── PUBLIC: Available slots (candidates viewing via scheduling page) ────────
router.get('/slots', ctrl.getSlots);
router.post('/book', ctrl.bookSlot);

// ─── PROTECTED: Require auth ─────────────────────────────────────────────────
router.use(protect);

// Slot management (recruiter/admin)
router.post('/slots', authorize('admin', 'recruiter'), ctrl.createSlots);
router.get('/slots/me', authorize('admin', 'recruiter'), ctrl.getMySlots);
router.delete('/slots/:id', authorize('admin', 'recruiter'), ctrl.deleteSlot);

// Magic link generation
router.post('/magic-link', authorize('admin', 'recruiter'), ctrl.generateMagicLink);

// Interview CRUD
router.get('/', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getAllInterviews);
router.get('/:id', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.getInterviewById);
router.patch('/:id/cancel', authorize('admin', 'recruiter'), ctrl.cancelInterview);
router.patch('/:id/reschedule', authorize('admin', 'recruiter'), ctrl.rescheduleInterview);
router.patch('/:id/feedback', authorize('admin', 'recruiter', 'hiring_manager'), ctrl.addFeedback);

export default router;
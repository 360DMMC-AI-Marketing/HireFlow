import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// VIEWING: Allowed for 'admin', 'recruiter', 'hiring_manager'
router.get('/:id', authorize('admin', 'recruiter', 'hiring_manager'), (req, res) => {
    res.send('Get candidate details');
});

// ACTIONS: Only 'admin' and 'recruiter' can change status or take interview notes
router.patch('/bulk-updates', authorize('admin', 'recruiter'), (req, res) => {
    res.send('Bulk update');
});

router.patch('/:id/status', authorize('admin', 'recruiter'), (req, res) => {
    res.send('Update status');
});

// ... rest of your routes

export default router;
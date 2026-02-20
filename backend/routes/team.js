import { Router } from "express";
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/members', (req, res) => {
    res.json({ success: true, members: [], message: 'Team Members API' });
});
router.post('/invite', (req, res) => {
    res.json({ success: true, message: 'Team Invite API' });
});
router.patch('/:userId/role', (req, res) => {
    res.json({ success: true, message: 'Role updated' });
});
router.delete('/:userId', (req, res) => {
    res.json({ success: true, message: 'Member removed' });
});

export default router;
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getAuditLogs, getAuditStats, getResourceHistory } from '../controllers/auditLogController.js';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/resource/:resource/:id', getResourceHistory);

export default router;
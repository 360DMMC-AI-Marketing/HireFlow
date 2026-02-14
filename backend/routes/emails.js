import { Router } from "express";
import { handleInboundEmail, emailUpload } from '../controllers/emailWebhookController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// ============================================================
// PUBLIC: Inbound email webhook (called by email service provider)
// Accepts multipart form-data (SendGrid Inbound Parse format)
// or JSON (Postmark, Mailgun, etc.)
// ============================================================
router.post('/webhook/inbound', emailUpload.single('attachment'), handleInboundEmail);
// Also support 'attachments' field name (Mailgun style)
router.post('/webhook/inbound/multi', emailUpload.array('attachment', 5), handleInboundEmail);

// ============================================================
// PROTECTED: Email management endpoints
// ============================================================
router.use(protect);

router.get('/', (req, res) => {
    res.json({ success: true, emails: [], total: 0, message: 'Emails endpoint' });
});
router.get('/:id', (req, res) => {
    res.json({ success: true, email: null, message: 'Get Email by ID' });
});
router.post('/:id/resend', (req, res) => {
    res.json({ success: true, message: 'Email resent' });
});

export default router;
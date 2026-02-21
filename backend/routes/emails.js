import { Router } from "express";
import { handleInboundEmail, emailUpload } from '../controllers/emailWebhookController.js';
import { protect } from '../middleware/auth.js';
import EmailLog from '../models/EmailLog.js';
import { sendTemplatedEmail } from '../services/emailService.js';

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

// GET /api/emails — List all email logs with filtering, search & pagination
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;
        const filter = {};

        // Filter by status (queued, scheduled, sent, failed, retrying)
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Search by recipient email or template name
        if (search) {
            filter.$or = [
                { to: { $regex: search, $options: 'i' } },
                { templateName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [emails, total] = await Promise.all([
            EmailLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            EmailLog.countDocuments(filter)
        ]);

        res.json({
            success: true,
            emails,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch emails' });
    }
});

// GET /api/emails/:id — Get a single email log by ID
router.get('/:id', async (req, res) => {
    try {
        const email = await EmailLog.findById(req.params.id).lean();
        if (!email) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }
        res.json({ success: true, email });
    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch email' });
    }
});

// POST /api/emails/:id/resend — Resend a failed email by re-queuing it
router.post('/:id/resend', async (req, res) => {
    try {
        const emailLog = await EmailLog.findById(req.params.id);
        if (!emailLog) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        // Only allow resending failed or sent emails
        if (!['failed', 'sent'].includes(emailLog.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot resend email with status "${emailLog.status}"`
            });
        }

        // Re-queue using the original template and data
        await sendTemplatedEmail(
            emailLog.templateName,
            emailLog.to,
            emailLog.metadata || {}
        );

        res.json({ success: true, message: `Email re-queued to ${emailLog.to}` });
    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({ success: false, message: 'Failed to resend email' });
    }
});

export default router;
import { Router } from "express";
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/subscriptions', (req, res) => {
    res.json({ success: true, subscription: { plan: 'pro', status: 'active' } });
});
router.get('/plans', (req, res) => {
    res.json({ success: true, plans: [
        { id: 'free', name: 'Free', price: 0 },
        { id: 'pro', name: 'Pro', price: 49 },
        { id: 'enterprise', name: 'Enterprise', price: 199 }
    ] });
});
router.post('/upgrade', (req, res) => {
    res.json({ success: true, message: 'Plan upgraded' });
});
router.post('/downgrade', (req, res) => {
    res.json({ success: true, message: 'Plan downgraded' });
});
router.post('/update-payment-method', (req, res) => {
    res.json({ success: true, message: 'Payment method updated' });
});
router.get('/invoices', (req, res) => {
    res.json({ success: true, invoices: [] });
});

export default router;
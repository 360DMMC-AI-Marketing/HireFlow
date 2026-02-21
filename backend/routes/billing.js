import { Router } from "express";
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// All billing endpoints return "Coming Soon" — will be implemented
// when a payment provider (Stripe, Paddle, etc.) is integrated.

const comingSoon = (req, res) => {
    res.json({
        success: true,
        comingSoon: true,
        message: 'Billing is coming soon! This feature will be available in a future update.',
        subscription: {
            plan: 'free',
            status: 'active',
            message: 'You are currently on the Free plan. Paid plans coming soon!'
        }
    });
};

router.get('/subscriptions', comingSoon);

router.get('/plans', (req, res) => {
    res.json({
        success: true,
        comingSoon: true,
        message: 'Billing is coming soon!',
        plans: [
            { id: 'free', name: 'Free', price: 0, features: ['5 active jobs', '50 candidates', 'Basic analytics'], current: true },
            { id: 'pro', name: 'Pro', price: 49, features: ['Unlimited jobs', 'Unlimited candidates', 'Advanced analytics', 'Email automation', 'Calendar sync'], current: false, comingSoon: true },
            { id: 'enterprise', name: 'Enterprise', price: 199, features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SSO / SAML', 'API access'], current: false, comingSoon: true }
        ]
    });
});

router.post('/upgrade', (req, res) => {
    res.json({ success: false, comingSoon: true, message: 'Plan upgrades coming soon! Stay tuned.' });
});

router.post('/downgrade', (req, res) => {
    res.json({ success: false, comingSoon: true, message: 'Plan changes coming soon! Stay tuned.' });
});

router.post('/update-payment-method', (req, res) => {
    res.json({ success: false, comingSoon: true, message: 'Payment methods coming soon! Stay tuned.' });
});

router.get('/invoices', (req, res) => {
    res.json({ success: true, comingSoon: true, invoices: [], message: 'Invoice history coming soon!' });
});

export default router;
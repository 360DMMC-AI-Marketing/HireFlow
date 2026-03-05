import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getPlans,
  getSubscription,
  createCheckout,
  getPortalUrl,
  cancelSubscription,
  resumeSubscription,
  handleWebhook,
  getInvoices
} from '../controllers/billingController.js';

const router = Router();

// Webhook — must be BEFORE protect middleware (LemonSqueezy calls this, not a user)
router.post('/webhook', handleWebhook);

// All other routes require auth
router.use(protect);

router.get('/plans', getPlans);
router.get('/subscription', getSubscription);
router.get('/subscriptions', getSubscription); // alias for backward compat
router.post('/checkout', createCheckout);
router.post('/portal', getPortalUrl);
router.post('/cancel', cancelSubscription);
router.post('/resume', resumeSubscription);
router.get('/invoices', getInvoices);

export default router;
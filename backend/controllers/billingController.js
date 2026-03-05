import crypto from 'crypto';
import User from '../models/user.js';

const LS_API = 'https://api.lemonsqueezy.com/v1';
const API_KEY = () => process.env.LEMONSQUEEZY_API_KEY;
const STORE_ID = () => process.env.LEMONSQUEEZY_STORE_ID;
const WEBHOOK_SECRET = () => process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    variantId: null,
    limits: { jobs: 5, candidates: 50, aiInterviews: 3 }
  },
  pro: {
    name: 'Pro',
    price: 49,
    variantId: () => process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
    limits: { jobs: -1, candidates: -1, aiInterviews: 50 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    variantId: () => process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID,
    limits: { jobs: -1, candidates: -1, aiInterviews: -1 }
  }
};

// ── Helper: call LemonSqueezy API ────────────────────────────────────────────

const lsFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${LS_API}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${API_KEY()}`,
      ...options.headers
    }
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[LemonSqueezy] API error:', res.status, err);
    throw new Error(`LemonSqueezy API error: ${res.status}`);
  }
  return res.json();
};

// ── GET /api/billing/plans ───────────────────────────────────────────────────

export const getPlans = (req, res) => {
  res.json({
    success: true,
    data: Object.entries(PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.price,
      limits: plan.limits,
      current: (req.user.subscription?.plan || 'free') === id
    }))
  });
};

// ── GET /api/billing/subscription ────────────────────────────────────────────

export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const sub = user.subscription || { plan: 'free', status: 'active' };
    const plan = PLANS[sub.plan] || PLANS.free;

    res.json({
      success: true,
      data: {
        plan: sub.plan,
        planName: plan.name,
        status: sub.status || 'active',
        price: plan.price,
        limits: plan.limits,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        lsSubscriptionId: sub.lsSubscriptionId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/billing/checkout ───────────────────────────────────────────────

export const createCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig || !planConfig.variantId) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const variantId = planConfig.variantId();
    const user = req.user;

    const checkout = await lsFetch('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              custom: {
                user_id: user._id.toString()
              }
            },
            checkout_options: {
              dark: false,
              logo: true
            },
            product_options: {
              redirect_url: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?tab=billing&success=true`
            }
          },
          relationships: {
            store: { data: { type: 'stores', id: STORE_ID() } },
            variant: { data: { type: 'variants', id: variantId } }
          }
        }
      })
    });

    const checkoutUrl = checkout.data.attributes.url;
    res.json({ success: true, data: { url: checkoutUrl } });
  } catch (err) {
    console.error('[Billing] Checkout error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/billing/portal ─────────────────────────────────────────────────
// Returns the LemonSqueezy customer portal URL for managing subscription

export const getPortalUrl = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lsCustomerId = user.subscription?.lsCustomerId;

    if (!lsCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription. Please upgrade first.'
      });
    }

    const customer = await lsFetch(`/customers/${lsCustomerId}`);
    const portalUrl = customer.data.attributes.urls.customer_portal;

    res.json({ success: true, data: { url: portalUrl } });
  } catch (err) {
    console.error('[Billing] Portal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/billing/cancel ─────────────────────────────────────────────────

export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lsSubId = user.subscription?.lsSubscriptionId;

    if (!lsSubId) {
      return res.status(400).json({ success: false, message: 'No active subscription' });
    }

    await lsFetch(`/subscriptions/${lsSubId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: lsSubId,
          attributes: { cancelled: true }
        }
      })
    });

    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    res.json({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    console.error('[Billing] Cancel error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/billing/resume ─────────────────────────────────────────────────

export const resumeSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lsSubId = user.subscription?.lsSubscriptionId;

    if (!lsSubId) {
      return res.status(400).json({ success: false, message: 'No subscription to resume' });
    }

    await lsFetch(`/subscriptions/${lsSubId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: lsSubId,
          attributes: { cancelled: false }
        }
      })
    });

    user.subscription.cancelAtPeriodEnd = false;
    await user.save();

    res.json({ success: true, message: 'Subscription resumed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/billing/webhook ────────────────────────────────────────────────
// Called by LemonSqueezy when subscription events happen

export const handleWebhook = async (req, res) => {
  try {
    // Verify signature
    const secret = WEBHOOK_SECRET();
    if (secret) {
      const sig = req.headers['x-signature'];
      if (sig) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(req.body));
        const digest = hmac.digest('hex');
        if (sig !== digest) {
          console.warn('[Webhook] Invalid signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
    }

    const event = req.body.meta?.event_name;
    const data = req.body.data;
    const attrs = data?.attributes;
    const userId = req.body.meta?.custom_data?.user_id;

    console.log(`[Webhook] Event: ${event}, User: ${userId}`);

    if (!userId) {
      console.warn('[Webhook] No user_id in custom data');
      return res.json({ received: true });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`[Webhook] User not found: ${userId}`);
      return res.json({ received: true });
    }

    // Determine plan from variant ID
    const variantId = String(attrs?.variant_id || '');
    let plan = 'free';
    if (variantId === process.env.LEMONSQUEEZY_PRO_VARIANT_ID) plan = 'pro';
    else if (variantId === process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID) plan = 'enterprise';

    switch (event) {
      case 'subscription_created':
      case 'subscription_updated':
        user.subscription = {
          plan,
          status: attrs.status === 'active' ? 'active' : attrs.status === 'past_due' ? 'past_due' : attrs.status,
          lsSubscriptionId: String(data.id),
          lsCustomerId: String(attrs.customer_id),
          currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
          cancelAtPeriodEnd: attrs.cancelled || false,
          updatedAt: new Date()
        };
        await user.save();
        console.log(`[Webhook] User ${userId} → ${plan} (${attrs.status})`);
        break;

      case 'subscription_cancelled':
        if (user.subscription) {
          user.subscription.cancelAtPeriodEnd = true;
          await user.save();
          console.log(`[Webhook] User ${userId} → cancelling at period end`);
        }
        break;

      case 'subscription_expired':
        if (user.subscription) {
          user.subscription.plan = 'free';
          user.subscription.status = 'expired';
          user.subscription.cancelAtPeriodEnd = false;
          await user.save();
          console.log(`[Webhook] User ${userId} → reverted to free`);
        }
        break;

      case 'subscription_payment_success':
        console.log(`[Webhook] Payment success for user ${userId}`);
        break;

      case 'subscription_payment_failed':
        if (user.subscription) {
          user.subscription.status = 'past_due';
          await user.save();
          console.log(`[Webhook] Payment failed for user ${userId} → past_due`);
        }
        break;

      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/billing/invoices ────────────────────────────────────────────────

export const getInvoices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lsSubId = user.subscription?.lsSubscriptionId;

    if (!lsSubId) {
      return res.json({ success: true, data: [] });
    }

    const result = await lsFetch(`/subscriptions/${lsSubId}/invoices`);
    const invoices = (result.data || []).map(inv => ({
      id: inv.id,
      status: inv.attributes.status,
      total: inv.attributes.total_formatted,
      date: inv.attributes.created_at,
      url: inv.attributes.urls?.invoice_url
    }));

    res.json({ success: true, data: invoices });
  } catch (err) {
    // If invoices endpoint fails, return empty (not all plans have invoices immediately)
    res.json({ success: true, data: [] });
  }
};

// ── Export PLANS for usage in other modules ───────────────────────────────────

export { PLANS };
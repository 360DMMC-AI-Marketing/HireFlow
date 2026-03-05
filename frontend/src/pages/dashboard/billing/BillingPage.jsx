import React, { useState, useEffect } from 'react';
import {
  CreditCard, Check, Crown, Zap, Building2, Loader2,
  ExternalLink, AlertCircle, ArrowRight, X, Receipt
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

const PLAN_FEATURES = {
  free: [
    '5 active jobs',
    '50 candidates',
    '3 AI interviews/month',
    'Basic analytics',
    'Email support'
  ],
  pro: [
    'Unlimited jobs',
    'Unlimited candidates',
    '50 AI interviews/month',
    'Advanced analytics & exports',
    'Email automation',
    'Calendar integrations',
    'Priority support'
  ],
  enterprise: [
    'Everything in Pro',
    'Unlimited AI interviews',
    'Custom integrations',
    'SSO / SAML',
    'Dedicated account manager',
    'API access',
    'Custom onboarding'
  ]
};

const PLAN_ICONS = {
  free: Zap,
  pro: Crown,
  enterprise: Building2
};

const BillingPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadBilling();
    // Check for success redirect from LemonSqueezy
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccessMessage('Payment successful! Your plan has been upgraded.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=billing');
      // Reload after a moment to get updated subscription
      setTimeout(loadBilling, 2000);
    }
  }, []);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const [subRes, plansRes, invRes] = await Promise.all([
        fetch(`${API}/billing/subscription`, { headers: headers() }),
        fetch(`${API}/billing/plans`, { headers: headers() }),
        fetch(`${API}/billing/invoices`, { headers: headers() })
      ]);
      const subData = await subRes.json();
      const plansData = await plansRes.json();
      const invData = await invRes.json();

      setSubscription(subData.data);
      setPlans(plansData.data || []);
      setInvoices(invData.data || []);
    } catch (err) {
      console.error('Billing load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planId) => {
    setCheckoutLoading(planId);
    try {
      const res = await fetch(`${API}/billing/checkout`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        alert(data.message || 'Failed to create checkout');
      }
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch(`${API}/billing/portal`, {
        method: 'POST',
        headers: headers()
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.open(data.data.url, '_blank');
      } else {
        alert(data.message || 'Could not open billing portal');
      }
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`${API}/billing/cancel`, {
        method: 'POST',
        headers: headers()
      });
      const data = await res.json();
      if (data.success) {
        setShowCancel(false);
        await loadBilling();
      } else {
        alert(data.message || 'Cancel failed');
      }
    } catch (err) {
      alert('Cancel failed: ' + err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch(`${API}/billing/resume`, {
        method: 'POST',
        headers: headers()
      });
      const data = await res.json();
      if (data.success) await loadBilling();
      else alert(data.message || 'Resume failed');
    } catch (err) {
      alert('Resume failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const isFreePlan = currentPlan === 'free';

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Current Plan</p>
            <h2 className="text-2xl font-bold">{subscription?.planName || 'Free'}</h2>
            <p className="text-indigo-200 text-sm mt-1">
              {isFreePlan
                ? 'Upgrade to unlock unlimited features'
                : subscription?.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : subscription?.currentPeriodEnd
                    ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : 'Active subscription'
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">${subscription?.price || 0}<span className="text-base font-normal text-indigo-200">/mo</span></p>
          </div>
        </div>
        {!isFreePlan && (
          <div className="flex gap-2 mt-4">
            <button onClick={handleManageBilling}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium transition">
              <CreditCard className="w-4 h-4" /> Manage Billing
              <ExternalLink className="w-3 h-3" />
            </button>
            {subscription?.cancelAtPeriodEnd ? (
              <button onClick={handleResume}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition">
                Resume Subscription
              </button>
            ) : (
              <button onClick={() => setShowCancel(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-red-500/30 rounded-lg text-sm font-medium transition">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation */}
      {showCancel && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900">Cancel Subscription?</h3>
              <p className="text-sm text-red-700 mt-1">
                You'll keep access until the end of your billing period. After that, you'll be downgraded to the Free plan with limited features.
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={handleCancel} disabled={cancelLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2">
                  {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Yes, Cancel
                </button>
                <button onClick={() => setShowCancel(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                  Keep My Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {isFreePlan ? 'Upgrade Your Plan' : 'Available Plans'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['free', 'pro', 'enterprise'].map(planId => {
            const plan = plans.find(p => p.id === planId) || { id: planId, name: planId, price: 0 };
            const Icon = PLAN_ICONS[planId];
            const isCurrent = currentPlan === planId;
            const isUpgrade = !isCurrent && (
              (currentPlan === 'free') ||
              (currentPlan === 'pro' && planId === 'enterprise')
            );
            const features = PLAN_FEATURES[planId] || [];

            return (
              <div key={planId}
                className={`rounded-xl border-2 p-5 transition ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : planId === 'pro'
                      ? 'border-indigo-200 bg-white hover:border-indigo-300'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${
                    planId === 'pro' ? 'bg-indigo-100' :
                    planId === 'enterprise' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      planId === 'pro' ? 'text-indigo-600' :
                      planId === 'enterprise' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h4 className="font-bold text-gray-900">{plan.name || planId}</h4>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full ml-auto">
                      Current
                    </span>
                  )}
                  {planId === 'pro' && !isCurrent && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-auto">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-black text-gray-900">
                    ${plan.price || (planId === 'pro' ? 49 : planId === 'enterprise' ? 199 : 0)}
                  </span>
                  <span className="text-sm text-gray-400">/mo</span>
                </div>

                <ul className="space-y-2 mb-5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                        planId === 'pro' ? 'text-indigo-500' :
                        planId === 'enterprise' ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg">
                    Current Plan
                  </div>
                ) : isUpgrade ? (
                  <button onClick={() => handleCheckout(planId)}
                    disabled={checkoutLoading === planId}
                    className={`w-full py-2.5 text-center text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                      planId === 'pro'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    } disabled:opacity-50`}>
                    {checkoutLoading === planId
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <>Upgrade <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                ) : (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-gray-400 bg-gray-50 rounded-lg">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Billing History
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.total}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>{inv.status}</span>
                  {inv.url && (
                    <a href={inv.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
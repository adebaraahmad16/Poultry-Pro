import PlanCards from '../../../components/subscriptions/PlanCards';
import { usePlanCatalog } from '../../../components/subscriptions/usePlanCatalog';
import { request } from '../../../services/planCatalog';
import React, { useState } from 'react';
import { useFarm } from '../../../context/FarmContext';
import { useAuth } from '../../../context/AuthContext';
import { subscriptionService } from '../../../services/subscriptionService';

export default function SubscriptionManagement() {
  const { plans, loading: plansLoading, error: plansError, retry: retryPlans } = usePlanCatalog();
  const {
    farm,
    flocks,
    metrics,
    workers,
    subscription,
    setSubscription,
    currentPlan,
    currentPlanId,
    activeFlocksCount,
    remainingTrialDays,
    isTrial,
    isSubscriptionExpired
  } = useFarm();

  const { user } = useAuth();

  const [billingCycle, setBillingCycle] = useState(subscription?.billingCycle || 'monthly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Card form state for checkout modal





  const notify = (text, type = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const currentPlanInfo = subscriptionService.getPlanDetails(currentPlanId);
  const selectedPlanInfo = checkoutPlanId ? subscriptionService.getPlanDetails(checkoutPlanId) : currentPlanInfo;

  // Resource Usage Calculations
  const maxFlocks = currentPlanInfo.limits.maxFlocks;
  const flocksPercent = maxFlocks === Infinity ? 20 : Math.min(100, Math.round((activeFlocksCount / maxFlocks) * 100));

  const totalBirds = metrics?.totalBirds || 0;
  const maxBirds = currentPlanInfo.limits.maxBirds;
  const birdsPercent = maxBirds === Infinity ? 20 : Math.min(100, Math.round((totalBirds / maxBirds) * 100));

  const poultryTypesCount = Array.isArray(farm?.poultryTypes) ? farm.poultryTypes.length : 1;
  const maxPoultryTypes = currentPlanInfo.limits.maxPoultryTypes;
  const poultryTypesPercent = maxPoultryTypes === Infinity ? 25 : Math.min(100, Math.round((poultryTypesCount / maxPoultryTypes) * 100));

  const staffCount = workers?.length || 1;
  const maxUsers = currentPlanInfo.limits.maxUsers;
  const staffPercent = maxUsers === Infinity ? 25 : Math.min(100, Math.round((staffCount / maxUsers) * 100));

  const handleToggleAutoRenew = async () => {
    try {
      const updated = await request('/subscription/auto-renew',{method:'PATCH',body:JSON.stringify({autoRenew:!subscription.autoRenew})});
      subscriptionService.saveSubscription({...subscription,...updated,paymentHistory:subscription.paymentHistory}); setSubscription({...subscription,...updated,paymentHistory:subscription.paymentHistory});
      notify(`Automatic renewal ${updated.autoRenew ? 'enabled' : 'cancelled'}.`,'info');
    } catch(e) { notify(e.message,'error'); }
  };

  const handleOpenCheckout = (planId) => {
    setCheckoutPlanId(planId);
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault(); setIsProcessingPayment(true);
    try { await subscriptionService.switchPlan(checkoutPlanId,billingCycle); }
    catch(e) { notify(e.message,'error'); setIsProcessingPayment(false); }
  };
  React.useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) return;
    request('/subscription/verify-paystack',{ method:'POST',body:JSON.stringify({reference}) }).then(updated => {
      subscriptionService.saveSubscription(updated); setSubscription(updated); notify('Payment verified. Subscription updated.');
      const url = new URL(window.location.href); url.searchParams.delete('reference'); url.searchParams.delete('trxref'); window.history.replaceState({},'',url);
    }).catch(e => notify(e.message,'error'));
  },[]);

  const handleDownloadReceipt = (payment) => {
    setSelectedReceipt(payment);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-extrabold rounded-full border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            14-Day Free Trial ({remainingTrialDays} days left)
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Active Subscription
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 text-xs font-extrabold rounded-full border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            Trial / Subscription Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-extrabold rounded-full border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            Auto-Renewal Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-800 text-xs font-extrabold rounded-full">
            {status}
          </span>
        );
    }
  };

  const payments = subscription?.paymentHistory || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Subscription & Billing Management</h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage your farm subscription tier, active capacity quotas, renewal dates, and payment receipts.
            </p>
          </div>
          <div>{getStatusBadge(subscription?.status || 'trial')}</div>
        </div>
      </div>

      {/* 2. Current Plan Overview & Quota Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Plan Card */}
        <div className="lg:col-span-1 bg-[#0F172A] text-white p-6 rounded-3xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-md">
                  Active Tier
                </span>
                <h3 className="text-2xl font-black mt-3 text-white">PoultryPro {currentPlanInfo.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{currentPlanInfo.tagline}</p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Subscription Rate:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {subscription?.agreedPrice != null ? `₦${Number(subscription.agreedPrice).toLocaleString()}/${subscription.billingCycle === 'annual' ? 'year' : 'month'}` : subscription?.billingCycle === 'annual' ? `${currentPlanInfo.annualPriceFormatted}/year` : `${currentPlanInfo.priceFormatted}/month`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="font-semibold text-white capitalize">{subscription?.billingCycle || 'monthly'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Start Date:</span>
                <span className="font-semibold text-white">
                  {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Next Renewal / Expiry:</span>
                <span className="font-semibold text-white">
                  {subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">Automatic Renewal:</span>
                <button
                  type="button"
                  onClick={handleToggleAutoRenew}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    subscription?.autoRenew
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {subscription?.autoRenew ? 'Enabled (Auto-charge)' : 'Cancelled (Manual)'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleOpenCheckout(currentPlanId)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all text-center block"
            >
              {isSubscriptionExpired ? 'Reactivate Subscription' : 'Renew / Pay via Paystack'}
            </button>
          </div>
        </div>

        {/* Quota Progress Bars */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Farm Capacity & Usage Quotas</h4>
              <p className="text-xs text-slate-500">Live utilization against your plan tier limits</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {currentPlanInfo.name} Tier
            </span>
          </div>

          {/* 1. Active Flocks Quota */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-700">Active Flocks Limit</span>
              <span className="text-slate-900">
                {activeFlocksCount} / {maxFlocks === Infinity ? 'Unlimited' : maxFlocks} flocks{' '}
                <span className="text-slate-400">({flocksPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  flocksPercent >= 100 && maxFlocks !== Infinity
                    ? 'bg-rose-600'
                    : flocksPercent >= 80 && maxFlocks !== Infinity
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${flocksPercent}%` }}
              ></div>
            </div>
          </div>

          {/* 2. Bird Capacity */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-700">Total Bird Capacity</span>
              <span className="text-slate-900">
                {totalBirds.toLocaleString()} / {maxBirds === Infinity ? 'Unlimited' : maxBirds.toLocaleString()} birds{' '}
                <span className="text-slate-400">({birdsPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  birdsPercent >= 100 && maxBirds !== Infinity
                    ? 'bg-rose-600'
                    : birdsPercent >= 80 && maxBirds !== Infinity
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${birdsPercent}%` }}
              ></div>
            </div>
          </div>

          {/* 3. Poultry Types */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-700">Poultry Types Supported</span>
              <span className="text-slate-900">
                {poultryTypesCount} / {maxPoultryTypes === Infinity ? 'Unlimited' : maxPoultryTypes} types{' '}
                <span className="text-slate-400">({poultryTypesPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  poultryTypesPercent >= 100 && maxPoultryTypes !== Infinity
                    ? 'bg-rose-600'
                    : poultryTypesPercent >= 80 && maxPoultryTypes !== Infinity
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${poultryTypesPercent}%` }}
              ></div>
            </div>
          </div>

          {/* 4. Staff Accounts */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-700">Staff & Worker Accounts</span>
              <span className="text-slate-900">
                {staffCount} / {maxUsers === Infinity ? 'Unlimited' : maxUsers} user{maxUsers > 1 ? 's' : ''}{' '}
                <span className="text-slate-400">({staffPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-700 transition-all"
                style={{ width: `${staffPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              If you reach a plan limit, existing data remains safe. To expand flock limits or bird capacity, select an upgrade below.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Available Plans & Upgrades with Monthly/Annual Toggle */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Available Subscription Plans</h3>
            <p className="text-xs text-slate-500">Switch or upgrade your plan anytime. See current annual savings on each plan.</p>
          </div>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                Annual pricing
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansLoading && <p role="status">Loading plans…</p>}
          {plansError && <p role="alert">{plansError} <button onClick={retryPlans}>Retry</button></p>}
          <div className="col-span-full"><PlanCards plans={plans} cycle={billingCycle} currentPlanId={currentPlanId} onChoose={p => handleOpenCheckout(p.id.toUpperCase())}/></div>
        </div>
      </div>

      {/* 4. Payment History & Invoices */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Payment & Billing History</h3>
            <p className="text-xs text-slate-500">Official transaction receipts and payment records</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">All prices in Nigerian Naira (₦)</span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No payment transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Cycle</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-slate-700">{p.date}</td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">{p.reference || p.id}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{p.description}</td>
                    <td className="py-3.5 px-3 text-slate-600">{p.billingCycle}</td>
                    <td className="py-3.5 px-3 font-black text-slate-900">
                      ₦{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-all inline-flex items-center gap-1"
                      >
                        <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Paystack Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Paystack Header */}
            <div className="bg-[#0BA4DB] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Paystack</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded font-semibold">Secured Checkout</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-white/80 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Merchant</span>
                <p className="text-sm font-extrabold text-slate-900">PoultryPro SaaS Platform</p>
                <p className="text-xs text-slate-500">Account: {user?.email || 'farmer@poultrypro.ng'}</p>
              </div>

              {notificationMsg?.type === 'error' && <p role="alert" className="text-red-700 text-sm">{notificationMsg.text}</p>}
              {/* Price summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Selected Plan:</span>
                  <strong className="text-slate-900">{selectedPlanInfo.name} ({billingCycle})</strong>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-slate-900 mt-2 pt-2 border-t border-slate-200">
                  <span>Amount to Pay:</span>
                  <span className="text-emerald-700 text-base">
                    {billingCycle === 'annual' ? selectedPlanInfo.annualPriceFormatted : selectedPlanInfo.priceFormatted}
                  </span>
                </div>
              </div>

              <p className="p-4 bg-slate-50 text-sm rounded-xl">Continue to Paystack to pay securely by card or bank transfer. Your plan activates after the server verifies your payment.</p>

              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full py-3 bg-[#0BA4DB] hover:bg-[#098bb9] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <span>Verifying Transaction with Paystack...</span>
                ) : (
                  <span>
                    Pay{' '}
                    {billingCycle === 'annual'
                      ? selectedPlanInfo.annualPriceFormatted
                      : selectedPlanInfo.priceFormatted}
                  </span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Payments are processed securely on Paystack.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* 6. Receipt / Invoice Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-slate-900">
                    Poultry<span className="text-emerald-600">Pro</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                    Official Receipt
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Receipt ID: {selectedReceipt.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Farm & Transaction Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block">Billed To:</span>
                <p className="font-bold text-slate-900">{user?.name || 'Farm Owner'}</p>
                <p className="text-slate-600">{farm?.name || 'My Poultry Farm'}</p>
                <p className="text-slate-500">{user?.email || 'farmer@poultrypro.ng'}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold uppercase block">Payment Details:</span>
                <p className="font-bold text-slate-900">Date: {selectedReceipt.date}</p>
                <p className="text-slate-600">Ref: {selectedReceipt.reference}</p>
                <p className="text-slate-500">Method: {selectedReceipt.method || 'Paystack Gateway'}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Description</th>
                    <th className="py-2.5 px-3 text-center">Cycle</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">{selectedReceipt.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{selectedReceipt.billingCycle}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      ₦{Number(selectedReceipt.amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Paid:</span>
              <span className="text-base text-emerald-700">₦{Number(selectedReceipt.amount).toLocaleString()}</span>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all text-center"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { getCatalog, request } from './planCatalog.js';
import { PLANS, PLAN_DETAILS } from '../constants/plans.js';

const STORAGE_KEY = 'poultrypro_subscription_data';
const CURRENT_PLAN_KEY = 'poultrypro_current_plan';

export const migratePlanId = (legacyPlanId) => {
  if (!legacyPlanId) return PLANS.BASIC;
  const upper = String(legacyPlanId).toUpperCase();
  if (upper === 'ENTERPRISE' || upper === 'PRO') return PLANS.ENTERPRISE;
  if (upper === 'PROFESSIONAL') return PLANS.PROFESSIONAL;
  if (upper === 'BASIC' || upper === 'STARTER' || upper === 'FREE') return PLANS.BASIC;
  return PLANS.BASIC;
};

/**
 * Returns active plans from the shared server catalog.
 * Automatically synchronizes whenever Admin modifies plans.
 */
export const getActiveSubscriptionPlans = () => getCatalog().filter(p => p.status === 'Active');

/**
 * Initialize default 14-day free trial subscription data
 */
export const createInitialSubscription = (selectedPlan = PLANS.BASIC, billingCycle = 'monthly') => {
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  const normalizedCycle = billingCycle === 'annual' ? 'annual' : 'monthly';

  return {
    planId: migratePlanId(selectedPlan),
    status: 'trial', // 'trial' | 'active' | 'expired' | 'cancelled'
    billingCycle: normalizedCycle, // 'monthly' | 'annual'
    startDate: now.toISOString(),
    trialEndsAt: trialEnds.toISOString(),
    renewalDate: trialEnds.toISOString(),
    trialDaysTotal: 14,
    autoRenew: true,
    trialUsed: true,
    paymentHistory: [
      {
        id: `TX-TRIAL-${Date.now().toString().slice(-6)}`,
        date: now.toISOString().split('T')[0],
        description: `14-Day Free Trial Activated (${PLAN_DETAILS[selectedPlan]?.name || 'Basic'} Plan)`,
        billingCycle: 'Trial',
        amount: 0,
        amountFormatted: '₦0',
        status: 'Successful',
        reference: `TRIAL-${Date.now().toString().slice(-8)}`,
        method: 'Free Trial'
      }
    ]
  };
};

export const subscriptionService = {
  getSubscription: () => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return createInitialSubscription(PLANS.STARTER);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      let sub = null;
      if (raw) {
        sub = JSON.parse(raw);
      }

      if (!sub) {
        // Check if there was an old plan stored
        const oldPlan = localStorage.getItem(CURRENT_PLAN_KEY);
        sub = createInitialSubscription(oldPlan || PLANS.STARTER);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
        localStorage.setItem(CURRENT_PLAN_KEY, sub.planId);
      } else {
        // Ensure planId is migrated if old
        sub.planId = migratePlanId(sub.planId);
      }

      // Check trial expiration dynamically
      if (sub.status === 'trial' && sub.trialEndsAt) {
        const remainingMs = new Date(sub.trialEndsAt).getTime() - Date.now();
        if (remainingMs <= 0) {
          sub.status = 'expired';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
        }
      }

      return sub;
    } catch (err) {
      console.error('Error reading subscription data:', err);
      return createInitialSubscription(PLANS.STARTER);
    }
  },

  saveSubscription: (data) => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('subscription_updated'));
      if (data.planId) {
        localStorage.setItem(CURRENT_PLAN_KEY, data.planId);
      }
    } catch (err) {
      console.error('Error saving subscription data:', err);
    }
  },

  getPlanDetails: (planId) => {
    const validId = migratePlanId(planId);
    return PLAN_DETAILS[validId] || PLAN_DETAILS[PLANS.STARTER];
  },

  /**
   * Check if a subscription or 14-day free trial is expired.
   * Handles:
   * - Active subscriptions (checking renewal date and autoRenew status)
   * - Expired subscriptions
   * - 14-day free trials (calculating remaining duration)
   * - Expired trials
   * - Cancelled subscriptions (valid until period end, then expired)
   * - Missing subscription records (safe fallback)
   * - Invalid expiration dates (graceful fallback)
   * - Automatic subscription renewals
   */
  isExpired: (subData) => {
    try {
      const sub = subData || subscriptionService.getSubscription();
      if (!sub || typeof sub !== 'object') return false;

      if (sub.status === 'expired') return true;

      const now = Date.now();

      // Case: 14-day free trial
      if (sub.status === 'trial') {
        if (!sub.trialEndsAt) {
          // If trialEndsAt is missing, compute from startDate if available
          if (sub.startDate) {
            const start = new Date(sub.startDate).getTime();
            if (!isNaN(start)) {
              const trialPeriod = (sub.trialDaysTotal || 14) * 24 * 60 * 60 * 1000;
              const hasExpired = (start + trialPeriod) <= now;
              if (hasExpired && sub.status !== 'expired') {
                sub.status = 'expired';
                subscriptionService.saveSubscription(sub);
              }
              return hasExpired;
            }
          }
          return false;
        }

        const endsAt = new Date(sub.trialEndsAt).getTime();
        if (isNaN(endsAt)) return false; // Invalid date fallback safely

        if (endsAt <= now) {
          if (sub.status !== 'expired') {
            sub.status = 'expired';
            subscriptionService.saveSubscription(sub);
          }
          return true;
        }
        return false;
      }

      // Case: Active subscription
      if (sub.status === 'active') {
        if (!sub.renewalDate) return false;
        const renewal = new Date(sub.renewalDate).getTime();
        if (isNaN(renewal)) return false; // Invalid date fallback safely

        if (renewal <= now) {
          sub.status = 'expired';
          subscriptionService.saveSubscription(sub);
          return true;
        }
        return false;
      }

      // Case: Cancelled subscription
      if (sub.status === 'cancelled') {
        const expiryDate = sub.renewalDate || sub.trialEndsAt;
        if (!expiryDate) return true;
        const end = new Date(expiryDate).getTime();
        if (isNaN(end)) return true;
        return end <= now;
      }

      return false;
    } catch (err) {
      console.error('Error verifying subscription expiration:', err);
      return false;
    }
  },

  /**
   * Calculate remaining trial days
   */
  getRemainingTrialDays: (subData) => {
    try {
      const sub = subData || subscriptionService.getSubscription();
      if (!sub || sub.status !== 'trial' || !sub.trialEndsAt) return 0;
      const diffMs = new Date(sub.trialEndsAt).getTime() - Date.now();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch (err) {
      console.error('Error calculating remaining trial days:', err);
      return 0;
    }
  },

  /**
   * Check if paid actions (e.g. creating new flocks, birds) are allowed
   * Returns false if trial or subscription is expired
   */
  canPerformPaidAction: (subData) => {
    try {
      const sub = subData || subscriptionService.getSubscription();
      if (!sub) return { allowed: true };
      const expired = subscriptionService.isExpired(sub);
      if (expired) {
        return {
          allowed: false,
          reason: 'Your subscription or 14-day free trial has expired. You can view all existing records, but must activate a plan to create new flocks and records.'
        };
      }
      return { allowed: true };
    } catch (err) {
      console.error('Error checking canPerformPaidAction:', err);
      return { allowed: true };
    }
  },

  /**
   * Check flock limit for the active plan
   */
  checkFlockLimit: (currentActiveFlocks = 0, subData) => {
    const sub = subData || subscriptionService.getSubscription();
    const plan = subscriptionService.getPlanDetails(sub.planId);
    const max = plan.limits.maxFlocks;

    if (max !== Infinity && currentActiveFlocks >= max) {
      return {
        allowed: false,
        limit: max,
        current: currentActiveFlocks,
        planName: plan.name,
        message: `Your ${plan.name} plan is limited to ${max} active flocks (${currentActiveFlocks}/${max} currently used). Upgrade your plan to manage more flocks.`
      };
    }
    return { allowed: true, limit: max, current: currentActiveFlocks };
  },

  /**
   * Check bird capacity limit for the active plan
   */
  checkBirdCapacity: (currentBirds = 0, additionalBirds = 0, subData) => {
    const sub = subData || subscriptionService.getSubscription();
    const plan = subscriptionService.getPlanDetails(sub.planId);
    const max = plan.limits.maxBirds;
    const totalAfterAddition = currentBirds + Number(additionalBirds);

    if (max !== Infinity && totalAfterAddition > max) {
      return {
        allowed: false,
        limit: max,
        current: currentBirds,
        attempted: totalAfterAddition,
        planName: plan.name,
        message: `Adding ${additionalBirds} birds would exceed your ${plan.name} plan capacity of ${max.toLocaleString()} birds (current: ${currentBirds.toLocaleString()}, would become: ${totalAfterAddition.toLocaleString()}). Upgrade your plan to expand capacity.`
      };
    }
    return { allowed: true, limit: max, current: currentBirds };
  },

  /**
   * Check poultry types limit
   */
  checkPoultryTypeLimit: (currentTypesCount = 0, subData) => {
    const sub = subData || subscriptionService.getSubscription();
    const plan = subscriptionService.getPlanDetails(sub.planId);
    const max = plan.limits.maxPoultryTypes;

    if (max !== Infinity && currentTypesCount >= max) {
      return {
        allowed: false,
        limit: max,
        current: currentTypesCount,
        planName: plan.name,
        message: `Your ${plan.name} plan supports up to ${max} poultry type${max > 1 ? 's' : ''}. Upgrade to Pro (3 types) or Enterprise (unlimited) to manage more bird categories.`
      };
    }
    return { allowed: true, limit: max, current: currentTypesCount };
  },

  /**
   * Upgrade or downgrade plan
   */
  switchPlan: async (newPlanId, billingCycle = 'monthly') => {
    const checkout = await request('/subscription/checkout', { method: 'POST', body: JSON.stringify({ planId: newPlanId, billingCycle }) });
    window.location.assign(checkout.authorizationUrl);
  },

  /**
   * Cancel auto renewal
   */
  toggleAutoRenewal: async () => {
    const sub = subscriptionService.getSubscription();
    const updated = await request('/subscription/auto-renew',{method:'PATCH',body:JSON.stringify({autoRenew:!sub.autoRenew})});
    const merged = {...sub,...updated,paymentHistory:sub.paymentHistory};
    subscriptionService.saveSubscription(merged);
    return merged;
  }
};

export const isExpired = (subData) => subscriptionService.isExpired(subData);
export const canPerformPaidAction = (subData) => subscriptionService.canPerformPaidAction(subData);
export const getRemainingTrialDays = (subData) => subscriptionService.getRemainingTrialDays(subData);


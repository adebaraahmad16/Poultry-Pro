/**
 * Comprehensive Subscription Expiration & Status Test Suite
 * Tests subscriptionService.isExpired and status validation
 */

import { subscriptionService, isExpired, canPerformPaidAction, getRemainingTrialDays } from '../subscriptionService.js';
import { PLANS, PLAN_DETAILS } from '../../constants/plans.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- POULTRYPRO SUBSCRIPTION EXPIRATION TESTS ---');

// 1. Missing subscription records
console.log('\n1. Handling Missing Subscription Records:');
assert(isExpired(null) === false, 'isExpired(null) should return false without crashing');
assert(isExpired(undefined) === false, 'isExpired(undefined) should return false without crashing');
assert(isExpired({}) === false, 'isExpired({}) empty object should return false without crashing');
assert(isExpired('not-an-object') === false, 'isExpired with invalid type should return false without crashing');

// 2. Active subscriptions
console.log('\n2. Active Subscriptions:');
const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const activeSubFuture = {
  planId: PLANS.PROFESSIONAL,
  status: 'active',
  renewalDate: futureDate,
  autoRenew: true
};
assert(isExpired(activeSubFuture) === false, 'Active subscription with future renewalDate is not expired');

const activeSubNoRenewal = {
  planId: PLANS.ENTERPRISE,
  status: 'active'
};
assert(isExpired(activeSubNoRenewal) === false, 'Active subscription without renewalDate defaults to not expired');

// 3. Expired subscriptions
console.log('\n3. Expired Subscriptions:');
const explicitlyExpired = {
  planId: PLANS.STARTER,
  status: 'expired',
  renewalDate: pastDate
};
assert(isExpired(explicitlyExpired) === true, 'Explicit status="expired" returns true');

// 4. 14-day free trials & Expired trials
console.log('\n4. 14-Day Free Trials:');
const activeTrial = {
  planId: PLANS.STARTER,
  status: 'trial',
  trialEndsAt: futureDate
};
assert(isExpired(activeTrial) === false, 'Trial with future trialEndsAt is not expired');
assert(getRemainingTrialDays(activeTrial) > 0, 'getRemainingTrialDays returns remaining days for active trial');

const expiredTrial = {
  planId: PLANS.STARTER,
  status: 'trial',
  trialEndsAt: pastDate
};
assert(isExpired(expiredTrial) === true, 'Trial with past trialEndsAt is expired');

const trialWithMissingEndsAt = {
  planId: PLANS.PROFESSIONAL,
  status: 'trial',
  startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
};
assert(isExpired(trialWithMissingEndsAt) === true, 'Trial with missing trialEndsAt uses startDate + 14d correctly');

// 5. Cancelled subscriptions
console.log('\n5. Cancelled Subscriptions:');
const cancelledInGracePeriod = {
  planId: PLANS.ENTERPRISE,
  status: 'cancelled',
  renewalDate: futureDate
};
assert(isExpired(cancelledInGracePeriod) === false, 'Cancelled sub still within period is not expired');

const cancelledPastPeriod = {
  planId: PLANS.ENTERPRISE,
  status: 'cancelled',
  renewalDate: pastDate
};
assert(isExpired(cancelledPastPeriod) === true, 'Cancelled sub past renewalDate is expired');

const cancelledNoDate = {
  planId: PLANS.ENTERPRISE,
  status: 'cancelled'
};
assert(isExpired(cancelledNoDate) === true, 'Cancelled sub with no date is expired');

// 6. Invalid dates
console.log('\n6. Invalid Expiration Dates:');
const invalidTrialDate = {
  planId: PLANS.STARTER,
  status: 'trial',
  trialEndsAt: 'not-a-valid-date-string'
};
assert(isExpired(invalidTrialDate) === false, 'Invalid trial date string does not crash and defaults to false');

const invalidActiveDate = {
  planId: PLANS.PROFESSIONAL,
  status: 'active',
  renewalDate: 'invalid-iso-date'
};
assert(isExpired(invalidActiveDate) === false, 'Invalid renewalDate does not crash and keeps active');

// 7. Subscription renewals
console.log('\n7. Automatic Subscription Renewals:');
const subToRenew = {
  planId: PLANS.PROFESSIONAL,
  status: 'active',
  billingCycle: 'monthly',
  renewalDate: pastDate,
  autoRenew: true
};
const wasExpiredBeforeAutoRenew = isExpired(subToRenew);
assert(wasExpiredBeforeAutoRenew === true, 'Auto-renew setting does not grant unpaid access');
assert(subToRenew.renewalDate === pastDate, 'Renewal date stays unchanged until payment is verified');

const subWithDisabledAutoRenew = {
  planId: PLANS.STARTER,
  status: 'active',
  billingCycle: 'monthly',
  renewalDate: pastDate,
  autoRenew: false
};
assert(isExpired(subWithDisabledAutoRenew) === true, 'Active sub with autoRenew=false past renewalDate expires');

// 8. Paid actions check
console.log('\n8. Paid Actions Permissions:');
assert(canPerformPaidAction(activeSubFuture).allowed === true, 'canPerformPaidAction allowed for active sub');
assert(canPerformPaidAction(explicitlyExpired).allowed === false, 'canPerformPaidAction denied for expired sub');
assert(typeof canPerformPaidAction(explicitlyExpired).reason === 'string', 'canPerformPaidAction provides explanation reason');

// 9. All 3 plans limits verification
console.log('\n9. Plan Limits Verification:');
assert(PLAN_DETAILS[PLANS.STARTER].limits.maxFlocks === 3, 'Basic has 3 flocks limit');
assert(PLAN_DETAILS[PLANS.PROFESSIONAL].limits.maxFlocks === 15, 'Pro has 15 flocks limit');
assert(PLAN_DETAILS[PLANS.ENTERPRISE].limits.maxFlocks === Infinity, 'Enterprise has unlimited flocks');

console.log(`\n========================================`);
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

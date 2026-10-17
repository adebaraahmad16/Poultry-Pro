import { DEFAULT_PLANS, normalizePlanId, presentPlan } from '../../shared/subscriptionPlans.js';
export const PLANS = { BASIC: 'BASIC', STARTER: 'BASIC', FREE: 'BASIC', PROFESSIONAL: 'PROFESSIONAL', ENTERPRISE: 'ENTERPRISE', PRO: 'ENTERPRISE' };
export const PLAN_DETAILS = {};
export function applyPlanCatalog(plans) {
 for (const raw of plans) {
  const p = presentPlan(raw,plans);
  const limits = Object.fromEntries(['maxFlocks','maxBirds','maxPoultryTypes','maxUsers','maxFarms'].map(k => [k, p[k] ?? Infinity]));
  Object.assign(limits, p.capabilities, { pdfExport: p.capabilities.dataExport, reportsAccess: p.id === 'basic' ? 'Basic' : 'Advanced', analyticsAccess: p.id === 'basic' ? 'Basic' : 'Full', inventoryAccess: 'Full', notificationsAccess: 'Full' });
  const detail = { ...p, id: p.id.toUpperCase(), limits, priceNgn: p.monthlyPrice, annualPriceNgn: p.annualPrice, priceFormatted: `₦${p.monthlyPrice.toLocaleString()}`, annualPriceFormatted: `₦${p.annualPrice.toLocaleString()}`, popular: p.isMostPopular, badge: p.name, tagline: p.description };
  PLAN_DETAILS[p.id] = detail; PLAN_DETAILS[p.id.toUpperCase()] = detail;
 }
 for (const alias of ['STARTER','FREE','starter','free']) PLAN_DETAILS[alias] = PLAN_DETAILS.BASIC;
 PLAN_DETAILS.PRO = PLAN_DETAILS.ENTERPRISE;
}
applyPlanCatalog(DEFAULT_PLANS);
export const getAllPlans = () => ['basic','professional','enterprise'].map(id => PLAN_DETAILS[id]);
export const getPlanLimits = id => (PLAN_DETAILS[normalizePlanId(id)] || PLAN_DETAILS.BASIC).limits;
export const isFeatureAllowed = (id, key) => Boolean(getPlanLimits(id)[key]);

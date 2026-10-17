export const LIMIT_KEYS = ['maxFlocks', 'maxBirds', 'maxPoultryTypes', 'maxUsers', 'maxFarms'];
export const FEATURE_LABELS = { feedManagement: 'Feed management', healthManagement: 'Health management', mortalityTracking: 'Mortality tracking', eggProduction: 'Egg production records', financialManagement: 'Financial management', reportsAnalytics: 'Reports and analytics', profitabilityAnalysis: 'Profitability analysis', dataExport: 'Data export', staffManagement: 'Staff management', multipleFarms: 'Multiple farm locations', prioritySupport: 'Priority support', vaccinationReminders: 'Vaccination reminders' };
// Preserve identifiers: PRO was historically an Enterprise alias.
export const normalizePlanId = id => ({ starter: 'basic', free: 'basic', pro: 'enterprise' }[String(id || '').toLowerCase()] || String(id || 'basic').toLowerCase());
const common = { feedManagement: true, healthManagement: true, mortalityTracking: true, eggProduction: true, financialManagement: true, reportsAnalytics: true, staffManagement: true, vaccinationReminders: true };
export const DEFAULT_PLANS = [
 { id: 'basic', name: 'Basic', description: 'Essential farm management tools for small-scale poultry farmers.', monthlyPrice: 2500, annualPrice: 25000, maxFlocks: 3, maxBirds: 500, maxPoultryTypes: 1, maxUsers: 1, maxFarms: 1, capabilities: { ...common, profitabilityAnalysis: false, dataExport: false, multipleFarms: false, prioritySupport: false } },
 { id: 'professional', name: 'Pro', description: 'Advanced management tools for growing poultry businesses.', monthlyPrice: 5000, annualPrice: 50000, maxFlocks: 15, maxBirds: 5000, maxPoultryTypes: 3, maxUsers: 5, maxFarms: 1, capabilities: { ...common, profitabilityAnalysis: true, dataExport: true, multipleFarms: false, prioritySupport: true } },
 { id: 'enterprise', name: 'Enterprise', description: 'Complete farm management solutions for large-scale poultry operations.', monthlyPrice: 12000, annualPrice: 120000, maxFlocks: null, maxBirds: null, maxPoultryTypes: null, maxUsers: null, maxFarms: null, capabilities: { ...common, profitabilityAnalysis: true, dataExport: true, multipleFarms: true, prioritySupport: true } }
].map(p => ({ ...p, status: 'Active', version: 1, isMostPopular: p.id === 'professional' }));
export const formatLimit = value => value == null ? 'Unlimited' : Number(value).toLocaleString('en-NG');
export const annualSavings = p => Math.max(0, Math.round((1 - p.annualPrice / (p.monthlyPrice * 12)) * 100));
export function planFeatures(p, catalog = DEFAULT_PLANS) {
 const parent = catalog.find(x => x.id === (p.id === 'professional' ? 'basic' : p.id === 'enterprise' ? 'professional' : ''));
 const inherited = parent && Object.keys(parent.capabilities).every(k => !parent.capabilities[k] || p.capabilities[k]);
 const financial = p.id === 'basic' ? 'Basic financial management' : 'Advanced financial management';
 const reports = p.id === 'basic' ? 'Basic reports and analytics' : p.id === 'enterprise' ? 'Comprehensive farm analytics' : 'Advanced reports and analytics';
 return [
  p.maxFlocks == null ? 'Unlimited active flocks' : `Maximum of ${formatLimit(p.maxFlocks)} active flocks`,
  p.maxBirds == null ? 'Unlimited bird capacity' : `Maximum capacity of ${formatLimit(p.maxBirds)} birds`,
  p.maxPoultryTypes == null ? 'Unlimited poultry types' : `Support for ${p.maxPoultryTypes} poultry type${p.maxPoultryTypes === 1 ? '' : 's'}`,
  ...(inherited ? [`All ${parent.name} features`] : []),
  ...Object.entries(p.capabilities).filter(([,v]) => v).filter(([k]) => !['staffManagement','multipleFarms'].includes(k)).map(([k]) => k === 'financialManagement' ? financial : k === 'reportsAnalytics' ? reports : k === 'profitabilityAnalysis' ? (p.id === 'enterprise' ? 'Advanced profitability insights' : 'Farm profitability analysis') : k === 'dataExport' && p.id === 'enterprise' ? 'Complete data export' : k === 'prioritySupport' && p.id === 'enterprise' ? 'Priority customer support' : FEATURE_LABELS[k]),
  p.maxUsers == null ? 'Unlimited staff accounts' : p.maxUsers === 1 ? '1 staff account' : `Up to ${formatLimit(p.maxUsers)} staff accounts`,
  p.maxFarms === 1 ? 'Single farm location' : p.maxFarms == null ? 'Multiple farm locations' : `Up to ${formatLimit(p.maxFarms)} farm locations`
 ];
}
export const presentPlan = (p, catalog = DEFAULT_PLANS) => ({ ...p, features: planFeatures(p, catalog), cta: `Choose ${p.name}` });
export function validatePlan(p) {
 if (!DEFAULT_PLANS.some(d => d.id === p.id)) throw new Error('Unknown plan identifier');
 if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 80) throw new Error('Plan name must contain 1–80 characters');
 if (typeof p.description !== 'string' || !p.description.trim() || p.description.length > 1000) throw new Error('Description is required (maximum 1,000 characters)');
 if (!['Active','Disabled'].includes(p.status)) throw new Error('Invalid plan status');
 for (const k of ['monthlyPrice','annualPrice']) if (!Number.isFinite(p[k]) || p[k] <= 0 || p[k] > 100000000 || Math.abs(p[k]*100-Math.round(p[k]*100)) > 0.00001) throw new Error('Prices must be positive amounts with at most two decimal places');
 for (const k of LIMIT_KEYS) if (p[k] !== null && (!Number.isSafeInteger(p[k]) || p[k] < 1)) throw new Error(`${k} must be a positive whole number or Unlimited`);
 for (const k of Object.keys(FEATURE_LABELS)) if (typeof p.capabilities?.[k] !== 'boolean') throw new Error(`Select a valid value for ${FEATURE_LABELS[k]}`);
 return p;
}

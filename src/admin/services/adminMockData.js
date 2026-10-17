import { DEFAULT_PLANS } from '../../../shared/subscriptionPlans.js';
/**
 * PoultryPro Super Admin — Seed Data
 *
 * DESIGN DECISION: All transactional arrays (farmers, farms, payments,
 * notifications, tickets, audit logs) start EMPTY. They populate only from
 * real user registrations and admin actions. No demo figures exist.
 *
 * What IS seeded:
 *  - Admin credentials (admin login must always work)
 *  - Subscription plan configs (pricing / limits — static business config)
 *  - Poultry category catalogue (system-level taxonomy)
 *  - Platform settings (global config knobs)
 *  - Website CMS content (landing-page copy)
 */

// ─── Admin Users ──────────────────────────────────────────────────────────────
export const initialAdminUsers = [
  {
    id: 'admin-1',
    name: 'Adebara Ahmad',
    email: 'admin@poultrypro.ng',
    role: 'Super Admin',
    avatar: '',
    phone: '+234 803 123 4567',
    status: 'Active',
    lastLogin: 'Never'
  }
];

// ─── Transactional Collections — start empty ─────────────────────────────────
/** Populated when real users register via the farmer-facing app */
export const initialFarmers = [];

/** Populated when farmers create farm profiles */
export const initialFarms = [];

/** Populated from Paystack webhook events / manual admin verification */
export const initialPayments = [];


/** Populated when admin sends platform broadcasts */
export const initialNotifications = [];

/** Populated from farmer support form submissions */
export const initialSupportTickets = [];

/** Populated automatically by adminService.logAction() on every admin action */
export const initialAuditLogs = [];

// ─── Subscription Plan Configuration ─────────────────────────────────────────
// These are business-config entries, not user records — always seeded.
export const initialSubscriptionPlans = DEFAULT_PLANS;

// ─── Poultry Category Catalogue ───────────────────────────────────────────────
// System taxonomy — seeded once, managed by admin via PoultryTypes page.
export const initialPoultryCategories = [
  {
    id: 'broiler',
    name: 'Broilers',
    purpose: 'Meat Production (6-8 week cycle)',
    description: 'Fast-growing meat birds optimized for rapid weight gain and feed conversion ratio (FCR).',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Bird'
  },
  {
    id: 'layer',
    name: 'Layers',
    purpose: 'Egg Production (Table Eggs)',
    description: 'High-yield egg-laying hens producing table eggs with daily crate collection tracking.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Egg'
  },
  {
    id: 'cockerel',
    name: 'Cockerels',
    purpose: 'Dual Purpose / Seasonal Meat',
    description: 'Hardy slow-growing roosters raised for festive seasons and premium organic poultry meat.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Feather'
  },
  {
    id: 'turkey',
    name: 'Turkeys',
    purpose: 'Commercial Meat & Festive Markets',
    description: 'Large commercial and local turkey breeds monitored for high carcass weight.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Flame'
  },
  {
    id: 'duck',
    name: 'Ducks',
    purpose: 'Meat & Heavy Eggs',
    description: 'Pekin and Muscovy waterfowls raised in free-range and semi-intensive pen setups.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Waves'
  },
  {
    id: 'quail',
    name: 'Quails',
    purpose: 'Medicinal Eggs & Gourmet Meat',
    description: 'Compact Coturnix quails with high oviposition frequency and low feed requirements.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Sparkles'
  },
  {
    id: 'guinea_fowl',
    name: 'Guinea Fowls',
    purpose: 'Exotic Meat & Hard Shell Eggs',
    description: 'High disease-resistant birds popular across Sahelian and guinea savannah zones.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Wind'
  },
  {
    id: 'geese',
    name: 'Geese',
    purpose: 'Premium Roast Meat & Down Feathers',
    description: 'Grazer poultry raised on open pasture for organic specialty markets.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'Compass'
  },
  {
    id: 'breeders',
    name: 'Breeders (Parent Stock)',
    purpose: 'Hatching Eggs & Day-Old Chicks (DOC)',
    description: 'Pedigree flocks managed under biosecurity for fertilized egg and hatchery supply.',
    status: 'Active',
    registeredFarms: 0,
    totalFlocks: 0,
    totalBirds: 0,
    icon: 'ShieldCheck'
  }
];

// ─── Platform Settings ────────────────────────────────────────────────────────
export const initialPlatformSettings = {
  // A. General Settings
  platformName: 'PoultryPro Nigeria',
  platformTagline: 'Poultry Farm Management System | Nigeria',
  platformDescription: 'Comprehensive cloud-based operating system designed for poultry farmers across Nigeria to track flocks, feed, egg collection, health, and finances.',
  defaultCurrency: '₦',
  currencyCode: 'NGN',
  timezone: 'Africa/Lagos (WAT)',
  dateFormat: 'DD/MM/YYYY',
  platformLogoUrl: '',
  faviconUrl: '',
  maintenanceMode: false,
  allowRegistrations: true,

  // B. Account / Contact Settings
  adminContactEmail: 'admin@poultrypro.ng',
  adminContactPhone: '+234 803 123 4567',
  adminNotificationEmail: 'alerts@poultrypro.ng',
  supportEscalationEmail: 'escalations@poultrypro.ng',

  // C. Security Settings
  twoFactorRequired: false,
  sessionTimeoutMinutes: 60,
  passwordMinLength: 8,
  requireSpecialChars: true,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  autoRevokeSessions: true,

  // D. Subscription Settings
  defaultFreePlan: 'Basic',
  trialDurationDays: 14,
  renewalReminderDays: 7,
  gracePeriodDays: 3,
  autoDowngradeOnExpiry: true,

  // E. Payment Settings
  paystackPublicKey: '',
  paystackSecretKeyMasked: '',
  flutterwavePublicKey: '',
  flutterwaveSecretKeyMasked: '',
  supportedPaymentMethods: ['Card', 'Bank Transfer', 'USSD'],
  paymentVerificationMode: 'Automated Webhooks',
  refundWindowDays: 7,
  transactionEmailAlerts: true,

  // F. Notification Settings
  emailAlertsEnabled: true,
  inAppAlertsEnabled: true,
  newFarmerSignupAlerts: true,
  paymentReceivedAlerts: true,
  systemAnnouncements: true,
  subscriptionExpiryReminderAlerts: true,

  // G. Appearance Settings
  defaultTheme: 'light',
  sidebarDefaultExpanded: true,
  compactTables: false,
  primaryColor: '#15803D',
  density: 'comfortable',

  // H. Data & Privacy
  dataRetentionDays: 365,
  allowFarmerDataExport: true,
  anonymizeDeletedAccounts: true,
  privacyPolicyUrl: 'https://poultrypro.ng/privacy',
  termsOfServiceUrl: 'https://poultrypro.ng/terms',
  automaticDailyBackups: true
};

// ─── Subscription System Settings ────────────────────────────────────────────
export const initialSubscriptionSettings = {
  // A. General Settings
  newSubscriptionsEnabled: true,
  freeTrialsEnabled: true,
  trialDurationDays: 14,
  annualBillingEnabled: true,
  renewalReminderDays: 7,
  expirationReminderDays: 3,

  // B. Renewal Settings
  autoRenewalAvailable: true,
  renewalNotificationDays: 7,
  failedPaymentRetryDays: 3,
  gracePeriodDays: 3,

  // C. Notification Settings
  notifyOnActivation: true,
  notifyOnUpcomingExpiry: true,
  notifyOnRenewal: true,
  notifyOnFailedPayment: true,
  notifyOnCancellation: true,
  notifyOnTrialExpiry: true,
  notifyOnPlanChange: true,

  // D. Payment Settings (display only — secrets managed server-side)
  paymentGateway: 'Paystack',
  gatewayStatus: 'Active',
  paymentCurrency: 'NGN',
  currencySymbol: '₦',
  paymentMethods: ['Card', 'Bank Transfer', 'USSD'],
  verificationMode: 'Automated Webhooks'
};

// ─── Website / CMS Content ────────────────────────────────────────────────────
export const initialWebsiteContent = {
  hero: {
    headline: 'Smart Management. Healthier Flocks. Better Profits.',
    subheadline: 'The complete cloud poultry operating system built for Nigerian poultry farmers — track broilers, layers, feed conversion, egg collections, and sales profitability in real time.',
    ctaPrimary: 'Start Free Farm Account',
    ctaSecondary: 'Explore Features'
  },
  contact: {
    email: 'hello@poultrypro.ng',
    phone: '+234 803 123 4567',
    whatsapp: '+234 803 123 4567',
    office: 'Plot 14 Agro-Innovation Hub, Fate Road, Ilorin, Kwara State, Nigeria'
  },
  faqs: [
    { q: 'Is PoultryPro free to start?', a: 'Yes. PoultryPro provides a 14-day free trial supporting all features so you can evaluate the platform fully before choosing a paid plan.' },
    { q: 'Can I manage multiple types of poultry in one account?', a: 'Yes. You can manage broilers, layers, cockerels, turkeys, ducks, quails and more under a single farm account with isolated records.' },
    { q: 'Does PoultryPro work on smartphones with slow internet?', a: 'Yes. PoultryPro is lightweight, fully responsive, and caches records locally in case of network fluctuations.' }
  ]
};

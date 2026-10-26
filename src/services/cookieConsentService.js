/**
 * PoultryPro Cookie & Browser Storage Consent Service
 * Manages user preferences for essential, functional, analytics, and marketing storage.
 */

const STORAGE_KEY = 'poultrypro_cookie_consent';
const EVENT_OPEN_PREFERENCES = 'poultrypro_open_cookie_preferences';
const EVENT_CONSENT_UPDATED = 'poultrypro_cookie_consent_updated';
const POLICY_VERSION = '1.0';

export const DEFAULT_CONSENT = {
  essential: true, // Always required for authentication and security
  functional: true, // UI preferences, active flock / poultry type filter
  analytics: false, // Usage statistics (currently inactive)
  marketing: false, // Ad trackers (currently inactive)
  consented: false,
  timestamp: null,
  version: POLICY_VERSION,
};

/**
 * Retrieve saved consent preferences from localStorage
 */
export function getCookieConsent() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_CONSENT };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONSENT };
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      consented: Boolean(parsed.consented),
      timestamp: parsed.timestamp || null,
      version: parsed.version || POLICY_VERSION,
    };
  } catch (err) {
    console.warn('Failed to parse cookie consent:', err);
    return { ...DEFAULT_CONSENT };
  }
}

/**
 * Check whether the visitor has made an explicit consent decision
 */
export function hasUserConsented() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed.consented);
  } catch {
    return false;
  }
}

/**
 * Save user consent preferences
 */
export function saveCookieConsent({ functional = false, analytics = false, marketing = false }) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const state = {
    essential: true,
    functional: Boolean(functional),
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    consented: true,
    timestamp: new Date().toISOString(),
    version: POLICY_VERSION,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT_CONSENT_UPDATED, { detail: state }));
  } catch (err) {
    console.error('Failed to save cookie consent:', err);
  }
  return state;
}

/**
 * Accept all cookies & storage categories
 */
export function acceptAllCookies() {
  return saveCookieConsent({ functional: true, analytics: false, marketing: false });
}

/**
 * Reject all optional cookies & storage categories (essential only)
 */
export function rejectOptionalCookies() {
  return saveCookieConsent({ functional: false, analytics: false, marketing: false });
}

/**
 * Trigger the Cookie Preferences modal to open from anywhere in the app
 */
export function openCookiePreferencesModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN_PREFERENCES));
  }
}

export { EVENT_OPEN_PREFERENCES, EVENT_CONSENT_UPDATED, POLICY_VERSION };

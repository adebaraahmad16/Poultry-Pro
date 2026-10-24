/**
 * Centralized API configuration for PoultryPro frontend.
 * Supports two operational environments:
 * 1. Local Development: connects to local Express & XAMPP MySQL (http://localhost:5000/api).
 * 2. Vercel Production: loads frontend-only cleanly when no backend is configured,
 *    or connects securely to a valid HTTPS backend when VITE_API_BASE_URL is provided.
 */

export function configuredApiBase(env = {}) {
  return [env.VITE_API_BASE_URL, env.VITE_BACKEND_URL, env.VITE_API_URL]
    .find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

export function isLocalHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  return /^(localhost\.?|.*\.localhost\.?|127(?:\.\d+){3}|\[::(?:1|ffff:7f[0-9a-f]{2}:[0-9a-f]+)\]|0\.0\.0\.0)$/i.test(hostname);
}

/**
 * Normalizes an API base URL so that it always ends in /api without duplication or trailing slashes.
 */
export function normalizeApiBaseUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const url = raw.trim().replace(/\/+$/, '');
  if (!url) return '';
  if (url === '/api' || url.endsWith('/api')) {
    return url;
  }
  return `${url}/api`;
}

/**
 * Resolves the active API base URL safely based on environment and runtime location.
 * Prevents deployed websites from making broken requests to localhost.
 */
export function resolveApiBaseUrl(configured, isDev, pageOrigin) {
  let isLocalOrigin = false;
  if (pageOrigin) {
    try {
      isLocalOrigin = isLocalHost(new URL(pageOrigin).hostname);
    } catch {
      isLocalOrigin = false;
    }
  }

  // Local development or running on localhost / 127.0.0.1
  if (isDev || isLocalOrigin) {
    if (configured) {
      return normalizeApiBaseUrl(configured);
    }
    return 'http://localhost:5000/api';
  }

  // Deployed production environment (e.g., Vercel)
  if (!configured) {
    // Frontend-only mode: No backend URL configured.
    // Do NOT make requests to localhost from a public deployed site!
    return '';
  }

  try {
    const normalized = normalizeApiBaseUrl(configured);
    const api = new URL(normalized);
    if (api.protocol === 'https:' && !isLocalHost(api.hostname) && !api.username && !api.password) {
      return normalized;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Evaluates whether an explicitly provided backend URL has syntax or security issues.
 * Returns an empty string when no backend URL is set (valid frontend-only mode).
 */
export function apiConfigurationError(base, production, pageOrigin) {
  if (!production || !base || (typeof base === 'string' && !base.trim())) return '';
  try {
    if (pageOrigin && isLocalHost(new URL(pageOrigin).hostname)) return '';
    const normalized = normalizeApiBaseUrl(base);
    const api = new URL(normalized);
    if (api.protocol !== 'https:' || isLocalHost(api.hostname) || api.username || api.password || api.search || api.hash) {
      return 'The configured production backend URL must be a valid public HTTPS URL.';
    }
    return '';
  } catch {
    return 'The configured production backend URL could not be parsed as a valid URL.';
  }
}

const envBase = configuredApiBase(import.meta.env);
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const isDevMode = Boolean(import.meta.env?.DEV);

export const API_BASE_URL = resolveApiBaseUrl(envBase, isDevMode, runtimeOrigin);
export const API_CONFIGURATION_ERROR = apiConfigurationError(envBase, Boolean(import.meta.env?.PROD), runtimeOrigin);

/**
 * Returns true if an active backend URL is available and safe to query.
 */
export function isBackendConfigured() {
  return Boolean(API_BASE_URL && typeof API_BASE_URL === 'string' && API_BASE_URL.trim().length > 0);
}

export const BACKEND_UNAVAILABLE_MESSAGE =
  'The cloud backend is currently offline. The application is running in preview mode. To access full database features, run PoultryPro locally with XAMPP MySQL or connect a live backend.';



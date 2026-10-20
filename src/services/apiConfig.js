/**
 * Centralized API configuration for PoultryPro frontend.
 * Vite embeds VITE_API_BASE_URL at build time. Set it on the frontend project.
 * Accepts an absolute backend origin or a URL ending in /api.
 */

export function configuredApiBase(env = {}) {
  // Keep old deployments working while using one canonical variable in new setups.
  return [env.VITE_API_BASE_URL, env.VITE_BACKEND_URL, env.VITE_API_URL]
    .find(value => typeof value === 'string' && value.trim())?.trim() || '';
}
const configuredBase = configuredApiBase(import.meta.env);
const isLocalHost = hostname => /^(localhost\.?|.*\.localhost\.?|127(?:\.\d+){3}|\[::(?:1|ffff:7f[0-9a-f]{2}:[0-9a-f]+)\]|0\.0\.0\.0)$/i.test(hostname);
const localPage = typeof window !== 'undefined' && isLocalHost(window.location.hostname);

/**
 * Normalizes an API base URL so that it always ends in /api without duplication or trailing slashes.
 * e.g. "https://example.com"      -> "https://example.com/api"
 * e.g. "https://example.com/api"  -> "https://example.com/api"
 * e.g. "https://example.com/api/" -> "https://example.com/api"
 * e.g. "/api"                     -> "/api"
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

// In local development or preview on localhost, default to local Express backend on port 5000.
// Deployed pages require an explicit backend; no same-origin API is hosted here.
const rawBase = configuredBase
  ? normalizeApiBaseUrl(configuredBase)
  : (import.meta.env?.DEV || localPage ? 'http://localhost:5000/api' : '');

// Keep configuration failures recoverable instead of throwing during module import.
export function apiConfigurationError(base, production, pageOrigin) {
  if (!production) return '';
  try {
    // Allow a production bundle to be previewed against the local Express server.
    if (pageOrigin && isLocalHost(new URL(pageOrigin).hostname)) return '';
    if (!base) throw new Error();
    const normalized = normalizeApiBaseUrl(base);
    const api = new URL(normalized);
    if (api.protocol !== 'https:' || isLocalHost(api.hostname) || api.username || api.password || api.search || api.hash) throw new Error();
    return '';
  } catch {
    return 'The production backend is not configured correctly. Set VITE_API_BASE_URL to the HTTPS backend API URL in Vercel and redeploy.';
  }
}
export const API_CONFIGURATION_ERROR = apiConfigurationError(configuredBase, import.meta.env?.PROD, typeof window === 'undefined' ? '' : window.location.origin);

// Normalize by stripping any trailing slash
export const API_BASE_URL = rawBase;


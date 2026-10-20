/**
 * Centralized API configuration for PoultryPro frontend.
 * Allows switching seamlessly between local backend and Render deployment.
 * 
 * To point to your Render backend, set VITE_API_BASE_URL in your .env file:
 * VITE_API_BASE_URL=https://<your-render-app-name>.onrender.com/api
 */

const configuredBase = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_BACKEND_URL;
const isLocalHost = hostname => /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname);
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
// In production, use normalized configured base URL or fall back to '/api'.
const rawBase = configuredBase
  ? normalizeApiBaseUrl(configuredBase)
  : (import.meta.env?.DEV || localPage ? 'http://localhost:5000/api' : '/api');

// Keep configuration failures recoverable instead of throwing during module import.
export function apiConfigurationError(base, production, pageOrigin) {
  if (!production) return '';
  try {
    const page = new URL(pageOrigin);
    if (isLocalHost(page.hostname)) return '';
    if (!base) throw new Error();
    const normalized = normalizeApiBaseUrl(base);
    const api = new URL(normalized, page);
    if (!/^https?:$/.test(api.protocol) || isLocalHost(api.hostname) || (page.protocol === 'https:' && api.protocol !== 'https:')) throw new Error();
    return '';
  } catch {
    return 'The production backend is not configured correctly. Set VITE_API_BASE_URL to the HTTPS backend API URL in Vercel and redeploy.';
  }
}
export const API_CONFIGURATION_ERROR = apiConfigurationError(configuredBase, import.meta.env?.PROD, typeof window === 'undefined' ? '' : window.location.origin);

// Normalize by stripping any trailing slash
export const API_BASE_URL = rawBase;


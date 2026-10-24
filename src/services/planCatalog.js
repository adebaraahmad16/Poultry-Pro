import { handleUnauthorized } from './sessionService.js';
import { API_BASE_URL, API_CONFIGURATION_ERROR, isBackendConfigured, BACKEND_UNAVAILABLE_MESSAGE } from './apiConfig.js';
import { applyPlanCatalog } from '../constants/plans.js';
import { getSelectedFarmId, getSelectedPoultryType } from './farmScope.js';
import { DEFAULT_PLANS, presentPlan } from '../../shared/subscriptionPlans.js';

let catalog = DEFAULT_PLANS.map(p => presentPlan(p, DEFAULT_PLANS));

export const authHeaders = (admin = false) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem(admin ? 'poultrypro_admin_token' : 'poultrypro_token') || ''}`,
  ...(!admin && getSelectedFarmId() ? { 'X-Farm-Id': getSelectedFarmId(), 'X-Poultry-Type': getSelectedPoultryType() } : {})
});

export async function request(path, options = {}) {
  if (API_CONFIGURATION_ERROR) {
    throw Object.assign(new Error(API_CONFIGURATION_ERROR), { serverRejected: true, status: 503 });
  }
  if (!isBackendConfigured()) {
    throw Object.assign(new Error(BACKEND_UNAVAILABLE_MESSAGE), { serverRejected: true, status: 503, backendUnavailable: true });
  }
  const headers = { ...authHeaders(), ...options.headers };
  const response = await backendFetch(`${API_BASE_URL}${path}`, { ...options, headers });
  handleUnauthorized(response, headers);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`The backend returned an unexpected response (${response.status}). Check backend status.`);
  }
  if (!response.ok) {
    throw Object.assign(new Error(data?.error || 'Request failed'), { status: response.status, serverRejected: true });
  }
  return data;
}

export const getCatalog = () => catalog;

export async function refreshCatalog() {
  if (!isBackendConfigured()) {
    return catalog;
  }
  try {
    const next = await request('/subscription/plans');
    if (Array.isArray(next) && next.length) {
      catalog = next;
      applyPlanCatalog(next);
      window.dispatchEvent(new CustomEvent('admin_plans_updated', { detail: next }));
      return next;
    }
  } catch (err) {
    console.warn('Could not refresh subscription plans from backend, using default catalog:', err.message);
  }
  return catalog;
}

export async function savePlan(id, changes) {
  await request(`/subscription/plans/${id}`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(changes) });
  return refreshCatalog();
}

export async function checkedFetch(url, options = {}) {
  if (API_CONFIGURATION_ERROR) {
    throw Object.assign(new Error(API_CONFIGURATION_ERROR), { serverRejected: true, status: 503 });
  }
  if (!isBackendConfigured()) {
    throw Object.assign(new Error(BACKEND_UNAVAILABLE_MESSAGE), { serverRejected: true, status: 503, backendUnavailable: true });
  }
  const headers = { ...authHeaders(), ...options.headers };
  const response = await backendFetch(url, { ...options, headers });
  handleUnauthorized(response, headers);
  if (!response.ok) {
    let data;
    try { data = await response.json(); } catch { /* Non-JSON proxy error. */ }
    throw Object.assign(new Error(data?.error || 'The backend is unavailable. Please retry.'), { status: response.status, serverRejected: true });
  }
  return response;
}

async function backendFetch(url, options) {
  if (!isBackendConfigured()) {
    throw Object.assign(new Error(BACKEND_UNAVAILABLE_MESSAGE), { serverRejected: true, status: 503, backendUnavailable: true });
  }
  try {
    return await fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(15000) });
  } catch (error) {
    throw Object.assign(
      new Error('The backend connection is unavailable. Check your connection and retry.', { cause: error }),
      { serverRejected: true, status: 503 }
    );
  }
}


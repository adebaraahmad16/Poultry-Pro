import { handleUnauthorized } from './sessionService.js';
import { API_BASE_URL, API_CONFIGURATION_ERROR, isBackendConfigured, BACKEND_UNAVAILABLE_MESSAGE } from './apiConfig.js';
import { applyPlanCatalog } from '../constants/plans.js';
import { getSelectedFarmId, getSelectedPoultryType } from './farmScope.js';
import { DEFAULT_PLANS, presentPlan } from '../../shared/subscriptionPlans.js';

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

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
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('subscription_plans').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const raw = data.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          monthlyPrice: Number(row.monthly_price) || 0,
          annualPrice: Number(row.annual_price) || 0,
          maxFlocks: row.max_flocks,
          maxBirds: row.max_birds,
          maxPoultryTypes: row.max_poultry_types,
          maxUsers: row.max_users,
          maxFarms: row.max_farms,
          capabilities: row.capabilities || {},
          status: row.status || 'Active',
          isMostPopular: Boolean(row.is_most_popular),
        }));
        const mapped = raw.map(p => presentPlan(p, raw));
        catalog = mapped;
        applyPlanCatalog(mapped);
        window.dispatchEvent(new CustomEvent('admin_plans_updated', { detail: mapped }));
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase refreshCatalog error, using current catalog:', e);
    }
  }

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
  if (isSupabaseConfigured() && supabase) {
    const patch = {};
    if (changes.name !== undefined) patch.name = changes.name;
    if (changes.description !== undefined) patch.description = changes.description;
    if (changes.monthlyPrice !== undefined) patch.monthly_price = changes.monthlyPrice;
    if (changes.annualPrice !== undefined) patch.annual_price = changes.annualPrice;
    if (changes.maxFlocks !== undefined) patch.max_flocks = changes.maxFlocks;
    if (changes.maxBirds !== undefined) patch.max_birds = changes.maxBirds;
    if (changes.maxPoultryTypes !== undefined) patch.max_poultry_types = changes.maxPoultryTypes;
    if (changes.maxUsers !== undefined) patch.max_users = changes.maxUsers;
    if (changes.maxFarms !== undefined) patch.max_farms = changes.maxFarms;
    if (changes.capabilities !== undefined) patch.capabilities = changes.capabilities;
    if (changes.status !== undefined) patch.status = changes.status;
    if (changes.isMostPopular !== undefined) patch.is_most_popular = changes.isMostPopular;

    const { data, error } = await supabase.from('subscription_plans').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error('The database did not confirm the plan update.');
    const saved = { id: data.id, name: data.name, description: data.description, monthlyPrice: Number(data.monthly_price), annualPrice: Number(data.annual_price), maxFlocks: data.max_flocks, maxBirds: data.max_birds, maxPoultryTypes: data.max_poultry_types, maxUsers: data.max_users, maxFarms: data.max_farms, capabilities: data.capabilities, status: data.status, isMostPopular: data.is_most_popular };
    const next = catalog.map(plan => plan.id === id ? saved : plan);
    catalog = next.map(plan => presentPlan(plan, next));
    applyPlanCatalog(catalog);
    window.dispatchEvent(new CustomEvent('admin_plans_updated', { detail: catalog }));
    return catalog;
  }

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


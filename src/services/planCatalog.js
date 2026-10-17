import { handleUnauthorized } from './sessionService.js';
import { API_BASE_URL } from './apiConfig.js';
import { applyPlanCatalog } from '../constants/plans.js';
import { getSelectedFarmId, getSelectedPoultryType } from './farmScope.js';
let catalog = [];
export const authHeaders = (admin = false) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(admin ? 'poultrypro_admin_token' : 'poultrypro_token') || ''}`, ...(!admin&&getSelectedFarmId()?{'X-Farm-Id':getSelectedFarmId(),'X-Poultry-Type':getSelectedPoultryType()}:{}) });
export async function request(path, options = {}) {
 const headers = { ...authHeaders(), ...options.headers };
 const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
 handleUnauthorized(response,headers);
 const data = await response.json();
 if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'),{status:response.status});
 return data;
}
export const getCatalog = () => catalog;
export async function refreshCatalog() {
 const next = await request('/subscription/plans');
 catalog = next; applyPlanCatalog(next);
 window.dispatchEvent(new CustomEvent('admin_plans_updated', { detail: next }));
 return next;
}
export async function savePlan(id, changes) {
 await request(`/subscription/plans/${id}`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(changes) });
 return refreshCatalog();
}

// Existing production services may cache reads, but must not turn a rejected
// server mutation into a successful local write.
export async function checkedFetch(url, options = {}) {
 const headers = {...authHeaders(),...options.headers};
 const response = await fetch(url,{...options,headers});
 handleUnauthorized(response,headers);
 if (!response.ok && options.method && options.method !== 'GET') {
  const data = await response.json();
  throw Object.assign(new Error(data.error || 'Request failed'),{serverRejected:true});
 }
 return response;
}

import { handleUnauthorized } from './sessionService.js';
import { API_BASE_URL, API_CONFIGURATION_ERROR } from './apiConfig.js';
import { applyPlanCatalog } from '../constants/plans.js';
import { getSelectedFarmId, getSelectedPoultryType } from './farmScope.js';
let catalog = [];
export const authHeaders = (admin = false) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(admin ? 'poultrypro_admin_token' : 'poultrypro_token') || ''}`, ...(!admin&&getSelectedFarmId()?{'X-Farm-Id':getSelectedFarmId(),'X-Poultry-Type':getSelectedPoultryType()}:{}) });
export async function request(path, options = {}) {
 if (API_CONFIGURATION_ERROR) throw Object.assign(new Error(API_CONFIGURATION_ERROR),{serverRejected:true});
 const headers = { ...authHeaders(), ...options.headers };
 const response = await backendFetch(`${API_BASE_URL}${path}`, { ...options, headers });
 handleUnauthorized(response,headers);
 const text = await response.text();
 let data;
 try { data = text ? JSON.parse(text) : null; }
 catch { throw new Error(`The backend returned an unexpected response (${response.status}). Check VITE_API_BASE_URL and the backend deployment.`); }
 if (!response.ok) throw Object.assign(new Error(data?.error || 'Request failed'),{status:response.status,serverRejected:true});
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
 if (API_CONFIGURATION_ERROR) throw Object.assign(new Error(API_CONFIGURATION_ERROR),{serverRejected:true});
 const headers = {...authHeaders(),...options.headers};
 const response = await backendFetch(url,{...options,headers});
 handleUnauthorized(response,headers);
 if (!response.ok) {
  let data;
  try { data = await response.json(); } catch { /* Non-JSON proxy error. */ }
  throw Object.assign(new Error(data?.error || 'The backend is unavailable. Please retry.'),{status:response.status,serverRejected:true});
 }
 return response;
}

async function backendFetch(url, options) {
 try { return await fetch(url,{...options,signal:options.signal || AbortSignal.timeout(30000)}); }
 catch(error) { throw Object.assign(new Error('The backend connection is unavailable. Check your connection and retry.',{cause:error}),{serverRejected:true}); }
}

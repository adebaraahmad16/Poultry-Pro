export const TOKEN_KEY = 'poultrypro_token';
export function getSessionToken() { return localStorage.getItem(TOKEN_KEY); }
export function expireSession(message = 'Your session has expired. Please sign in again.') {
 localStorage.removeItem(TOKEN_KEY);
 localStorage.setItem('poultrypro_is_logged_in','false');
 window.dispatchEvent(new CustomEvent('farmer_session_expired',{detail:message}));
}
export function handleUnauthorized(response, headers) {
 const sent = new Headers(headers).get('Authorization');
 const adminToken = localStorage.getItem('poultrypro_admin_token');
 if (response.status === 401 && adminToken && sent === `Bearer ${adminToken}`) {
  localStorage.removeItem('poultrypro_admin_token');
  localStorage.removeItem('poultrypro_current_admin');
  window.dispatchEvent(new CustomEvent('admin_session_expired'));
  return;
 }
 const current = getSessionToken();
 if (response.status === 401 && current && sent === `Bearer ${current}`) expireSession();
}

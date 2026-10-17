export const TOKEN_KEY = 'poultrypro_token';
export function getSessionToken() { return localStorage.getItem(TOKEN_KEY); }
export function expireSession(message = 'Your session has expired. Please sign in again.') {
 localStorage.removeItem(TOKEN_KEY);
 localStorage.setItem('poultrypro_is_logged_in','false');
 window.dispatchEvent(new CustomEvent('farmer_session_expired',{detail:message}));
}
export function handleUnauthorized(response, headers) {
 const sent = new Headers(headers).get('Authorization');
 const current = getSessionToken();
 if (response.status === 401 && current && sent === `Bearer ${current}`) expireSession();
}

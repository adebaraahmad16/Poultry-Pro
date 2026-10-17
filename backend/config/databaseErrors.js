export const DATABASE_UNAVAILABLE = 'The farm database is unavailable. Check that the Windows computer, XAMPP MySQL, internet connection and secure tunnel are online, then retry.';
const connectionCodes = new Set(['ECONNREFUSED','ECONNRESET','EPIPE','ETIMEDOUT','ENOTFOUND','EAI_AGAIN','PROTOCOL_CONNECTION_LOST','PROTOCOL_SEQUENCE_TIMEOUT','ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR','ER_CON_COUNT_ERROR']);
export function databaseError(error) {
  if (!connectionCodes.has(error.code) && !['Queue limit reached.','Pool is closed.'].includes(error.message)) return error;
  return Object.assign(new Error(DATABASE_UNAVAILABLE, {cause:error}), {status:503,code:'DATABASE_UNAVAILABLE'});
}
export function guardDatabase(target, methods) {
  for (const method of methods) {
    const original = target[method].bind(target);
    target[method] = async (...args) => {
      if (['query','execute'].includes(method)) {
        const query = typeof args[0] === 'string' ? {sql:args[0]} : args[0];
        args[0] = {timeout:15000,...query};
      }
      try { return await original(...args); }
      catch(error) { throw databaseError(error); }
    };
  }
  return target;
}

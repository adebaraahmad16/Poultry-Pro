export const DATABASE_UNAVAILABLE =
  'The PoultryPro database is temporarily unavailable. Please try again later.';

const connectionCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_CON_COUNT_ERROR',
  'HANDSHAKE_SSL_ERROR',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT'
]);

export function databaseError(error) {
  if (!error) {
    return new Error('Unknown database error');
  }

  const isConnectionError =
    connectionCodes.has(error.code) ||
    [
      'Queue limit reached.',
      'Pool is closed.'
    ].includes(error.message);

  if (!isConnectionError) {
    return error;
  }

  return Object.assign(
    new Error(DATABASE_UNAVAILABLE, {
      cause: error
    }),
    {
      status: 503,
      code: 'DATABASE_UNAVAILABLE'
    }
  );
}

export function guardDatabase(target, methods) {
  for (const method of methods) {
    if (typeof target[method] !== 'function') {
      continue;
    }

    const original = target[method].bind(target);

    target[method] = async (...args) => {
      if (['query', 'execute'].includes(method)) {
        const query =
          typeof args[0] === 'string'
            ? { sql: args[0] }
            : { ...args[0] };

        args[0] = {
          timeout: 15000,
          ...query
        };
      }

      try {
        return await original(...args);
      } catch (error) {
        throw databaseError(error);
      }
    };
  }

  return target;
}
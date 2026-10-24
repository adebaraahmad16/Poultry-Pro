import 'dotenv/config';
import mysql from 'mysql2/promise';
import { guardDatabase, databaseError } from './databaseErrors.js';

// In production, require essential credentials and forbid the root account.
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const missing = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter(
    (k) => !process.env[k]?.trim()
  );
  if (missing.length > 0) {
    throw new Error(`Missing production database config: ${missing.join(', ')}`);
  }
  if (process.env.DB_USER.toLowerCase() === 'root') {
    throw new Error('Production database must use a non-root user.');
  }
}

// SSL is opt-in: set DB_SSL=true (or any truthy value except the explicit false list) to enable.
const sslEnabled = !['', 'false', '0', 'none', 'off'].includes(
  String(process.env.DB_SSL || '').toLowerCase()
);

const sslConfig = sslEnabled
  ? {
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ...(process.env.DB_SSL_CA
          ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') }
          : {})
      }
    }
  : {};

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'poultrypro_db',

  ...sslConfig,

  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 3,
  idleTimeout: 60000,
  queueLimit: 20
});

guardDatabase(pool, ['query', 'execute']);

const acquire = pool.getConnection.bind(pool);
const guarded = new WeakSet();

pool.getConnection = async () => {
  try {
    const connection = await acquire();
    if (!guarded.has(connection)) {
      guardDatabase(connection, ['query', 'execute', 'beginTransaction', 'commit', 'rollback']);
      guarded.add(connection);
    }
    return connection;
  } catch (error) {
    throw databaseError(error);
  }
};

export default pool;
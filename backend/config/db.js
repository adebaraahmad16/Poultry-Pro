import 'dotenv/config';

import mysql from 'mysql2/promise';

import {
  guardDatabase,
  databaseError
} from './databaseErrors.js';

const isProduction = process.env.NODE_ENV === 'production';

const requiredVariables = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

if (isProduction) {
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing production database configuration: ${missingVariables.join(', ')}`
    );
  }

  if (process.env.DB_USER.toLowerCase() === 'root') {
    throw new Error(
      'Production database must use a dedicated non-root user.'
    );
  }
}

const sslEnabled = ![
  '',
  'false',
  '0',
  'none',
  'off'
].includes(String(process.env.DB_SSL || '').toLowerCase());

const sslConfig = sslEnabled
  ? {
      ssl: {
        rejectUnauthorized:
          process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',

        ...(process.env.DB_SSL_CA
          ? {
              ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n')
            }
          : {})
      }
    }
  : {};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'poultrypro_db',

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
      guardDatabase(connection, [
        'query',
        'execute',
        'beginTransaction',
        'commit',
        'rollback'
      ]);

      guarded.add(connection);
    }

    return connection;
  } catch (error) {
    throw databaseError(error);
  }
};

export default pool;
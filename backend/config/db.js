import 'dotenv/config';
import mysql from 'mysql2/promise';
import { guardDatabase, databaseError } from './databaseErrors.js';

if (process.env.NODE_ENV === 'production' && (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD || !process.env.DB_USER || process.env.DB_USER.toLowerCase() === 'root')) {
  throw new Error('Production requires DB_HOST, DB_NAME, DB_PASSWORD and a dedicated non-root DB_USER.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'poultrypro_db',
  ...(process.env.DB_SSL === 'true' ? {ssl: {
    rejectUnauthorized: true,
    ...(process.env.DB_SSL_CA ? {ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n')} : {})
  }} : {}),
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 20
});

guardDatabase(pool, ['query','execute']);
const acquire = pool.getConnection.bind(pool);
const guarded = new WeakSet();
pool.getConnection = async () => {
  try {
    const connection = await acquire();
    if (!guarded.has(connection)) {
      guardDatabase(connection, ['query','execute','beginTransaction','commit','rollback']);
      guarded.add(connection);
    }
    return connection;
  } catch(error) {
    throw databaseError(error);
  }
};

export default pool;

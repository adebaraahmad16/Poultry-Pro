import { initializeDailyRecords } from '../services/dailyRecords.js';
import pool from '../config/db.js';
try {
  await initializeDailyRecords();
  console.log('Daily record tables and fractional feed inventory are ready. Existing records have been preserved.');
} catch(error) {
  console.error('Daily record migration failed:',error.message);process.exitCode=1;
} finally { await pool.end(); }

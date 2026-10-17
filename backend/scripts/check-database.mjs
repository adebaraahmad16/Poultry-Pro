import pool from '../config/db.js';
try {
  const [identity] = await pool.query('SELECT CURRENT_USER() AS account, DATABASE() AS name');
  const [tables] = await pool.query("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()");
  const names = new Set(tables.map(table=>table.name));
  const missing = ['farms','users','flocks','farm_subscriptions','daily_records'].filter(name=>!names.has(name));
  console.log('MySQL authentication and read access succeeded.');
  console.log('Account:',identity[0].account,'Database:',identity[0].name);
  console.log('Missing required tables:',missing.length ? missing.join(', ') : 'none');
  if(missing.length)process.exitCode=1;
} catch(error) {
  console.error(error.status===503 ? error.message : 'Database verification failed. Check account permissions and server logs.');
  process.exitCode=1;
} finally {await pool.end();}

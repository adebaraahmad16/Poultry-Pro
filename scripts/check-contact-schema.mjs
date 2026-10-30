import {PGlite} from '../.ui-checks/sql-engine/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';
const pg=new PGlite();
try{
 await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
 CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT false$$;
 CREATE TABLE public.notifications(id text PRIMARY KEY DEFAULT gen_random_uuid()::text,user_id uuid,farm_id text,title text,message text,type text,time text,is_read boolean DEFAULT false,created_at timestamptz DEFAULT now(),category text);`);
 await pg.exec(await readFile('supabase/migrations/20261029_contact_messages.sql','utf8'));
 await pg.exec(await readFile('supabase/migrations/20261030000300_notification_schema_alignment.sql','utf8'));
 await pg.exec(await readFile('supabase/tests/contact_messages.sql','utf8'));
 console.log('PASS actual contact SQL migrations against minimal deployed notification columns: atomic enquiries/alerts, retry deduplication, rate limits, independent statuses and anonymous/non-admin denial. Isolated PostgreSQL only.');
}catch(error){console.error('FAIL contact SQL:',error.message,error.detail||'',error.where||'');process.exitCode=1;}
finally{await pg.close();}

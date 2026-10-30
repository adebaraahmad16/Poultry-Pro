-- Read-only inspection in the Supabase SQL editor. No grants or policy changes.
SELECT table_name,column_name,data_type FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('notifications','contact_messages') ORDER BY table_name,ordinal_position;
SELECT has_table_privilege('authenticated','public.contact_messages','SELECT') AS authenticated_can_select,
 has_column_privilege('authenticated','public.contact_messages','is_read','UPDATE') AS authenticated_can_change_read,
 has_column_privilege('authenticated','public.contact_messages','status','UPDATE') AS authenticated_can_change_status,
 has_table_privilege('anon','public.contact_messages','SELECT') AS anonymous_can_select;
SELECT relname,relrowsecurity FROM pg_class WHERE oid IN ('public.contact_messages'::regclass,'public.notifications'::regclass);
SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
 WHERE schemaname='public' AND tablename IN ('contact_messages','notifications');
SELECT pg_get_functiondef('public.is_admin()'::regprocedure);
SELECT has_function_privilege('authenticated','public.is_admin()','EXECUTE') AS authenticated_can_verify_admin;
-- Run public.is_admin() from an authenticated application session for the real result.
-- The SQL editor's default postgres session has no farmer/admin JWT subject.

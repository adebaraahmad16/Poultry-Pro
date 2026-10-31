-- Read-only diagnostics. Run in the Supabase SQL editor; do not publish results
-- containing private user data. No bucket, policy, profile, or object is changed.
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'avatars';

SELECT policyname, roles, cmd, permissive, qual, with_check
FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

SELECT relrowsecurity AS storage_objects_rls_enabled
FROM pg_class WHERE oid = 'storage.objects'::regclass;

SELECT has_table_privilege('authenticated', 'storage.objects', 'INSERT') AS can_insert,
       has_table_privilege('authenticated', 'storage.objects', 'SELECT') AS can_select,
       has_table_privilege('authenticated', 'storage.objects', 'DELETE') AS can_delete;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url';

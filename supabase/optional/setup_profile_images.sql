-- Review/run with a privileged SQL connection, never from the browser.
-- Reuses a known existing profile bucket before creating a PRIVATE one if none exists.
-- Optional selection: SELECT set_config('poultrypro.avatar_bucket','your-existing-bucket',false);
-- No profile/farm records or existing images are deleted. Existing unrelated policies remain.
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets;
BEGIN;
DO $$
DECLARE chosen text:=nullif(current_setting('poultrypro.avatar_bucket',true),''); existing storage.buckets; operation text; condition text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='storage.objects'::regclass AND relrowsecurity) THEN
  RAISE EXCEPTION 'Storage RLS must remain enabled. Review the existing Storage configuration before proceeding.';
 END IF;
 IF chosen IS NULL THEN
  SELECT id INTO chosen FROM storage.buckets WHERE id IN ('avatars','profile-images','profile-pictures','profile_images','profile_pictures','profile-avatars')
   ORDER BY CASE WHEN public THEN 1 ELSE 0 END,CASE WHEN id='avatars' THEN 0 ELSE 1 END,id LIMIT 1;
  IF chosen IS NULL AND EXISTS(SELECT 1 FROM storage.buckets) THEN
   RAISE EXCEPTION 'Existing buckets need review before creating another. Set poultrypro.avatar_bucket to a suitable existing bucket, or explicitly choose a new profile bucket only if none is suitable.';
  END IF;
 END IF;
 chosen:=coalesce(chosen,'avatars');
 SELECT * INTO existing FROM storage.buckets WHERE id=chosen;
 IF FOUND AND existing.public THEN
  RAISE EXCEPTION 'Existing bucket % is public. Choose a suitable private profile bucket after reviewing existing objects; this setup does not change privacy or create a duplicate automatically.',chosen;
 END IF;
 IF NOT FOUND THEN
  INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  VALUES(chosen,chosen,false,2097152,ARRAY['image/jpeg','image/png','image/webp']);
 ELSE
  -- Limits apply to new uploads, not stored objects. Review that this is a profile-only bucket.
  UPDATE storage.buckets SET file_size_limit=2097152,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'] WHERE id=chosen;
 END IF;
 condition:=format('bucket_id=%L AND (storage.foldername(name))[1]=(SELECT auth.uid())::text',chosen);
 FOREACH operation IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='poultrypro_avatar_owner_'||lower(operation)) THEN
   EXECUTE format('CREATE POLICY %I ON storage.objects FOR %s TO authenticated %s',
    'poultrypro_avatar_owner_'||lower(operation),operation,
    CASE WHEN operation='INSERT' THEN 'WITH CHECK ('||condition||')' WHEN operation='UPDATE' THEN 'USING ('||condition||') WITH CHECK ('||condition||')' ELSE 'USING ('||condition||')' END);
  ELSIF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='poultrypro_avatar_owner_'||lower(operation) AND coalesce(qual,with_check) LIKE '%'||quote_literal(chosen)||'%') THEN
   RAISE EXCEPTION 'Managed avatar policy targets another bucket. Review existing policies before changing the bucket.';
  END IF;
 END LOOP;
 RAISE NOTICE 'Profile bucket: %. Set VITE_PROFILE_AVATAR_BUCKET to this exact id. Review other permissive Storage policies for overlapping write access.',chosen;
END $$;
COMMIT;

-- Audit (metadata only): review broad existing policies before declaring access secure.
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets;
SELECT policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects';

-- Use the EXISTING profile image bucket. Change 'avatars' if its actual name differs,
-- and set VITE_PROFILE_AVATAR_BUCKET to that same name. This never creates a bucket
-- or changes whether a bucket is public/private. Private images use signed display URLs.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='avatars') THEN
    RAISE EXCEPTION 'Choose the existing profile image bucket before applying these policies';
  END IF;
END $$;
-- Additive owner policies; existing policies remain intact and must also be reviewed.
CREATE POLICY poultrypro_profile_images_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY poultrypro_profile_images_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY poultrypro_profile_images_cleanup ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
COMMIT;

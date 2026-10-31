-- Optional one-time recovery for the exact existing upload reported by its owner.
-- Review and run in the SQL editor only if this image should be that user's avatar.
-- No accounts, roles, bucket settings, policies, or objects are changed/deleted.
-- A nonempty avatar is never overwritten. No result means a guard did not match.
UPDATE public.profiles AS profile
SET avatar_url = 'storage://avatars/9d4f1cfb-54ab-41c0-b326-35e098db23cd/a969871f-932b-4002-a6f2-9474c45919f9.jpg',
    updated_at = now()
WHERE profile.id = '9d4f1cfb-54ab-41c0-b326-35e098db23cd'::uuid
  AND coalesce(profile.avatar_url, '') = ''
  AND EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'avatars'
      AND name = '9d4f1cfb-54ab-41c0-b326-35e098db23cd/a969871f-932b-4002-a6f2-9474c45919f9.jpg'
  )
RETURNING profile.id, profile.avatar_url;

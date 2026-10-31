-- Read-only audit for the existing account. No roles, identities, grants or policies change.
-- Run in the configured project's SQL editor. Do not post access tokens/passwords.
WITH expected AS (
 SELECT 'dc66acb2-e7aa-447d-90ac-1f47cd7a76e5'::uuid id,'admin@poultrypro.ng'::text email
)
SELECT e.id AS expected_profile_id,p.id AS actual_profile_id,p.role,
 a.id AS auth_user_with_profile_id,b.id AS auth_user_with_admin_email,
 p.id=a.id AS profile_matches_auth_id,a.id=b.id AS email_matches_same_auth_user,
 lower(p.email)=lower(e.email) AS profile_email_matches,
 a.email_confirmed_at IS NOT NULL AS auth_email_confirmed
FROM expected e LEFT JOIN public.profiles p ON p.id=e.id
LEFT JOIN auth.users a ON a.id=e.id LEFT JOIN auth.users b ON lower(b.email)=lower(e.email);

SELECT role,count(*) FROM public.profiles GROUP BY role;
SELECT pg_get_functiondef('public.is_admin()'::regprocedure);
SELECT r.rolname AS function_owner,r.rolbypassrls,p.prosecdef AS security_definer,p.proconfig
FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner WHERE p.oid='public.is_admin()'::regprocedure;
SELECT has_function_privilege('authenticated','public.is_admin()','EXECUTE') AS authenticated_can_execute;
SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','contact_messages','notifications');

-- Optional database-only simulation of the confirmed existing Auth ID.
-- This is NOT proof that a browser has authenticated as that ID.
-- All temporary JWT settings and the local role are rolled back; no rows are written.
BEGIN;
SELECT set_config('request.jwt.claim.sub','dc66acb2-e7aa-447d-90ac-1f47cd7a76e5',true);
SELECT set_config('request.jwt.claims','{"sub":"dc66acb2-e7aa-447d-90ac-1f47cd7a76e5","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
SELECT auth.uid() AS simulated_existing_user_id,public.is_admin() AS database_recognizes_existing_admin;
ROLLBACK;

-- Run only after the reminder migration, Edge Function, and Vault secrets are configured.
-- Set Vault secrets through the secure dashboard: poultrypro_project_url (HTTPS project URL)
-- and poultrypro_trial_cron_secret (same random value as TRIAL_CRON_SECRET).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='poultrypro_project_url')
 OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='poultrypro_trial_cron_secret') THEN
 RAISE EXCEPTION 'Configure project URL and trial cron secret in Vault before installing jobs'; END IF;
END $$;
-- Dashboard notifications are independent of provider outages and farmer logins.
SELECT cron.schedule('poultrypro-daily-trial-reminders','0 9 * * *',$job$SELECT public.queue_trial_reminders();$job$);
-- Also checks current milestones each run; retry processing and lease recovery use the same worker.
SELECT cron.schedule('poultrypro-trial-email-worker','*/15 * * * *',$job$
 SELECT net.http_post(
  url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='poultrypro_project_url')||'/functions/v1/trial-reminders',
  headers:=jsonb_build_object('Content-Type','application/json','x-trial-cron-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='poultrypro_trial_cron_secret')),
  body:='{}'::jsonb,timeout_milliseconds:=1000);
$job$);

-- ==============================================================================
-- POULTRYPRO SCHEMA COMPATIBILITY PATCH
-- Adds missing columns, default UUID generation, and permissions so all
-- frontend farmDataService.js queries work seamlessly.
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

-- ─── ID DEFAULTS FOR ALL TABLES ──────────────────────────────────────────────
-- Ensures inserting rows without an explicit ID auto-generates a UUID
ALTER TABLE public.farms ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.flocks ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.egg_production ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.daily_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.feed_inventory ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.mortality_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.vaccinations ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.medications ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.expenses ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.sales ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.customers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.workers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- ─── FLOCKS ───────────────────────────────────────────────────────────────────
-- Service sends: housing_type, acquisition_date, notes
ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS housing_type TEXT DEFAULT '';
ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS acquisition_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.flocks ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- ─── EGG PRODUCTION ───────────────────────────────────────────────────────────
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS flock_name TEXT DEFAULT '';
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS good_eggs INTEGER DEFAULT 0;
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS broken_eggs INTEGER DEFAULT 0;
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS rejected_eggs INTEGER DEFAULT 0;
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS total_eggs INTEGER DEFAULT 0;
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- ─── VACCINATIONS ─────────────────────────────────────────────────────────────
-- Service sends: vaccine_name, date, dose, method, next_due_date
-- Schema currently has: vaccine, scheduled_date
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS vaccine_name TEXT DEFAULT '';
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS dose TEXT DEFAULT '';
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS method TEXT DEFAULT '';
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS next_due_date DATE DEFAULT NULL;

-- ─── MEDICATIONS ──────────────────────────────────────────────────────────────
-- Service sends: date, medication_name, dosage, duration_days, reason, cost
-- Schema currently has: start_date (no date alias, no duration_days)
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT NULL;

-- ─── WORKERS ──────────────────────────────────────────────────────────────────
-- Service sends: salary, hire_date, email, notes
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS salary NUMERIC DEFAULT 0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT NULL;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- ─── FARM_SUBSCRIPTIONS ───────────────────────────────────────────────────────
-- Ensure current_period_end column exists
ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT NULL;

-- Keep current_period_end synced with renewal_date going forward
CREATE OR REPLACE FUNCTION public.sync_current_period_end()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.current_period_end := COALESCE(NEW.renewal_date, NEW.trial_ends_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_period_end ON public.farm_subscriptions;
CREATE TRIGGER trg_sync_period_end
  BEFORE INSERT OR UPDATE ON public.farm_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_current_period_end();

-- Backfill existing rows
UPDATE public.farm_subscriptions
SET current_period_end = COALESCE(renewal_date, trial_ends_at)
WHERE current_period_end IS NULL;

-- ─── GRANT permissions on all tables ──────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.egg_production TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mortality_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccinations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated, anon;

-- Done

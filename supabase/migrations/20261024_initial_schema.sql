-- ==============================================================================
-- POULTRYPRO COMPREHENSIVE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Fully Idempotent: Safe to run multiple times without 400 errors.
-- ==============================================================================

-- 1. PROFILES (Farmers and Admins linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'farmer',
  farm_id TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'farmer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_id TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FARMS
CREATE TABLE IF NOT EXISTS public.farms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Farm',
  location TEXT DEFAULT '',
  type TEXT DEFAULT 'Poultry Farm',
  size TEXT DEFAULT '5,000 sqm',
  currency TEXT DEFAULT '₦',
  weight_unit TEXT DEFAULT 'kg',
  poultry_types JSONB DEFAULT '["broilers"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'My Farm';
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Poultry Farm';
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS size TEXT DEFAULT '5,000 sqm';
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT '₦';
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg';
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS poultry_types JSONB DEFAULT '["broilers"]'::jsonb;

-- 3. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  annual_price NUMERIC NOT NULL DEFAULT 0,
  max_flocks INTEGER,
  max_birds INTEGER,
  max_poultry_types INTEGER,
  max_users INTEGER,
  max_farms INTEGER,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Active',
  is_most_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FARM SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.farm_subscriptions (
  farm_id TEXT PRIMARY KEY REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'trial',
  billing_cycle TEXT DEFAULT 'monthly',
  agreed_price NUMERIC DEFAULT NULL,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  renewal_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS agreed_price NUMERIC DEFAULT NULL;
ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE public.farm_subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;

-- 5. SUBSCRIPTION ORDERS (Payments & Invoices)
CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference TEXT UNIQUE NOT NULL,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'Paystack',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FLOCKS
CREATE TABLE IF NOT EXISTS public.flocks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Broilers',
  breed TEXT DEFAULT '',
  initial_birds INTEGER NOT NULL DEFAULT 0,
  current_birds INTEGER NOT NULL DEFAULT 0,
  date_acquired DATE DEFAULT CURRENT_DATE,
  age_weeks INTEGER DEFAULT 1,
  cost_per_bird NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  pen TEXT DEFAULT '',
  source TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  health_status TEXT DEFAULT 'Healthy',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DAILY RECORDS
CREATE TABLE IF NOT EXISTS public.daily_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  poultry_type TEXT DEFAULT 'all',
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FEED INVENTORY
CREATE TABLE IF NOT EXISTS public.feed_inventory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  name TEXT DEFAULT '',
  feed_type TEXT DEFAULT '',
  quantity_bags NUMERIC DEFAULT 0,
  bag_weight_kg NUMERIC DEFAULT 25,
  cost_per_bag NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  supplier TEXT DEFAULT '',
  status TEXT DEFAULT 'In Stock',
  min_stock_threshold_bags NUMERIC DEFAULT 5,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feed_inventory ADD COLUMN IF NOT EXISTS flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL;
ALTER TABLE public.feed_inventory ADD COLUMN IF NOT EXISTS feed_type TEXT DEFAULT '';
ALTER TABLE public.feed_inventory ADD COLUMN IF NOT EXISTS cost_per_bag NUMERIC DEFAULT 0;
ALTER TABLE public.feed_inventory ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.feed_inventory ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 9. EGG PRODUCTION
CREATE TABLE IF NOT EXISTS public.egg_production (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  good_eggs INTEGER NOT NULL DEFAULT 0,
  broken_eggs INTEGER DEFAULT 0,
  rejected_eggs INTEGER DEFAULT 0,
  total_eggs INTEGER NOT NULL DEFAULT 0,
  crates NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE;
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS good_eggs INTEGER DEFAULT 0;
ALTER TABLE public.egg_production ADD COLUMN IF NOT EXISTS broken_eggs INTEGER DEFAULT 0;

-- 10. MORTALITY RECORDS
CREATE TABLE IF NOT EXISTS public.mortality_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  cause TEXT DEFAULT 'Unknown',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mortality_records ADD COLUMN IF NOT EXISTS farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE;

-- 11. VACCINATIONS
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  vaccine TEXT NOT NULL DEFAULT '',
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Scheduled',
  administered_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE;

-- 12. MEDICATIONS
CREATE TABLE IF NOT EXISTS public.medications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  medication_name TEXT NOT NULL DEFAULT '',
  reason TEXT DEFAULT '',
  dosage TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT NULL,
  cost NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE;

-- 13. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  type TEXT DEFAULT 'Regular',
  total_purchases NUMERIC DEFAULT 0,
  outstanding_balance NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SALES
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT DEFAULT '',
  product TEXT NOT NULL DEFAULT 'Sale',
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  payment_method TEXT DEFAULT 'Cash',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL DEFAULT 'Expense',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Supplies',
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'units',
  min_stock NUMERIC DEFAULT 5,
  supplier TEXT DEFAULT '',
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'In Stock',
  date_added DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. WORKERS
CREATE TABLE IF NOT EXISTS public.workers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'Farm Worker',
  assigned_pen TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to TEXT DEFAULT '',
  due_date DATE DEFAULT CURRENT_DATE,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'farm',
  priority TEXT DEFAULT 'normal',
  action_url TEXT DEFAULT '',
  time TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ DEFAULT NULL,
  related_entity_type TEXT DEFAULT '',
  related_entity_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'farm';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_type TEXT DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_id TEXT DEFAULT '';

-- ==============================================================================
-- SEED CANONICAL SUBSCRIPTION PLANS
-- ==============================================================================
INSERT INTO public.subscription_plans (id, name, description, monthly_price, annual_price, max_flocks, max_birds, max_poultry_types, max_users, max_farms, capabilities, status, is_most_popular)
VALUES 
(
  'basic',
  'Basic',
  'Essential farm management tools for small-scale poultry farmers.',
  2500,
  25000,
  3,
  500,
  1,
  1,
  1,
  '{"feedManagement": true, "healthManagement": true, "mortalityTracking": true, "eggProduction": true, "financialManagement": true, "reportsAnalytics": true, "staffManagement": true, "vaccinationReminders": true, "profitabilityAnalysis": false, "dataExport": false, "multipleFarms": false, "prioritySupport": false}'::jsonb,
  'Active',
  false
),
(
  'professional',
  'Pro',
  'Advanced management tools for growing poultry businesses.',
  5000,
  50000,
  15,
  5000,
  3,
  5,
  1,
  '{"feedManagement": true, "healthManagement": true, "mortalityTracking": true, "eggProduction": true, "financialManagement": true, "reportsAnalytics": true, "staffManagement": true, "vaccinationReminders": true, "profitabilityAnalysis": true, "dataExport": true, "multipleFarms": false, "prioritySupport": true}'::jsonb,
  'Active',
  true
),
(
  'enterprise',
  'Enterprise',
  'Complete farm management solutions for large-scale poultry operations.',
  12000,
  120000,
  null,
  null,
  null,
  null,
  null,
  '{"feedManagement": true, "healthManagement": true, "mortalityTracking": true, "eggProduction": true, "financialManagement": true, "reportsAnalytics": true, "staffManagement": true, "vaccinationReminders": true, "profitabilityAnalysis": true, "dataExport": true, "multipleFarms": true, "prioritySupport": true}'::jsonb,
  'Active',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  max_flocks = EXCLUDED.max_flocks,
  max_birds = EXCLUDED.max_birds,
  max_poultry_types = EXCLUDED.max_poultry_types,
  capabilities = EXCLUDED.capabilities;

-- ==============================================================================
-- HELPER FUNCTIONS & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Admin check helper function (SECURITY DEFINER with explicit search_path prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'Super Admin')
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortality_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS (safe non-recursive policies)
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

-- 2. FARMS RLS
DROP POLICY IF EXISTS "Users can view own farms or admins view all" ON public.farms;
CREATE POLICY "Users can view own farms or admins view all" ON public.farms
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own farms" ON public.farms;
CREATE POLICY "Users can insert own farms" ON public.farms
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own farms" ON public.farms;
CREATE POLICY "Users can update own farms" ON public.farms
  FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own farms" ON public.farms;
CREATE POLICY "Users can delete own farms" ON public.farms
  FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.is_admin());

-- 3. SUBSCRIPTION PLANS RLS
DROP POLICY IF EXISTS "Public read for subscription plans" ON public.subscription_plans;
CREATE POLICY "Public read for subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL TO authenticated USING (public.is_admin());

-- 4. FARM SUBSCRIPTIONS RLS
DROP POLICY IF EXISTS "Farmers view own subscription or admins view all" ON public.farm_subscriptions;
CREATE POLICY "Farmers view own subscription or admins view all" ON public.farm_subscriptions
  FOR SELECT TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

DROP POLICY IF EXISTS "Farmers insert own subscription" ON public.farm_subscriptions;
CREATE POLICY "Farmers insert own subscription" ON public.farm_subscriptions
  FOR INSERT TO authenticated WITH CHECK (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins or farmers update own subscription" ON public.farm_subscriptions;
CREATE POLICY "Admins or farmers update own subscription" ON public.farm_subscriptions
  FOR UPDATE TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 5. SUBSCRIPTION ORDERS RLS
DROP POLICY IF EXISTS "Farmers view own orders or admins view all" ON public.subscription_orders;
CREATE POLICY "Farmers view own orders or admins view all" ON public.subscription_orders
  FOR SELECT TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

DROP POLICY IF EXISTS "Farmers create own orders" ON public.subscription_orders;
CREATE POLICY "Farmers create own orders" ON public.subscription_orders
  FOR INSERT TO authenticated WITH CHECK (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 6. FLOCKS RLS
DROP POLICY IF EXISTS "Farmers manage own flocks" ON public.flocks;
CREATE POLICY "Farmers manage own flocks" ON public.flocks
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 7. DAILY RECORDS RLS
DROP POLICY IF EXISTS "Farmers manage own daily records" ON public.daily_records;
CREATE POLICY "Farmers manage own daily records" ON public.daily_records
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 8. FEED INVENTORY RLS
DROP POLICY IF EXISTS "Farmers manage own feed inventory" ON public.feed_inventory;
CREATE POLICY "Farmers manage own feed inventory" ON public.feed_inventory
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 9. EGG PRODUCTION RLS
DROP POLICY IF EXISTS "Farmers manage own egg production" ON public.egg_production;
CREATE POLICY "Farmers manage own egg production" ON public.egg_production
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 10. MORTALITY RECORDS RLS
DROP POLICY IF EXISTS "Farmers manage own mortality records" ON public.mortality_records;
CREATE POLICY "Farmers manage own mortality records" ON public.mortality_records
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 11. VACCINATIONS RLS
DROP POLICY IF EXISTS "Farmers manage own vaccinations" ON public.vaccinations;
CREATE POLICY "Farmers manage own vaccinations" ON public.vaccinations
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 12. MEDICATIONS RLS
DROP POLICY IF EXISTS "Farmers manage own medications" ON public.medications;
CREATE POLICY "Farmers manage own medications" ON public.medications
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 13. CUSTOMERS RLS
DROP POLICY IF EXISTS "Farmers manage own customers" ON public.customers;
CREATE POLICY "Farmers manage own customers" ON public.customers
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 14. SALES RLS
DROP POLICY IF EXISTS "Farmers manage own sales" ON public.sales;
CREATE POLICY "Farmers manage own sales" ON public.sales
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 15. EXPENSES RLS
DROP POLICY IF EXISTS "Farmers manage own expenses" ON public.expenses;
CREATE POLICY "Farmers manage own expenses" ON public.expenses
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 16. INVENTORY RLS
DROP POLICY IF EXISTS "Farmers manage own inventory" ON public.inventory;
CREATE POLICY "Farmers manage own inventory" ON public.inventory
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 17. WORKERS RLS
DROP POLICY IF EXISTS "Farmers manage own workers" ON public.workers;
CREATE POLICY "Farmers manage own workers" ON public.workers
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 18. TASKS RLS
DROP POLICY IF EXISTS "Farmers manage own tasks" ON public.tasks;
CREATE POLICY "Farmers manage own tasks" ON public.tasks
  FOR ALL TO authenticated USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()) OR public.is_admin()
  );

-- 19. NOTIFICATIONS RLS
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- 20. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent auth creation from failing if profile sync encounters an issue
  RETURN NEW;
END;
$$;

GRANT ALL ON TABLE public.profiles TO postgres, service_role, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, anon;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

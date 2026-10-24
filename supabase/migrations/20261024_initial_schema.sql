-- ==============================================================================
-- POULTRYPRO COMPREHENSIVE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Farmers and Admins linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin', 'Farm Owner', 'Staff')),
  farm_id TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FARMS
CREATE TABLE IF NOT EXISTS public.farms (
  id TEXT PRIMARY KEY,
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

-- Add foreign key constraint from profiles to farms if needed (deferred or nullable)
-- ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_farm FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE SET NULL;

-- 3. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  monthly_price NUMERIC NOT NULL,
  annual_price NUMERIC NOT NULL,
  max_flocks INTEGER,
  max_birds INTEGER,
  max_poultry_types INTEGER,
  max_users INTEGER,
  max_farms INTEGER,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
  is_most_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FARM SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.farm_subscriptions (
  farm_id TEXT PRIMARY KEY REFERENCES public.farms(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  agreed_price NUMERIC DEFAULT NULL,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  renewal_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBSCRIPTION ORDERS (Payments & Invoices)
CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payment_method TEXT DEFAULT 'Paystack',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FLOCKS
CREATE TABLE IF NOT EXISTS public.flocks (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  breed TEXT DEFAULT '',
  initial_birds INTEGER NOT NULL DEFAULT 0,
  current_birds INTEGER NOT NULL DEFAULT 0,
  date_acquired DATE DEFAULT CURRENT_DATE,
  age_weeks INTEGER DEFAULT 1,
  cost_per_bird NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  pen TEXT DEFAULT '',
  source TEXT DEFAULT '',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Completed', 'Culled')),
  health_status TEXT DEFAULT 'Healthy',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DAILY RECORDS
CREATE TABLE IF NOT EXISTS public.daily_records (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  poultry_type TEXT DEFAULT 'all',
  category TEXT NOT NULL CHECK (category IN ('feed', 'eggs', 'mortality', 'sales', 'expenses', 'health', 'activities', 'weights')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FEED INVENTORY
CREATE TABLE IF NOT EXISTS public.feed_inventory (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT '',
  quantity_bags NUMERIC DEFAULT 0,
  bag_weight_kg NUMERIC DEFAULT 25,
  unit_price NUMERIC DEFAULT 0,
  supplier TEXT DEFAULT '',
  status TEXT DEFAULT 'In Stock',
  min_stock_threshold_bags NUMERIC DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EGG PRODUCTION
CREATE TABLE IF NOT EXISTS public.egg_production (
  id TEXT PRIMARY KEY,
  flock_id TEXT NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_eggs INTEGER NOT NULL DEFAULT 0,
  broken_eggs INTEGER DEFAULT 0,
  rejected_eggs INTEGER DEFAULT 0,
  good_eggs INTEGER DEFAULT 0,
  crates NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MORTALITY RECORDS
CREATE TABLE IF NOT EXISTS public.mortality_records (
  id TEXT PRIMARY KEY,
  flock_id TEXT NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  cause TEXT DEFAULT 'Unknown',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. VACCINATIONS
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id TEXT PRIMARY KEY,
  flock_id TEXT NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  vaccine TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Overdue', 'Cancelled')),
  administered_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MEDICATIONS
CREATE TABLE IF NOT EXISTS public.medications (
  id TEXT PRIMARY KEY,
  flock_id TEXT NOT NULL REFERENCES public.flocks(id) ON DELETE CASCADE,
  flock_name TEXT DEFAULT '',
  medication_name TEXT NOT NULL,
  reason TEXT DEFAULT '',
  dosage TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  cost NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT DEFAULT '',
  product TEXT NOT NULL,
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial')),
  payment_method TEXT DEFAULT 'Cash',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to TEXT DEFAULT '',
  due_date DATE DEFAULT CURRENT_DATE,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id TEXT REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  time TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'Super Admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Farm ID helper function
CREATE OR REPLACE FUNCTION public.get_user_farm_id()
RETURNS TEXT AS $$
DECLARE
  f_id TEXT;
BEGIN
  SELECT farm_id INTO f_id FROM public.profiles WHERE id = auth.uid();
  RETURN f_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- 1. PROFILES RLS
CREATE POLICY "Users can view own profile or admins view all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. FARMS RLS
CREATE POLICY "Users can view own farms or admins view all" ON public.farms
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own farms" ON public.farms
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own farms" ON public.farms
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own farms" ON public.farms
  FOR DELETE USING (owner_id = auth.uid() OR public.is_admin());

-- 3. SUBSCRIPTION PLANS RLS
CREATE POLICY "Public read for subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (public.is_admin());

-- 4. FARM SUBSCRIPTIONS RLS
CREATE POLICY "Farmers view own subscription or admins view all" ON public.farm_subscriptions
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

CREATE POLICY "Farmers insert own subscription" ON public.farm_subscriptions
  FOR INSERT WITH CHECK (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

CREATE POLICY "Admins or farmers update own subscription" ON public.farm_subscriptions
  FOR UPDATE USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 5. SUBSCRIPTION ORDERS RLS
CREATE POLICY "Farmers view own orders or admins view all" ON public.subscription_orders
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

CREATE POLICY "Farmers create own orders" ON public.subscription_orders
  FOR INSERT WITH CHECK (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 6. FLOCKS RLS
CREATE POLICY "Farmers manage own flocks" ON public.flocks
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 7. DAILY RECORDS RLS
CREATE POLICY "Farmers manage own daily records" ON public.daily_records
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 8. FEED INVENTORY RLS
CREATE POLICY "Farmers manage own feed inventory" ON public.feed_inventory
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 9. EGG PRODUCTION RLS
CREATE POLICY "Farmers manage own egg production" ON public.egg_production
  FOR ALL USING (
    flock_id IN (
      SELECT f.id FROM public.flocks f
      JOIN public.profiles p ON p.farm_id = f.farm_id
      WHERE p.id = auth.uid()
    ) OR public.is_admin()
  );

-- 10. MORTALITY RECORDS RLS
CREATE POLICY "Farmers manage own mortality records" ON public.mortality_records
  FOR ALL USING (
    flock_id IN (
      SELECT f.id FROM public.flocks f
      JOIN public.profiles p ON p.farm_id = f.farm_id
      WHERE p.id = auth.uid()
    ) OR public.is_admin()
  );

-- 11. VACCINATIONS RLS
CREATE POLICY "Farmers manage own vaccinations" ON public.vaccinations
  FOR ALL USING (
    flock_id IN (
      SELECT f.id FROM public.flocks f
      JOIN public.profiles p ON p.farm_id = f.farm_id
      WHERE p.id = auth.uid()
    ) OR public.is_admin()
  );

-- 12. MEDICATIONS RLS
CREATE POLICY "Farmers manage own medications" ON public.medications
  FOR ALL USING (
    flock_id IN (
      SELECT f.id FROM public.flocks f
      JOIN public.profiles p ON p.farm_id = f.farm_id
      WHERE p.id = auth.uid()
    ) OR public.is_admin()
  );

-- 13. CUSTOMERS RLS
CREATE POLICY "Farmers manage own customers" ON public.customers
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 14. SALES RLS
CREATE POLICY "Farmers manage own sales" ON public.sales
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 15. EXPENSES RLS
CREATE POLICY "Farmers manage own expenses" ON public.expenses
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 16. INVENTORY RLS
CREATE POLICY "Farmers manage own inventory" ON public.inventory
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 17. WORKERS RLS
CREATE POLICY "Farmers manage own workers" ON public.workers
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 18. TASKS RLS
CREATE POLICY "Farmers manage own tasks" ON public.tasks
  FOR ALL USING (
    farm_id IN (SELECT farm_id FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
  );

-- 19. NOTIFICATIONS RLS
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

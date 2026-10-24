# PoultryPro Setup & Deployment Guide

This guide covers setup and running options for PoultryPro:
1. **Supabase Cloud Backend (Recommended & Production-Ready)** — Allows farmers to register, log in, record farm activities, and use PoultryPro online from anywhere without requiring a running local PC.
2. **Local MySQL (XAMPP) Backend (Legacy / Offline Alternative)** — Optional offline development mode using local Express and XAMPP MySQL.

---

## 1. Supabase Cloud Backend Integration (Production & Vercel)

PoultryPro uses Supabase for Authentication, PostgreSQL database with Row Level Security (RLS), and real-time data persistence.

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account or sign in.
2. Click **New Project**, choose a project name (e.g. `poultrypro`), set a strong database password, and pick a region close to your users (e.g., EU / Frankfurt or US East).

### Step 2: Run Database Migration
1. In your Supabase Dashboard, open the **SQL Editor** from the left sidebar.
2. Click **New Query**.
3. Open `supabase/migrations/20261024_initial_schema.sql` from this repository.
4. Copy the entire contents of the file, paste it into the Supabase SQL editor, and click **Run**.
5. All 19 tables, Row Level Security (RLS) policies, helper functions, and default subscription plans (`BASIC`, `PROFESSIONAL`, `ENTERPRISE`) are now created.

### Step 3: Get Your API Credentials
1. In your Supabase Dashboard, navigate to **Project Settings** > **API**.
2. Copy the **Project URL** (e.g. `https://xyzcompany.supabase.co`).
3. Copy the **anon / public** API key.

### Step 4: Configure Local `.env`
In the project root, edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

### Step 5: Configure Vercel Deployment
To deploy PoultryPro on Vercel:
1. Go to your project on the **Vercel Dashboard**.
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following two variables:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `your-anon-public-key`
4. Redeploy the project (**Deployments** > **Redeploy**).
5. The application will immediately connect to Supabase upon loading, allowing farmers to sign up, sign in, and record data live online.

### Step 6: Create an Admin Account
To access the PoultryPro Admin Panel (`/admin`):
1. Register an account through the app's sign-up page (`/register`), or create a user in Supabase under **Authentication** > **Users**.
2. In the Supabase **SQL Editor**, promote that user to admin:
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'your-admin-email@example.com';
   ```
3. Sign in to `/admin/login` with those credentials.

---

## 2. Local MySQL (XAMPP) Backend (Offline Fallback)

If you wish to test with the local Express + XAMPP MySQL backend instead:

1. Open the **XAMPP Control Panel** and start **MySQL** (port 3306).
2. Start the local backend:
   ```powershell
   cd backend
   npm run dev
   ```
3. In root `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend:
   ```powershell
   npm run dev:frontend
   ```

---

## 3. Architecture Overview

- **Auth**: Handled by `@supabase/supabase-js` auth methods (`signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`).
- **Database Tables**:
  - `profiles`: Farmer profile details and user roles (`farmer`, `admin`, `super_admin`).
  - `farms`: Multi-farm support with poultry types, location, currency, weight units.
  - `flocks`: Flock management (breed, current birds, mortality, status).
  - `feed_inventory` & `feed_logs`: Feed stocks, bag weights, daily feed consumption.
  - `egg_production`: Good eggs, broken eggs, egg collection logs.
  - `mortality_records`: Daily bird mortality logs.
  - `vaccinations` & `medications`: Health schedules, status, and administration.
  - `sales`: Sales records, customer associations, quantity, payment methods.
  - `expenses`: Farm operational expenditures.
  - `customers`: Customer directory, outstanding balances.
  - `workers`: Farm staff accounts and salary records.
  - `daily_records`: Consolidated daily activity logs.
  - `subscription_plans` & `farm_subscriptions`: Multi-tier subscription management.
- **Graceful Fallback**: If Supabase environment variables are missing, PoultryPro automatically operates in local mode using `localStorage` without crashing React or showing white screens.

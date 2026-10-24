/**
 * Supabase Authentication Service
 * Wraps Supabase Auth for PoultryPro farmer sign-up, sign-in, and session management.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { createInitialSubscription } from '../subscriptionService.js';
import { PLANS } from '../../constants/plans.js';

/**
 * Register a new farmer with Supabase Auth and create their profile + farm.
 */
export async function signUp({ fullName, email, password, phone, farmName, poultryTypes, planId, billingCycle }) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        farm_name: farmName,
      }
    }
  });

  if (authError) throw new Error(authError.message);
  if (!authData?.user) throw new Error('Registration failed. Please try again.');

  const userId = authData.user.id;

  // 2. Create the farmer profile row (the DB trigger may also do this, upsert is safe)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    email,
    phone: phone || null,
    role: 'farmer',
  }, { onConflict: 'id' });

  if (profileError) console.warn('Profile upsert warning:', profileError.message);

  // 3. Create the farm record
  const { data: farmData, error: farmError } = await supabase.from('farms').insert({
    owner_id: userId,
    name: farmName || 'My Farm',
    poultry_types: Array.isArray(poultryTypes) ? poultryTypes : [],
  }).select().single();

  if (farmError) console.warn('Farm creation warning:', farmError.message);

  const farmId = farmData?.id || null;

  // 4. Update profile with farmId
  if (farmId) {
    await supabase.from('profiles').update({ farm_id: farmId }).eq('id', userId);
  }

  // 5. Create the initial subscription (trial)
  const initialSub = createInitialSubscription(planId || PLANS.BASIC, billingCycle || 'monthly');
  const trialEndsAt = new Date(initialSub.trialEndsAt).toISOString();

  const { error: subError } = await supabase.from('farm_subscriptions').insert({
    farm_id: farmId,
    user_id: userId,
    plan_id: (planId || PLANS.BASIC).toLowerCase(),
    status: 'trial',
    billing_cycle: billingCycle || 'monthly',
    trial_ends_at: trialEndsAt,
    current_period_end: trialEndsAt,
    auto_renew: true,
  });

  if (subError) console.warn('Subscription creation warning:', subError.message);

  return {
    user: {
      id: userId,
      email,
      fullName,
      phone,
      farmId,
      farmName: farmName || 'My Farm',
      poultryTypes: Array.isArray(poultryTypes) ? poultryTypes : [],
      role: 'farmer',
    },
    session: authData.session,
    subscription: initialSub,
  };
}

/**
 * Sign in a farmer with email + password.
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data?.user) throw new Error('Login failed. Please try again.');

  const profile = await getProfile(data.user.id);

  return {
    user: profile,
    session: data.session,
  };
}

/**
 * Sign out the current farmer.
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('Sign out error:', error.message);
}

/**
 * Get the currently authenticated session.
 */
export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return null;
  return data.session;
}

/**
 * Fetch the farmer profile including farm data.
 */
export async function getProfile(userId) {
  if (!supabase || !userId) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      farm_id,
      farms (
        id,
        name,
        location,
        poultry_types,
        size,
        currency,
        weight_unit
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !profile) return { id: userId, role: 'farmer' };

  const farm = Array.isArray(profile.farms) ? profile.farms[0] : profile.farms;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    role: profile.role || 'farmer',
    farmId: profile.farm_id || farm?.id || null,
    farmName: farm?.name || 'My Farm',
    poultryTypes: farm?.poultry_types || [],
  };
}

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(email) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

/**
 * Listen to auth state changes (returns unsubscribe function).
 */
export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}

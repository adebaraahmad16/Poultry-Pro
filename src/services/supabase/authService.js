import { normalizeProfile, resolveProfileAvatar } from '../profileService.js';
/**
 * Supabase Authentication Service
 * Wraps Supabase Auth for PoultryPro farmer sign-up, sign-in, and session management.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { createInitialSubscription } from '../subscriptionService.js';
import { PLANS } from '../../constants/plans.js';

// localStorage key for deferred registration intent (used when email confirmation is required)
const REGISTRATION_INTENT_KEY = 'poultrypro_registration_intent';

/**
 * Persist registration intent so it can be completed after email confirmation + login.
 * Only called when Supabase returns no session (email confirmation enabled).
 */
function saveRegistrationIntent(userId, { farmName, poultryTypes, planId, billingCycle }) {
  try {
    localStorage.setItem(REGISTRATION_INTENT_KEY, JSON.stringify({
      userId,
      farmName: farmName || 'My Farm',
      poultryTypes: Array.isArray(poultryTypes) ? poultryTypes : [],
      planId: planId || PLANS.BASIC,
      billingCycle: billingCycle || 'monthly',
    }));
  } catch { /* localStorage unavailable — intent will not be deferred */ }
}

/**
 * Read and clear the deferred registration intent from localStorage.
 * Returns null if none exists or if it belongs to a different user.
 */
export function consumeRegistrationIntent(userId) {
  try {
    const raw = localStorage.getItem(REGISTRATION_INTENT_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw);
    if (intent?.userId && intent.userId !== userId) return null;
    localStorage.removeItem(REGISTRATION_INTENT_KEY);
    return intent;
  } catch { return null; }
}

/**
 * Initialize a farmer's farm + subscription after a confirmed authenticated session exists.
 * Safe to call multiple times — checks for existing records before inserting.
 *
 * IMPORTANT: This must only be called when auth.uid() is non-null (i.e. a live session exists),
 * otherwise the RLS policies (owner_id = auth.uid()) will reject the INSERT.
 */
export async function initializeFarmerAccount({ userId, fullName, email, phone, farmName, poultryTypes, planId, billingCycle }) {
  if (!supabase || !userId) return null;

  // Profile upsert — trigger may have already created it; upsert is safe
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName || '',
    email: email || '',
    phone: phone || null,
    role: 'farmer',
  }, { onConflict: 'id' });
  if (profileError) console.warn('[initializeFarmerAccount] Profile upsert:', profileError.code, profileError.message);

  // Check for existing farm to avoid duplicate records
  const { data: existingFarm } = await supabase.from('farms').select('id').eq('owner_id', userId).maybeSingle();
  let farmId = existingFarm?.id;

  if (!farmId) {
    const newFarmId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { data: farmData, error: farmError } = await supabase.from('farms').insert({
      id: newFarmId,
      owner_id: userId,
      name: farmName || 'My Farm',
      poultry_types: Array.isArray(poultryTypes) ? poultryTypes : [],
    }).select('id').maybeSingle();

    if (farmError) {
      console.error('[initializeFarmerAccount] Farm creation failed:', farmError.code, farmError.message, 'userId:', userId);
      throw new Error(`Farm setup failed: ${farmError.message}`);
    }
    farmId = farmData?.id || newFarmId;
  }

  // Link profile to farm
  await supabase.from('profiles').update({ farm_id: farmId }).eq('id', userId);

  // Check for existing subscription to avoid duplicate records
  const { data: existingSub } = await supabase.from('farm_subscriptions').select('farm_id').eq('farm_id', farmId).maybeSingle();
  const initialSub = createInitialSubscription(planId || PLANS.BASIC, billingCycle || 'monthly');

  if (!existingSub) {
    const trialEndsAt = new Date(initialSub.trialEndsAt).toISOString();
    const { error: subError } = await supabase.from('farm_subscriptions').insert({
      farm_id: farmId,
      user_id: userId,
      plan_id: (planId || PLANS.BASIC).toLowerCase(),
      status: 'trial',
      billing_cycle: billingCycle || 'monthly',
      trial_ends_at: trialEndsAt,
      renewal_date: trialEndsAt,
      auto_renew: true,
    });
    if (subError) {
      console.error('[initializeFarmerAccount] Subscription creation failed:', subError.code, subError.message, 'farmId:', farmId, 'userId:', userId);
      // Don't throw — farm exists; subscription will be retried on next login
    }
  }

  return { farmId, subscription: initialSub };
}

/**
 * Register a new farmer with Supabase Auth and create their profile + farm.
 *
 * When email confirmation is ENABLED in Supabase, authData.session is null and
 * auth.uid() returns null server-side, so any INSERT guarded by RLS policy
 * "(owner_id = auth.uid())" will fail with a 401/403 error.
 *
 * Fix: when no session is returned, store the registration intent in localStorage
 * and defer farm + subscription creation to post-login initialization.
 */
export async function signUp({ fullName, email, password, phone, farmName, poultryTypes, planId, billingCycle }) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  // 1. Create the auth user (email + password only — no DB writes yet)
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
  const hasSession = !!authData.session;

  if (!hasSession) {
    // Email confirmation is required — auth.uid() is null, RLS would block any INSERT.
    // Persist farm intent so it can be initialized after verification + login.
    saveRegistrationIntent(userId, { farmName, poultryTypes, planId, billingCycle });

    return {
      user: { id: userId, email, fullName, phone, role: 'farmer' },
      session: null,
      subscription: null,
    };
  }

  // 2. Session exists (email confirmation disabled / auto-confirmed) — initialize now
  const { farmId, subscription: initialSub } = await initializeFarmerAccount({
    userId, fullName, email, phone, farmName, poultryTypes, planId, billingCycle,
  });

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
 * Self-healing: backfills profile.farm_id if missing but farm exists via owner_id.
 */
const profileRequests = new Map();
export function getProfile(userId) {
  if (!profileRequests.has(userId)) {
    const request = readProfile(userId).finally(() => { if (profileRequests.get(userId) === request) profileRequests.delete(userId); });
    profileRequests.set(userId, request);
  }
  return profileRequests.get(userId);
}

async function readProfile(userId) {
  if (!supabase || !userId) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, farm_id, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) throw new Error('Your account profile could not be found. Please contact support.');

  let farm = null;
  if (profile.farm_id) {
    const { data: f } = await supabase.from('farms').select('*').eq('id', profile.farm_id).maybeSingle();
    farm = f;
  }
  if (!farm) {
    const { data: f } = await supabase.from('farms').select('*').eq('owner_id', userId).maybeSingle();
    farm = f;
    // Silently backfill profile.farm_id for existing accounts — self-healing fix
    if (farm?.id && !profile.farm_id) {
      supabase.from('profiles').update({ farm_id: farm.id }).eq('id', userId).then(() => {});
    }
  }

  return resolveProfileAvatar(normalizeProfile({
    ...profile,
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    role: profile.role || 'farmer',
    farmId: profile.farm_id || farm?.id || null,
    farmName: farm?.name || 'My Farm',
    poultryTypes: farm?.poultry_types || [],
  }));
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
  let active = true;
  const timers = new Set();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // Leave the auth callback before querying the same Supabase client.
    const timer = setTimeout(async () => {
      timers.delete(timer);
      if (!active) return;
      // Ignore a queued event from an earlier account/session transition.
      try {
        const current = await supabase.auth.getSession();
        if (active) callback(current.error ? null : current.data?.session, current.error ? 'SESSION_ERROR' : event, current.error);
      } catch (error) { if (active) callback(null, 'SESSION_ERROR', error); }
    }, 0);
    timers.add(timer);
  });
  return () => { active = false; timers.forEach(clearTimeout); timers.clear(); subscription.unsubscribe(); };
}

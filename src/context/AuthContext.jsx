import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { signIn, signUp, signOut, getProfile, sendPasswordReset, onAuthStateChange } from '../services/supabase/authService.js';
import { subscriptionService, createInitialSubscription } from '../services/subscriptionService';
import { initializeStorage, getItem, setItem, KEYS } from '../services/storageService';
import { PLANS } from '../constants/plans.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    initializeStorage();

    // If Supabase is not configured, run in offline/demo mode
    if (!isSupabaseConfigured() || !supabase) {
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Check initial session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          if (!cancelled) {
            setUser(profile);
            setIsLoggedIn(true);
            setItem(KEYS.USER, profile);
            localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
          }
        } catch {
          if (!cancelled) {
            setUser(null);
            setIsLoggedIn(false);
          }
        }
      } else {
        if (!cancelled) {
          setUser(null);
          setIsLoggedIn(false);
          localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
        }
      }
      if (!cancelled) setLoading(false);
    });

    // Listen to ongoing auth changes
    const unsubscribe = onAuthStateChange(async (session) => {
      if (cancelled) return;
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          if (!cancelled) {
            setUser(profile);
            setIsLoggedIn(true);
            setItem(KEYS.USER, profile);
            localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
          }
        } catch {
          if (!cancelled) {
            setUser(null);
            setIsLoggedIn(false);
          }
        }
      } else {
        if (!cancelled) {
          setUser(null);
          setIsLoggedIn(false);
          localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
        }
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /**
   * Login with email + password via Supabase.
   */
  const login = async (email, password) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.');
    }
    setSessionMessage('');
    const { user: profile } = await signIn(email, password);

    // Restore or initialise local subscription state
    const localSub = subscriptionService.getSubscription();
    if (!localSub || localSub.status === 'trial') {
      // subscription is managed server-side; local copy is a UI cache
    }

    setItem(KEYS.USER, profile);
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    setUser(profile);
    setIsLoggedIn(true);
    return true;
  };

  /**
   * Register a new farmer via Supabase.
   */
  const register = async (formData) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.');
    }
    setSessionMessage('');

    const { user: newUser, subscription } = await signUp({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      farmName: formData.farmName,
      poultryTypes: formData.poultryTypes,
      planId: formData.planId || PLANS.BASIC,
      billingCycle: formData.billingCycle || 'monthly',
    });

    // Cache the subscription locally for immediate use
    if (subscription) {
      subscriptionService.saveSubscription(subscription);
    }

    // Update local farm profile cache
    const currentFarm = getItem(KEYS.FARM, {});
    const updatedFarm = {
      ...currentFarm,
      name: formData.farmName || 'My Farm',
      poultryTypes: Array.isArray(formData.poultryTypes) ? formData.poultryTypes : [],
    };
    setItem(KEYS.FARM, updatedFarm);

    setItem(KEYS.USER, newUser);
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    setUser(newUser);
    setIsLoggedIn(true);
    return true;
  };

  /**
   * Log out the current farmer.
   */
  const logout = async () => {
    await signOut();
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
    setIsLoggedIn(false);
    setUser(null);
    setSessionMessage('');
  };

  /**
   * Send password reset email.
   */
  const forgotPassword = async (email) => {
    await sendPasswordReset(email);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      sessionMessage,
      isSupabaseReady: isSupabaseConfigured(),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

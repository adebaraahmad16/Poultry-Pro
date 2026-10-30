import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { signIn, signUp, signOut, getProfile, sendPasswordReset, onAuthStateChange } from '../services/supabase/authService.js';
import { normalizeProfile, resolveProfileAvatar, saveProfile, saveProfileAvatar, verifiedProfileUser } from '../services/profileService';
import { subscriptionService } from '../services/subscriptionService';
import { initializeStorage, getItem, setItem, KEYS } from '../services/storageService';
import { PLANS } from '../constants/plans.js';

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const current = useRef(null), identity = useRef(null), epoch = useRef(0), revision = useRef(0), write = useRef(null);
  const commit = useCallback(profile => {
    const normalized = normalizeProfile(profile);
    current.current = normalized;
    setUser(normalized);
    setIsLoggedIn(Boolean(normalized));
    if (normalized) localStorage.setItem(KEYS.USER, JSON.stringify(normalized)); // Cache only; never used to authorize a session.
    else localStorage.removeItem(KEYS.USER);
    localStorage.setItem(KEYS.IS_LOGGED_IN, String(Boolean(normalized)));
  }, []);
  const loadSession = useCallback(async (session, event) => {
    const id = session?.user?.id || null;
    if (!id) {
      epoch.current++; identity.current = null; write.current = null;
      commit(null); setProfileSaving(false); setProfileError(''); setLoading(false); return;
    }
    if (id === identity.current && current.current?.id === id && event !== 'USER_UPDATED') return;
    if (id !== identity.current) {
      epoch.current++; identity.current = id; write.current = null;
      commit(null); setProfileSaving(false); setLoading(true);
    }
    const version = epoch.current;
    const profileVersion = revision.current;
    try {
      const profile = await getProfile(id);
      if (version === epoch.current && identity.current === id && profileVersion === revision.current) { commit(profile); setProfileError(''); }
    } catch (error) {
      if (version === epoch.current && profileVersion === revision.current) { commit(null); setProfileError(error.message); setSessionMessage(error.message); }
    } finally { if (version === epoch.current) setLoading(false); }
  }, [commit]);
  useEffect(() => {
    initializeStorage();
    if (!supabase || !isSupabaseConfigured()) { setLoading(false); return; }
    let active = true;
    const unsubscribe = onAuthStateChange((session, event) => { if (active) loadSession(session, event); });
    supabase.auth.getSession().then(({data,error}) => {
      if (!active) return;
      if (error) { setProfileError(error.message); setLoading(false); }
      else loadSession(data?.session);
    }).catch(error => { if (active) { setProfileError(error.message); setLoading(false); } });
    return () => { active = false; epoch.current++; unsubscribe(); };
  }, [loadSession]);

  useEffect(() => {
    if (!user?.id || !user.avatar_url) return;
    const version = epoch.current;
    const timer = setInterval(async () => {
      const source = current.current;
      if (!source) return;
      const updated = await resolveProfileAvatar(source);
      if (version === epoch.current && current.current === source) commit(updated);
    }, 45 * 60 * 1000);
    return () => clearInterval(timer);
  }, [user?.id, user?.avatar_url, commit]);

  const refreshProfile = useCallback(async () => {
    const expected = identity.current;
    const version = epoch.current;
    const profileVersion = revision.current;
    try {
      const authenticated = await verifiedProfileUser(expected);
      const profile = await getProfile(authenticated.id);
      if (version !== epoch.current || identity.current !== authenticated.id) throw new Error('Your account session changed. Please retry.');
      if (profileVersion !== revision.current) return current.current;
      commit(profile); setProfileError(''); return profile;
    } catch (error) { if (version === epoch.current && profileVersion === revision.current) setProfileError(error.message); throw error; }
  }, [commit]);
  const runProfileWrite = useCallback(task => {
    if (write.current) return write.current;
    const id = identity.current;
    const version = epoch.current;
    if (!id || !current.current) return Promise.reject(new Error('Sign in before updating your profile.'));
    revision.current++;
    setProfileSaving(true); setProfileError('');
    const promise = (async () => {
      try {
        const saved = await task(id);
        if (version !== epoch.current || identity.current !== id) throw new Error('Your account session changed. Please retry.');
        revision.current++;
        const updated = normalizeProfile({ ...current.current, ...saved });
        commit(updated); return updated;
      } catch (error) { if (version === epoch.current) setProfileError(error.message); throw error; }
      finally { if (write.current === promise) write.current = null; if (version === epoch.current) setProfileSaving(false); }
    })();
    write.current = promise; return promise;
  }, [commit]);
  const updateProfile = useCallback(values => runProfileWrite(id => saveProfile(values, id)), [runProfileWrite]);
  const uploadAvatar = useCallback(file => runProfileWrite(id => saveProfileAvatar(file, id)), [runProfileWrite]);

  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured. Please contact support.');
    setSessionMessage(''); setProfileError('');
    const { user: profile } = await signIn(email, password);
    await verifiedProfileUser(profile.id);
    if (identity.current !== profile.id) { epoch.current++; identity.current = profile.id; }
    commit(profile); setLoading(false); return true;
  };
  const register = async formData => {
    if (!supabase) throw new Error('Supabase is not configured. Please contact support.');
    setSessionMessage('');
    const result = await signUp({ ...formData, planId: formData.planId || PLANS.BASIC, billingCycle: formData.billingCycle || 'monthly' });
    if (!result.session) throw new Error('Your account was created. Confirm your email address, then sign in to continue.');
    const profile = await getProfile(result.user.id);
    if (result.subscription) subscriptionService.saveSubscription(result.subscription);
    setItem(KEYS.FARM, { ...getItem(KEYS.FARM, {}), name: formData.farmName || 'My Farm', poultryTypes: formData.poultryTypes || [] });
    identity.current = profile.id; epoch.current++; commit(profile); setLoading(false); return true;
  };
  const logout = async () => {
    epoch.current++; identity.current = null; write.current = null;
    commit(null); setProfileError(''); setProfileSaving(false); setSessionMessage('');
    await signOut();
  };
  return <AuthContext.Provider value={{ user, isLoggedIn, loading, login, register, logout,
    forgotPassword: sendPasswordReset, sessionMessage, profileError, profileSaving,
    updateProfile, refreshProfile, uploadAvatar, isSupabaseReady: isSupabaseConfigured(),
  }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);

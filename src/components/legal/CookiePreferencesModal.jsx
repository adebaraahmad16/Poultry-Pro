import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Lock, Info, Sliders } from '../common/Icons';
import {
  getCookieConsent,
  saveCookieConsent,
  acceptAllCookies,
  rejectOptionalCookies,
  EVENT_OPEN_PREFERENCES,
  EVENT_CONSENT_UPDATED,
} from '../../services/cookieConsentService';
import { useToast } from '../../context/ToastContext';

export default function CookiePreferencesModal() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const handleOpen = () => {
      const current = getCookieConsent();
      setPreferences({
        functional: current.functional,
        analytics: current.analytics,
        marketing: current.marketing,
      });
      setIsOpen(true);
    };

    const handleUpdated = (e) => {
      if (e.detail) {
        setPreferences({
          functional: Boolean(e.detail.functional),
          analytics: Boolean(e.detail.analytics),
          marketing: Boolean(e.detail.marketing),
        });
      }
    };

    window.addEventListener(EVENT_OPEN_PREFERENCES, handleOpen);
    window.addEventListener(EVENT_CONSENT_UPDATED, handleUpdated);
    return () => {
      window.removeEventListener(EVENT_OPEN_PREFERENCES, handleOpen);
      window.removeEventListener(EVENT_CONSENT_UPDATED, handleUpdated);
    };
  }, []);

  const handleSave = () => {
    saveCookieConsent(preferences);
    setIsOpen(false);
    toast?.success?.('Your cookie and storage preferences have been saved.', {
      title: 'Preferences Updated',
    });
  };

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsOpen(false);
    toast?.success?.('All cookie and storage preferences accepted.', {
      title: 'Preferences Saved',
    });
  };

  const handleRejectOptional = () => {
    rejectOptionalCookies();
    setIsOpen(false);
    toast?.info?.('Optional cookies rejected. Only essential technologies remain active.', {
      title: 'Preferences Saved',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-preferences-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cookie-preferences-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Cookie & Storage Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize how PoultryPro uses cookies and browser storage technologies.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close preferences modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {/* 1. Essential */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Essential Technologies</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <Lock className="w-3 h-3" />
                Always Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Required for core platform security, Supabase user authentication, session persistence, and Row Level Security isolation. These cannot be switched off without preventing you from logging in.
            </p>
          </div>

          {/* 2. Functional */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Functional & Personalization</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Remembers your selected poultry type filter, dashboard view preferences, and interface state between visits to provide a smoother daily experience.
            </p>
          </div>

          {/* 3. Analytics */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Analytics & Performance</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Helps us understand how farmers use the platform to diagnose errors and improve features. <span className="font-semibold text-slate-700 dark:text-slate-300">Note: PoultryPro does not load third-party analytics trackers (such as Google Analytics).</span>
            </p>
          </div>

          {/* 4. Marketing */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Marketing & Advertising</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Used across third-party networks for advertising. <span className="font-semibold text-slate-700 dark:text-slate-300">Note: PoultryPro does not display third-party ads or share data with advertising brokers. This category remains inactive by default.</span>
            </p>
          </div>
        </div>

        {/* Footer info notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <span>
            You can modify these preferences at any time by clicking <strong>Manage Cookie Preferences</strong> in the website footer or within our Cookie Policy.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRejectOptional}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Reject Optional
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Preferences
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

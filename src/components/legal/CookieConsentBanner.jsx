import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X, Check } from '../common/Icons';
import {
  hasUserConsented,
  acceptAllCookies,
  rejectOptionalCookies,
  openCookiePreferencesModal,
  EVENT_CONSENT_UPDATED,
} from '../../services/cookieConsentService';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if no prior consent decision exists
    if (!hasUserConsented()) {
      // Slight delay so page renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }

    // Listen for consent updates from preferences modal to hide banner
    const handleUpdate = () => setVisible(false);
    window.addEventListener(EVENT_CONSENT_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENT_CONSENT_UPDATED, handleUpdate);
  }, []);

  const handleAccept = () => {
    acceptAllCookies();
    setVisible(false);
  };

  const handleReject = () => {
    rejectOptionalCookies();
    setVisible(false);
  };

  const handleManage = () => {
    openCookiePreferencesModal();
    // Don't hide banner yet – preferences modal will dispatch consent event when saved
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="cookie-banner-title" className="text-sm font-extrabold text-slate-900">
                We Value Your Privacy
              </h2>
              <p id="cookie-banner-desc" className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
                PoultryPro uses essential technologies to keep your account secure and optional storage to improve your experience.
                You can manage your preferences at any time.{' '}
                <Link to="/cookie-policy" className="text-emerald-600 hover:underline font-semibold">
                  Cookie Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleManage}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors whitespace-nowrap"
            >
              Manage Preferences
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors whitespace-nowrap"
            >
              Reject Optional
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldAlert, Bird } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';

export default function AdminLogin() {
  const { loginAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || '/admin/dashboard';

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your administrator email and security password.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    let success;
    try { success = await loginAdmin(email,password); } catch(e) { setError(e.message); return; }
    finally { setSubmitting(false); }
    if (success) {
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center lg:py-0">
      <div className="w-full max-w-6xl mx-auto lg:my-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Left Column: Brand Hero (Forest Green #123524) */}
          <div className="lg:col-span-5 bg-[#123524] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle solid geometric accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Link to="/" className="flex items-center gap-3 group" aria-label="PoultryPro home">
                <span className="w-11 h-11 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-md">
                  <Bird className="w-7 h-7 stroke-[2.5]" />
                </span>
                <div>
                  <span className="text-2xl font-extrabold tracking-tight text-white block leading-none">
                    Poultry<span className="text-emerald-400">Pro</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold block mt-1">
                    Super Admin Portal
                  </span>
                </div>
              </Link>

              <div className="mt-12 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                  Platform Operations & Multi-Poultry Governance
                </h2>
                <p className="text-sm text-emerald-100/90 leading-relaxed">
                  Manage farmers across Nigeria, oversee broilers, layers, and specialty flocks, audit Paystack/Flutterwave subscription revenue, and resolve support requests.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-emerald-800/60 relative z-10 space-y-4">
              <div className="flex items-start gap-3 text-xs text-emerald-200/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict role-based access control (Super Admin, Finance, Support, Content).</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-emerald-200/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Encrypted audit logging for all account suspensions and price changes.</span>
              </div>
              <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <Link to="/" className="hover:text-white transition-colors flex items-center gap-1.5">
                  &larr; Return to Farmer Portal
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Sign-In Form */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto space-y-8">
              
              <div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold tracking-wide uppercase inline-flex items-center gap-1.5 mb-3">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Authorized Personnel Only
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Welcome Back, Administrator
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                  Enter your administrative credentials to access the PoultryPro Super Admin control panel.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  {error}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@poultrypro.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 rounded-lg"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    Remember this workstation
                  </label>
                  <button type="button" onClick={() => alert('Please contact the Platform Owner or IT Security to reset admin multi-factor credentials.')} className="font-semibold text-emerald-700 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? 'Verifying access...' : 'Access Super Admin Panel'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>



            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

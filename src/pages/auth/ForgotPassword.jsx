import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bird, Mail, ArrowLeft, CheckCircle2 } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
          <Bird className="w-7 h-7 stroke-[2.5]" />
        </div>

        {!submitted ? (
          <>
            <h2 className="text-2xl font-extrabold text-slate-900">Reset Password</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your registered email address to receive password reset instructions.</p>

            {error && <p role="alert" className="mt-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="farmer@greenvalley.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all mt-4"
              >
                {submitting ? 'Sending…' : 'Send Password Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Check Your Inbox</h3>
            <p className="mt-2 text-sm text-slate-600">
              We have dispatched password recovery instructions to <strong>{email}</strong>.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

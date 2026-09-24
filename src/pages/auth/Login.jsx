import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bird, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          <Link to="/" title="Go to Landing Page" className="inline-block hover:scale-105 transition-transform">
            <img 
              src="/favicon.svg" 
              alt="PoultryPro Logo" 
              className="w-14 h-14 rounded-2xl mx-auto mb-4 shadow-lg shadow-emerald-600/25 object-contain" 
            />
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your poultry farm</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            Sign In to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:underline">
              Create Farm Account
            </Link>
          </p>
          <div>
            <Link
              to="/"
              id="back-to-landing-bottom-btn"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-emerald-50/70 text-slate-600 hover:text-emerald-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm transition-all group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-slate-500 group-hover:text-emerald-600" />
              <span>Return to Landing Page</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

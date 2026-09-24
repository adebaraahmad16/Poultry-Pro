import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bird, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Poultry Types', href: '#poultry-types' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Advertise With Us', href: '#advertise' },
  { label: 'About', href: '#faq' },
];

export default function LandingNavbar() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goDashboard = () => navigate('/dashboard');

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="PoultryPro home">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md">
            <Bird className="w-6 h-6 stroke-[2.5]" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Poultry<span className="text-emerald-600">Pro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-emerald-600 transition-colors whitespace-nowrap">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={goDashboard}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-600/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col gap-2">
              {isLoggedIn ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-4 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-3 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded-xl">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 text-center bg-emerald-600 text-white font-bold text-sm rounded-xl"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

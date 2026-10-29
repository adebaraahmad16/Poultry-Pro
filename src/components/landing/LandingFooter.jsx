import React from 'react';
import { Link } from 'react-router-dom';
import { Bird, Facebook, Twitter, Instagram, Linkedin, Youtube } from '../common/Icons';
import { openCookiePreferencesModal } from '../../services/cookieConsentService';
import { SUPPORT_CONTACT } from '../../config/supportContact';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features', type: 'hash' },
      { label: 'Pricing', href: '#pricing', type: 'hash' },
      { label: 'Dashboard', href: '#dashboard-preview', type: 'hash' },
      { label: 'Poultry Types', href: '#poultry-types', type: 'hash' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'How It Works', href: '#how-it-works', type: 'hash' },
      { label: 'FAQs', href: '#faq', type: 'hash' },
      { label: 'Create Account', to: '/register', type: 'route' },
      { label: 'Contact Us', to: '/contact', type: 'route' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms-of-service', type: 'route' },
      { label: 'Privacy Policy', to: '/privacy-policy', type: 'route' },
      { label: 'Cookie Policy', to: '/cookie-policy', type: 'route' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', icon: Facebook },
  { label: 'Twitter / X', icon: Twitter },
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'YouTube', icon: Youtube },
];

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Bird className="w-5 h-5" />
              </span>
              <span className="text-lg font-extrabold text-white">PoultryPro</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-xs">
              Smart Management. Healthier Flocks. Better Profits.
            </p>
            <address className="mt-4 space-y-2 text-sm not-italic">
              <a href={SUPPORT_CONTACT.emailUrl} className="block break-words text-slate-300 hover:text-emerald-400">Email: 
                {SUPPORT_CONTACT.email}</a>
              <a href={SUPPORT_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-slate-300 hover:text-emerald-400">WhatsApp: {SUPPORT_CONTACT.phone}</a>
            </address>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-600 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.type === 'route' ? (
                      <Link
                        to={link.to}
                        className="text-sm hover:text-emerald-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm hover:text-emerald-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PoultryPro. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-xs text-slate-500">
            <Link to="/terms-of-service" className="hover:text-emerald-400 transition-colors">Terms</Link>
            <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">Cookies</Link>
            <button
              type="button"
              onClick={openCookiePreferencesModal}
              className="hover:text-emerald-400 transition-colors underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer text-xs text-slate-500"
            >
              Manage Cookie Preferences
            </button>
            <a href="/images/poultry/credits.html" className="hover:text-white transition-colors underline">Photo credits</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

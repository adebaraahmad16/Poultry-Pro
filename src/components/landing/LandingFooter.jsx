import React from 'react';
import { Bird, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Dashboard', href: '#dashboard-preview' },
      { label: 'Poultry Types', href: '#poultry-types' },
      { label: 'Reports', href: '#dashboard-preview' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Poultry Farming Guide', href: '#how-it-works' },
      { label: 'Help Center', href: '#faq' },
      { label: 'FAQs', href: '#faq' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Business',
    links: [
      { label: 'Advertise With Us', href: '#advertise' },
      { label: 'Partnerships', href: '#advertise' },
      { label: 'Contact Us', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
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
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Bird className="w-5 h-5" />
              </span>
              <span className="text-lg font-extrabold text-white">PoultryPro</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Smart Management. Healthier Flocks. Better Profits.
            </p>
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
                    <a href={link.href} className="text-sm hover:text-emerald-400 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PoultryPro. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">Smart Management. Healthier Flocks. Better Profits.</p>
        </div>
      </div>
    </footer>
  );
}

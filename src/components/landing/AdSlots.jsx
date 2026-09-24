import React from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';

/**
 * Sponsored label — rendered on every ad slot so users always
 * know they are looking at an advertisement.
 */
export function SponsoredLabel({ dark = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
      }`}
    >
      <Megaphone className="w-3 h-3" />
      Sponsored
    </span>
  );
}

/**
 * Slim top-of-page advertisement banner.
 * Usage: <TopBannerAd ad={TOP_BANNER_AD} />
 */
export function TopBannerAd({ ad }) {
  if (!ad) return null;
  return (
    <div className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
        <div className="flex items-center gap-2 text-sm">
          <span aria-hidden="true">{ad.emoji}</span>
          <span className="font-semibold">
            <span className="text-emerald-400">SPECIAL OFFER:</span>{' '}
            {ad.text.replace('SPECIAL OFFER: ', '')}
          </span>
          <a
            href={ad.href}
            className="hidden sm:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors"
          >
            {ad.cta} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <a
          href={ad.href}
          className="sm:hidden text-emerald-400 font-bold text-xs"
        >
          {ad.cta} →
        </a>
        <span className="hidden lg:inline-flex text-[10px] uppercase tracking-widest text-slate-500 border border-slate-700 rounded-full px-2 py-0.5 font-bold">
          Sponsored
        </span>
      </div>
    </div>
  );
}

/**
 * Large sponsored advertisement card shown beside the hero.
 */
export function HeroAdCard({ ad }) {
  if (!ad) return null;
  return (
    <aside className="relative bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-emerald-900/20 overflow-hidden">
      {/* Decorative rings */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border-[24px] border-emerald-600/30" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full border-[20px] border-emerald-500/20" aria-hidden="true" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            <Megaphone className="w-3 h-3" />
            Sponsored
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
            {ad.category}
          </span>
        </div>

        <div className="mt-5 w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl" aria-hidden="true">
          {ad.emoji}
        </div>

        <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">{ad.company}</p>
        <h3 className="mt-1 text-xl sm:text-2xl font-extrabold leading-snug">{ad.title}</h3>
        <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">{ad.text}</p>

        {ad.highlights && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {ad.highlights.map((h) => (
              <li
                key={h}
                className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-emerald-50"
              >
                ✓ {h}
              </li>
            ))}
          </ul>
        )}

        <a
          href={ad.href}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
        >
          {ad.cta}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </aside>
  );
}

/**
 * Sponsored card used in the "Recommended for Poultry Farmers" grid.
 */
export function SponsoredAdCard({ ad }) {
  if (!ad) return null;
  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform" aria-hidden="true">
          {ad.emoji}
        </div>
        <SponsoredLabel />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">{ad.company}</p>
      <h3 className="mt-1 text-base font-extrabold text-slate-900">{ad.title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed flex-1">{ad.text}</p>
      <a
        href={ad.href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
      >
        {ad.cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </div>
  );
}

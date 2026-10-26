import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bird, ChevronDown, ChevronRight } from '../common/Icons';

/**
 * Shared layout for Terms of Service, Privacy Policy, and Cookie Policy pages.
 * Provides sticky ToC (desktop), collapsible ToC (mobile), hero header, branding.
 */
export default function LegalPageLayout({
  pageTitle,
  pageSlug,
  description,
  version = '1.0',
  effectiveDate = '[To Be Confirmed — Pending Legal Review]',
  lastUpdated = 'October 2026',
  sections = [],
  children,
}) {
  const [activeSection, setActiveSection] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const observerRef = useRef(null);

  // Intersection Observer to highlight active ToC item on scroll
  useEffect(() => {
    if (!sections.length) return;
    const ids = sections.map((s) => s.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current && observerRef.current.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTocOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Navigation bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0" aria-label="PoultryPro home">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Bird className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </span>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
              Poultry<span className="text-emerald-600">Pro</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-[#123524] py-10 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/75" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300 mb-2 sm:mb-3">Legal Document</p>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight break-words">{pageTitle}</h1>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto px-1">{description}</p>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[11px] sm:text-xs text-emerald-200/80">
            <span className="bg-emerald-950/70 sm:bg-transparent px-2.5 py-1 rounded-lg border border-emerald-800/40 sm:border-0"><strong className="text-emerald-300">Version:</strong> {version}</span>
            <span className="bg-emerald-950/70 sm:bg-transparent px-2.5 py-1 rounded-lg border border-emerald-800/40 sm:border-0"><strong className="text-emerald-300">Effective Date:</strong> {effectiveDate}</span>
            <span className="bg-emerald-950/70 sm:bg-transparent px-2.5 py-1 rounded-lg border border-emerald-800/40 sm:border-0"><strong className="text-emerald-300">Last Updated:</strong> {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Legal navigation breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link to="/" className="hover:text-emerald-600 font-medium shrink-0">Home</Link>
            <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />
            <span className="text-slate-800 font-semibold truncate">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-xs scrollbar-none shrink-0">
            <span className="text-slate-400 hidden md:inline">Other policies:</span>
            {pageSlug !== 'terms-of-service' && (
              <Link to="/terms-of-service" className="text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 sm:border-0 sm:bg-transparent sm:p-0">
                Terms of Service
              </Link>
            )}
            {pageSlug !== 'privacy-policy' && (
              <Link to="/privacy-policy" className="text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 sm:border-0 sm:bg-transparent sm:p-0">
                Privacy Policy
              </Link>
            )}
            {pageSlug !== 'cookie-policy' && (
              <Link to="/cookie-policy" className="text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 sm:border-0 sm:bg-transparent sm:p-0">
                Cookie Policy
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* DESKTOP Table of Contents — sticky on desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-32 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-h-[calc(100vh-10rem)] overflow-y-auto">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Table of Contents</p>
              <nav aria-label="Table of contents">
                <ol className="space-y-1">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(s.id)}
                        className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors flex items-start gap-1.5 ${
                          activeSection === s.id
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-400 font-bold text-xs shrink-0">{i + 1}.</span>
                        <span className="truncate">{s.title}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          {/* MOBILE: Collapsible ToC */}
          <div className="lg:hidden w-full">
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-500/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Table of Contents ({sections.length} sections)
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform text-slate-500 ${tocOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>
            {tocOpen && (
              <nav className="mt-2 bg-white border border-slate-200 rounded-xl p-3 shadow-md max-h-72 overflow-y-auto" aria-label="Mobile table of contents">
                <ol className="space-y-1">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(s.id)}
                        className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-colors flex items-start gap-2 ${
                          activeSection === s.id
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{s.title}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>

          {/* RIGHT / MAIN: Legal Content */}
          <main className="flex-1 min-w-0">
            {/* Important Notice */}
            <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Important Notice:</strong> This document is a draft prepared for review. The business details, data handling practices, payment policies, and applicable legal requirements should be verified by a qualified legal professional before publication. Identified placeholders (marked <em>[To Be Confirmed]</em>) require confirmation from the business owner before this document is made publicly effective.
            </div>

            {/* Page content */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8 lg:p-10 max-w-none">
              {children}
            </div>

            {/* Footer links */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link to="/terms-of-service" className="hover:text-emerald-600 font-medium">Terms of Service</Link>
                <Link to="/privacy-policy" className="hover:text-emerald-600 font-medium">Privacy Policy</Link>
                <Link to="/cookie-policy" className="hover:text-emerald-600 font-medium">Cookie Policy</Link>
              </div>
              <div>
                <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Simple footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs">
          <p>© {new Date().getFullYear()} PoultryPro. All rights reserved.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link to="/terms-of-service" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

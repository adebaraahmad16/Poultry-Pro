/**
 * Shared Visual Themes for PoultryPro Subscription Plans
 * Matches the canonical landing page colors:
 * - Basic: Clean white card, forest green (#15803D) accents & button, dark slate text
 * - Pro (Professional): Soft blue (#EFF6FF) card, royal blue (#2563EB) accents & button, dark slate text
 * - Enterprise: Deep midnight navy (#172554) card, rich gold (#FACC15) accents & button, crisp white text
 */

export const THEMES = {
  basic: {
    card: 'bg-white border-slate-200',
    cardSelected: 'bg-white border-[#15803D] ring-2 ring-[#15803D]/25 shadow-md',
    title: 'text-[#1F2937]',
    body: 'text-slate-600',
    muted: 'text-slate-500',
    accent: 'text-[#15803D]',
    box: 'bg-[#F8FAF9]',
    button: 'bg-[#15803D] hover:bg-green-800 text-white',
    badge: 'bg-[#15803D] text-white',
    divider: 'border-slate-100',
    control: 'border-slate-200 text-slate-700 hover:bg-slate-50',
    checkbox: 'border-[#15803D] bg-[#15803D] text-white',
    checkboxInactive: 'border-slate-300 bg-white'
  },
  professional: {
    card: 'bg-[#EFF6FF] border-[#93C5FD] hover:shadow-md hover:border-[#2563EB]',
    cardSelected: 'bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#2563EB]/30 shadow-md',
    title: 'text-[#1E293B]',
    body: 'text-[#1E293B]',
    muted: 'text-slate-600',
    accent: 'text-[#2563EB]',
    box: 'bg-white/70',
    button: 'bg-[#2563EB] hover:bg-blue-700 text-white',
    badge: 'bg-[#2563EB] text-white',
    divider: 'border-blue-200',
    control: 'border-blue-300 text-blue-800 hover:bg-blue-100',
    checkbox: 'border-[#2563EB] bg-[#2563EB] text-white',
    checkboxInactive: 'border-blue-300 bg-white/80'
  },
  enterprise: {
    card: 'bg-[#172554] border-[#172554] hover:shadow-md hover:border-[#FACC15]/60',
    cardSelected: 'bg-[#172554] border-[#FACC15] ring-2 ring-[#FACC15]/40 shadow-md',
    title: 'text-white',
    body: 'text-[#CBD5E1]',
    muted: 'text-[#CBD5E1]',
    accent: 'text-[#FACC15]',
    box: 'bg-white/5 text-[#CBD5E1]',
    button: 'bg-[#FACC15] hover:bg-yellow-300 text-[#172554]',
    badge: 'bg-[#FACC15] text-[#172554]',
    divider: 'border-white/20',
    control: 'border-white/30 text-white hover:bg-white/10',
    checkbox: 'border-[#FACC15] bg-[#FACC15] text-[#172554]',
    checkboxInactive: 'border-white/30 bg-white/10 text-white'
  }
};

export const getPlanTheme = (planId) => {
  const normalized = String(planId || 'basic').toLowerCase();
  if (normalized === 'enterprise' || normalized === 'pro') return THEMES.enterprise;
  if (normalized === 'professional') return THEMES.professional;
  return THEMES.basic;
};

export default THEMES;

import React from 'react';

const VARIANTS = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  successful: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  scheduled: 'bg-blue-50 text-blue-800 border-blue-200',
  open: 'bg-rose-50 text-rose-800 border-rose-200',
  high: 'bg-rose-50 text-rose-800 border-rose-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200',
  suspended: 'bg-rose-50 text-rose-800 border-rose-200',
  disabled: 'bg-slate-100 text-slate-700 border-slate-300',
  inactive: 'bg-slate-100 text-slate-700 border-slate-300',
  free: 'bg-slate-100 text-slate-700 border-slate-300',
  basic: 'bg-blue-50 text-blue-800 border-blue-200',
  pro: 'bg-purple-50 text-purple-800 border-purple-200',
  default: 'bg-slate-100 text-slate-700 border-slate-300'
};

export default function StatusBadge({ children, variant = 'default', className = '' }) {
  const key = String(variant || '').toLowerCase();
  const classes = VARIANTS[key] || VARIANTS.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize tracking-wide select-none ${classes} ${className}`}
    >
      {children}
    </span>
  );
}

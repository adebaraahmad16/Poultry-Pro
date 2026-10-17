import React from 'react';
import { ArrowUpRight, ArrowDownRight } from '../../components/common/Icons';

export default function StatCard({
  title,
  value,
  subtext,
  change,
  isPositive = true,
  icon: Icon,
  color = 'green' // 'green' | 'blue' | 'amber' | 'rose' | 'purple'
}) {
  const colorStyles = {
    green: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-700',
      border: 'border-emerald-100'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-700',
      border: 'border-blue-100'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-700',
      border: 'border-amber-100'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-700',
      border: 'border-rose-100'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-700',
      border: 'border-purple-100'
    }
  }[color] || {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-700',
    border: 'border-emerald-100'
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${colorStyles.bg} border ${colorStyles.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${colorStyles.icon}`} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400 font-medium truncate">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}

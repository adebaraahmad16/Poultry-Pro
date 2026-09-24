import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, trend, isPositive = true, icon: Icon, subtitle, color = 'green' }) {
  const colorStyles = {
    green: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800'
    }
  };

  const style = colorStyles[color] || colorStyles.green;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${style.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
}

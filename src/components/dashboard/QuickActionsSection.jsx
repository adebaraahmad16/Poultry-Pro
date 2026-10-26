import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Egg, Wheat, AlertTriangle, Syringe, Pill, Receipt, DollarSign, Plus } from '../common/Icons';

export default function QuickActionsSection({ flockId = null, className = '' }) {
  const navigate = useNavigate();

  const flockQuery = flockId ? `&flockId=${flockId}` : '';

  const actions = [
    {
      id: 'eggs',
      label: 'Record Eggs',
      subtitle: 'Egg Production',
      icon: Egg,
      path: `/production/eggs?action=record${flockQuery}`,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    },
    {
      id: 'feed',
      label: 'Record Feeding',
      subtitle: 'Feed Management',
      icon: Wheat,
      path: `/production/feed?action=feed${flockQuery}`,
      bg: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
    },
    {
      id: 'mortality',
      label: 'Record Mortality',
      subtitle: 'Health & Loss',
      icon: AlertTriangle,
      path: `/health/mortality?action=record${flockQuery}`,
      bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
    },
    {
      id: 'vaccination',
      label: 'Record Vaccination',
      subtitle: 'Vaccine Schedule',
      icon: Syringe,
      path: `/health/vaccinations?action=record${flockQuery}`,
      bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'medication',
      label: 'Record Medication',
      subtitle: 'Treatment Course',
      icon: Pill,
      path: `/health/medication?action=record${flockQuery}`,
      bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
    },
    {
      id: 'expense',
      label: 'Record Expense',
      subtitle: 'Farm Outflows',
      icon: Receipt,
      path: `/business/expenses?action=record${flockQuery}`,
      bg: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
    },
    {
      id: 'sale',
      label: 'Record Sale',
      subtitle: 'Farm Revenue',
      icon: DollarSign,
      path: `/business/sales?action=record${flockQuery}`,
      bg: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    }
  ];

  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            Quick Recording Actions
          </h2>
          <p className="text-xs text-slate-500">Record daily farm activities directly in their respective dashboards</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => navigate(act.path)}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer shadow-2xs group ${act.bg}`}
            >
              <div className="p-2 rounded-lg bg-white/80 shadow-2xs mb-2 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold leading-tight">{act.label}</span>
              <span className="text-[10px] opacity-75 mt-0.5">{act.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

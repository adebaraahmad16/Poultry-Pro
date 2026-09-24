import React from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { usePoultry } from '../../context/PoultryContext';

/**
 * Poultry Selector — shown when the farmer manages multiple poultry types.
 * Lets them switch between the "All Poultry" overview and each type's
 * personalized dashboard.
 */
export default function PoultrySelector() {
  const { activeTypeId, selectedTypes, isAllView, selectPoultryType } = usePoultry();

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manage:</span>
          <div className="relative">
            <select
              value={activeTypeId}
              onChange={(e) => selectPoultryType(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">All Poultry</option>
              {selectedTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick type chips with bird counts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => selectPoultryType('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
              isAllView
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            All Poultry
          </button>
          {selectedTypes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => selectPoultryType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                  activeTypeId === t.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

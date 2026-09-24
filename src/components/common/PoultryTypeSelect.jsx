import React from 'react';
import { Check } from 'lucide-react';
import { POULTRY_TYPES } from '../../constants/poultryTypes';

/**
 * Multi-select checkbox grid for choosing poultry types.
 * Used during registration, onboarding, and in Settings → Farm Profile.
 */
export default function PoultryTypeSelect({ selected = [], onChange, columns = 'grid-cols-2 sm:grid-cols-3' }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((t) => t !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
        What type of poultry do you manage?
      </label>
      <p className="text-xs text-slate-500 mb-3">You can select more than one.</p>
      <div className={`grid ${columns} gap-2`}>
        {POULTRY_TYPES.map((t) => {
          const isSelected = selected.includes(t.id);
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 p-0.5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <span className="text-xl leading-none text-emerald-600"><Icon className="w-5 h-5" /></span>
              <span className={`text-xs font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                {t.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

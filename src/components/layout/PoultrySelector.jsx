import React from 'react';
import { usePoultry } from '../../context/PoultryContext';
import { useRawFarm } from '../../context/FarmContext';
export default function PoultrySelector({compact=false}) {
  const {activeTypeId,selectedTypes,selectPoultryType}=usePoultry();
  const {accessibleFarms,selectedFarmId,selectFarm,dataLoading}=useRawFarm();
  if(compact) return <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6" aria-label="Farm and poultry selection">
    <label className="min-w-0 text-xs font-semibold text-slate-600">Farm<select aria-label="Selected farm" disabled={dataLoading} value={selectedFarmId||''} onChange={e=>selectFarm(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-2 text-sm text-slate-900">{accessibleFarms.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
    <label className="min-w-0 text-xs font-semibold text-slate-600">Selected poultry type<select aria-label="Selected poultry type" disabled={dataLoading} value={activeTypeId} onChange={e=>selectPoultryType(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-2 text-sm text-slate-900"><option value="all">All poultry</option>{selectedTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
  </div>;
  return <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-3" role="group" aria-label="Poultry types">{[{id:'all',label:'All poultry'},...selectedTypes].map(t=><button key={t.id} type="button" aria-pressed={activeTypeId===t.id} onClick={()=>selectPoultryType(t.id)} className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold ${activeTypeId===t.id?'border-green-700 bg-[#15803D] text-white':'border-slate-200 text-slate-700'}`}>{t.label}</button>)}</div>;
}
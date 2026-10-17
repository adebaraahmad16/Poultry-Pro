import React from 'react';
import { annualSavings, formatLimit } from '../../../shared/subscriptionPlans.js';

const THEMES = {
 basic: {card:'bg-white border-slate-200',title:'text-[#1F2937]',body:'text-slate-600',muted:'text-slate-500',accent:'text-[#15803D]',box:'bg-[#F8FAF9]',button:'bg-[#15803D] hover:bg-green-800 text-white',divider:'border-slate-100',control:'border-slate-200 text-slate-700 hover:bg-slate-50'},
 professional: {card:'bg-[#EFF6FF] border-[#93C5FD] hover:shadow-md hover:border-[#2563EB]',title:'text-[#1E293B]',body:'text-[#1E293B]',muted:'text-slate-600',accent:'text-[#2563EB]',box:'bg-white/70',button:'bg-[#2563EB] hover:bg-blue-700 text-white',divider:'border-blue-200',control:'border-blue-300 text-blue-800 hover:bg-blue-100'},
 enterprise: {card:'bg-[#172554] border-[#172554] hover:shadow-md hover:border-[#FACC15]/60',title:'text-white',body:'text-[#CBD5E1]',muted:'text-[#CBD5E1]',accent:'text-[#FACC15]',box:'bg-white/5 text-[#CBD5E1]',button:'bg-[#FACC15] hover:bg-yellow-300 text-[#172554]',divider:'border-white/20',control:'border-white/30 text-white hover:bg-white/10'},
};

export default function PlanCards({ plans, cycle = 'monthly', onChoose, admin = false, onEdit, onToggle, onView, subscriberCount = () => 0, currentPlanId }) {
 return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">{plans.filter(p => admin || p.status === 'Active').map(p => {
  const theme = THEMES[p.id] || THEMES.basic;
  return <article key={p.id} data-plan={p.id} className={`relative min-w-0 rounded-2xl border p-6 flex flex-col transition-[box-shadow,border-color] duration-200 ${theme.card}`}>
   {p.isMostPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] text-white px-4 py-1 text-xs font-bold whitespace-nowrap">Most Popular</span>}
   <h3 className={`text-2xl font-bold ${theme.title}`}>{p.name}</h3>
   <p className={`text-sm mt-2 min-h-[60px] ${theme.body}`}>{p.description}</p>
   <p className="mt-4"><strong className={`text-3xl font-bold ${theme.title}`}>₦{(cycle === 'annual' ? p.annualPrice : p.monthlyPrice).toLocaleString()}</strong><span className={`text-sm ${theme.muted}`}>/{cycle === 'annual' ? 'year' : 'month'}</span></p>
   <p className={`mt-1 text-xs ${theme.accent}`}>₦{p.monthlyPrice.toLocaleString()}/month · ₦{p.annualPrice.toLocaleString()}/year{annualSavings(p) > 0 ? ` · Save ${annualSavings(p)}% annually` : ''}</p>
   <dl className={`my-5 rounded-xl p-3 text-xs space-y-2 ${theme.box}`}>{[['Active flocks','maxFlocks'],['Bird capacity','maxBirds'],['Poultry types','maxPoultryTypes'],['Staff accounts','maxUsers'],['Farm locations','maxFarms']].map(([label,key]) => <div key={key} className="flex justify-between gap-2"><dt>{label}</dt><dd className={`font-bold ${p.id === 'basic' ? '' : theme.title}`}>{formatLimit(p[key])}</dd></div>)}</dl>
   <ul className={`text-sm space-y-2 flex-1 ${theme.body}`}>{p.features.map(feature => <li key={feature} className="flex gap-2"><span aria-hidden="true" className={theme.accent}>✓</span>{feature}</li>)}</ul>
   {admin ? <div className={`mt-6 pt-4 border-t space-y-3 ${theme.divider}`}>
    <p className={`text-sm font-semibold ${theme.body}`}>{subscriberCount(p)} subscribed farmers · <span className={p.status === 'Active' ? theme.accent : theme.muted}>{p.status}</span></p>
    <div className="flex flex-wrap gap-2"><button onClick={() => onEdit(p)} className={`px-3 py-2 rounded-lg text-xs font-bold ${theme.button}`}>Edit Plan</button><button onClick={() => onView(p)} className={`px-3 py-2 border rounded-lg text-xs font-bold ${p.id === 'basic' ? 'bg-[#2563EB] text-white border-transparent' : theme.control}`}>View Subscribers</button><button onClick={() => onToggle(p)} className={`px-3 py-2 border rounded-lg text-xs font-bold ${theme.control}`}>{p.status === 'Active' ? 'Disable' : 'Enable'}</button></div>
   </div> : <button onClick={() => onChoose(p)} className={`mt-6 py-3 rounded-xl font-bold text-sm transition-colors ${theme.button}`}>{currentPlanId?.toLowerCase() === p.id ? 'Renew Current Plan' : `Choose ${p.name}`}</button>}
  </article>;
 })}</div>;
}

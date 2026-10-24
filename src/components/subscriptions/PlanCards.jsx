import React from 'react';
import { annualSavings, formatLimit } from '../../../shared/subscriptionPlans.js';
import { THEMES } from '../../constants/planThemes.js';

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

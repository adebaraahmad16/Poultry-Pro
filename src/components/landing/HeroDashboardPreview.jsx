import React from 'react';
import { Bird, Egg, Wheat, PiggyBank, ShieldCheck, BarChart3 } from '../common/Icons';

const metrics = [
 { label: 'Total Birds', value: '1,200', note: '4 active flocks', icon: Bird, colour: 'text-[#15803D]', background: 'bg-green-50' },
 { label: 'Eggs Today', value: '840', note: 'Across laying flocks', icon: Egg, colour: 'text-[#2563EB]', background: 'bg-blue-50' },
 { label: 'Feed Stock', value: '680 kg', note: 'Farm-wide inventory', icon: Wheat, colour: 'text-amber-700', background: 'bg-amber-50' },
 { label: 'Net Profit', value: '₦160,000', note: 'Income less expenses', icon: PiggyBank, colour: 'text-[#15803D]', background: 'bg-green-50' },
];

export default function HeroDashboardPreview() {
 return <div data-hero-preview className="min-w-0 space-y-4">
  <figure aria-labelledby="hero-preview-title" className="overflow-hidden rounded-2xl border border-white/25 bg-[#F8FAF9] shadow-xl">
   <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
    <span id="hero-preview-title" className="flex items-center gap-2 text-sm font-bold text-[#1F2937]"><Bird className="h-5 w-5 text-[#15803D]" /> PoultryPro Dashboard</span>
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">Product preview · Example data</span>
   </figcaption>
   <div className="space-y-3 p-4">
    <div className="rounded-xl bg-[#0F172A] p-3 text-white">
     <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Farm Overview · All Poultry</p>
     <p className="mt-1 text-base font-bold">Example Poultry Farm</p>
     <p className="mt-1 text-xs text-slate-300">2 poultry types across 4 active flocks</p>
    </div>
    <div className="grid grid-cols-2 gap-3">{metrics.map(({label,value,note,icon:Icon,colour,background}) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5">
     <div className="flex items-center justify-between gap-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><span className={`rounded-lg p-1 ${background} ${colour}`}><Icon className="h-3.5 w-3.5" /></span></div>
     <p className={`mt-1 text-lg font-bold ${colour}`}>{value}</p><p className="mt-1 text-[10px] text-slate-500">{note}</p>
    </div>)}</div>
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
     <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-[#1F2937]">Revenue vs Expenses</p><p className="text-[10px] text-slate-500">Illustrative farm performance</p></div>
     <div className="mt-3 flex h-16 items-end gap-3 sm:gap-5" aria-hidden="true">{[[48,30],[62,42],[55,36],[74,48],[82,56],[96,64]].map(([income,expense],index) => <div key={index} className="flex h-full min-w-0 flex-1 items-end gap-1"><div className="flex-1 rounded-t bg-[#15803D]" style={{height:`${income}%`}}/><div className="flex-1 rounded-t bg-[#93C5FD]" style={{height:`${expense}%`}}/></div>)}</div>
     <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#15803D]"/>Revenue · ₦480,000</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#93C5FD]"/>Expenses · ₦320,000</span></div>
    </div>
    <p className="text-center text-[10px] leading-relaxed text-slate-500">An illustrative view of PoultryPro’s farm overview. These are sample figures, not live farm statistics.</p>
   </div>
  </figure>
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{[
   {icon:Bird,title:'Flock Management',text:'Birds, flock records and production.'},
   {icon:ShieldCheck,title:'Health Monitoring',text:'Mortality, vaccinations and flock health.'},
   {icon:BarChart3,title:'Financial Tracking',text:'Expenses, income and profitability.'},
  ].map(({icon:Icon,title,text}) => <div key={title} className="flex gap-2 rounded-xl border border-white/20 bg-[#123524]/90 p-3 text-white sm:block">
   <Icon className="h-4 w-4 shrink-0 text-emerald-300"/><div><p className="text-xs font-bold sm:mt-2">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-slate-200">{text}</p></div>
  </div>)}</div>
 </div>;
}

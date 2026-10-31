import React from 'react';
import { Link } from 'react-router-dom';
import { Wheat, Egg, AlertTriangle, Syringe, Pill, Receipt, DollarSign, Activity, ArrowUpRight } from '../common/Icons';

const grid='grid min-w-0 grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-4 auto-rows-fr gap-3 sm:gap-4';
const cards=[
 ['feed','Feed consumed','kg',Wheat,'/production/feed','Feed dashboard'],
 ['eggs','Eggs collected','eggs',Egg,'/production/eggs','Egg production'],
 ['mortality','Mortality','birds',AlertTriangle,'/health/mortality','Mortality dashboard'],
 ['vaccinations','Vaccinations','events',Syringe,'/health/vaccinations','Vaccination records'],
 ['medications','Medications','treatments',Pill,'/health/medication','Medication dashboard'],
 ['expenses','Expenses','',Receipt,'/business/expenses','Expenses dashboard'],
 ['sales','Sales','',DollarSign,'/business/sales','Sales dashboard'],
 ['activities','Recorded activities','records',Activity,null,'Activity history'],
];
export function DailyRecordsSkeleton(){
 return <section role="status" aria-label="Loading daily records" className="space-y-4"><div className="h-20 rounded-2xl bg-slate-100 motion-safe:animate-pulse"/><div className={grid}>{cards.map(([key])=><div key={key} className="min-h-[144px] rounded-2xl border border-slate-200 bg-white p-4"><div className="h-3 w-2/3 rounded bg-slate-100 motion-safe:animate-pulse"/><div className="mt-5 h-7 w-3/4 rounded bg-slate-100 motion-safe:animate-pulse"/></div>)}</div><span className="sr-only">Loading farm activity summaries…</span></section>;
}
export default function DailySummaryCards({values,currency}){
 return <section aria-label="Daily record summaries" className={grid}>{cards.map(([key,title,unit,Icon,path,link])=><article key={key} data-daily-summary={key} className="flex min-h-[144px] min-w-0 h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
  <div className="flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 text-sm font-semibold leading-5 text-slate-600">{title}</h2><span className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-700"><Icon aria-hidden="true" className="h-4 w-4"/></span></div>
  <p title={`${['expenses','sales'].includes(key)?currency+' ':''}${Number(values[key]||0).toLocaleString(undefined,{maximumFractionDigits:3})}${unit?' '+unit:''}`} className="mt-3 min-w-0 text-xl sm:text-2xl font-bold leading-tight tabular-nums text-slate-900 [overflow-wrap:anywhere]">{['expenses','sales'].includes(key)&&<span className="mr-1 text-sm font-semibold text-slate-600">{currency}</span>}<span data-summary-value>{Number(values[key]||0).toLocaleString(undefined,Math.abs(Number(values[key]||0))>=1000000?{notation:'compact',maximumFractionDigits:2}:{maximumFractionDigits:3})}</span>{unit&&<span className="ml-1 text-xs font-medium text-slate-500">{unit}</span>}</p>
  {path?<Link to={path} className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">{link}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0"/></Link>:<a href="#daily-activity-history" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-emerald-700 hover:underline">{link}</a>}
 </article>)}</section>;
}

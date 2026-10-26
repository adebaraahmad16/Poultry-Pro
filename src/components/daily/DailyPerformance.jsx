import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { totals, localDate, birdsOnDate, paymentsFor, receivedInPeriod } from '../../../shared/dailyRecords';
const offset=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d);};
const fmt=(n,d=2)=>n==null?'Not recorded':Number(n).toLocaleString(undefined,{maximumFractionDigits:d});
export default function DailyPerformance({records,allRecords,flocks,flock,date,currency,capabilities}) {
  const [range,setRange]=useState('Today'),[from,setFrom]=useState(date),[to,setTo]=useState(date);
  const end=range==='Yesterday'?offset(date,-1):range==='Custom Date Range'?to:date;
  const start=range==='Last 7 Days'?offset(date,-6):range==='Last 30 Days'?offset(date,-29):range==='Custom Date Range'?from:end;
  const selected=records.filter(r=>r.date>=start&&r.date<=end);
  const t=totals(selected),day=totals(records.filter(r=>r.date===date));
  t.received=receivedInPeriod(records,start,end);t.netCash=t.received-t.expenses;
  const week=totals(records.filter(r=>r.date>=offset(date,-6)&&r.date<=date)),month=totals(records.filter(r=>r.date>=offset(date,-29)&&r.date<=date));
  const cumulative=totals(records.filter(r=>r.date<=date));
  const birds=flock?birdsOnDate(flock,allRecords,end):flocks.reduce((n,f)=>n+(birdsOnDate(f,allRecords,end)||0),0);
  const startBirds=flock?birdsOnDate(flock,allRecords,date,true):null;
  const weights=records.filter(r=>r.category==='weight'&&r.status==='Recorded'&&r.date<=date).sort((a,b)=>b.date.localeCompare(a.date));
  const latest=weights[0],previous=weights.find(r=>r.date<latest?.date);
  const gain=latest&&previous?(latest.values.averageWeightKg-previous.values.averageWeightKg)/((Date.parse(latest.date)-Date.parse(previous.date))/86400000):null;
  const categories=new Set(selected.filter(r=>r.status==='Recorded').map(r=>r.category));
  const amount=(key,value,unit='')=>categories.has(key)?`${fmt(value)}${unit}`:'Not recorded';
  const cards=[['Live birds at end of range',fmt(birds)],['Feed consumed',amount('feed',t.feed,' kg')],['Mortality',amount('mortality',t.mortality,' birds')],['Eggs produced',amount('eggs',t.eggs)],['Water consumed',amount('water',t.water,' L')],['Expenses',amount('expenses',t.expenses,` ${currency}`)],['Sales revenue',amount('sales',t.revenue,` ${currency}`)],['Payments received',categories.has('sales')||t.received>0?`${fmt(t.received)} ${currency}`:'Not recorded'],['Net cash flow',categories.has('sales')||categories.has('expenses')||t.received>0?`${fmt(t.netCash)} ${currency}`:'Not recorded']];
  const paymentDates=records.flatMap(paymentsFor).map(p=>p.date).filter(d=>d>=start&&d<=end);
  const points=[...new Set([...selected.map(r=>r.date),...paymentDates])].sort().map(date=>{
    const day=selected.filter(r=>r.date===date),t=totals(day),has=c=>day.some(r=>r.category===c&&r.status==='Recorded');
    const received=receivedInPeriod(records,date,date);
    return {date,...t,feed:has('feed')?t.feed:null,mortality:has('mortality')?t.mortality:null,eggs:has('eggs')?t.eggs:null,revenue:has('sales')?t.revenue:null,received:has('sales')||received>0?received:null,expenses:has('expenses')?t.expenses:null};
  });
  const chart=(title,series)=><div className="min-w-0 rounded-xl border p-4" key={title}><h4 className="mb-3 text-sm font-semibold">{title}</h4><div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/>{series.map(([key,label,color])=><Line key={key} dataKey={key} name={label} stroke={color} strokeWidth={2} dot connectNulls={false}/>)}</LineChart></ResponsiveContainer></div></div>;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="daily-performance-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="daily-performance-title" className="text-lg font-bold">Daily Performance Summary</h2><label className="text-sm">Period<select className="ml-2 rounded-lg border p-2" value={range} onChange={e=>setRange(e.target.value)}>{['Today','Yesterday','Last 7 Days','Last 30 Days','Custom Date Range'].map(r=><option key={r}>{r}</option>)}</select></label></div>
    {range==='Custom Date Range'&&<div className="flex flex-wrap gap-3"><label className="text-sm">From <input type="date" className="rounded border p-2" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label className="text-sm">To <input type="date" className="rounded border p-2" value={to} min={from} max={localDate()} onChange={e=>setTo(e.target.value)}/></label></div>}
    <p className="text-xs text-slate-500">{start} to {end}. Totals include saved entries only; missing records remain unconfirmed.</p>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map(([label,value])=><div key={label} className="rounded-xl bg-[#F8FAF9] p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold break-words">{value}</p></div>)}</div>
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Feeding, production, health and growth details · {date}</summary><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {[
        ['Feed given / remaining',`${fmt(day.supplied)} / ${fmt(day.remaining)} kg`],['Feed per bird',startBirds>0?`${fmt(day.feed/startBirds,4)} kg`:'Select a flock'],['Feed last 7 / 30 days',`${fmt(week.feed)} / ${fmt(month.feed)} kg`],['Cumulative feed',`${fmt(cumulative.feed)} kg`],
        ['Mortality last 7 / 30 days',`${week.mortality} / ${month.mortality}`],['Cumulative mortality',fmt(cumulative.mortality)],['Daily mortality rate',startBirds>0&&records.some(r=>r.date===date&&r.category==='mortality')?`${fmt(day.mortality/startBirds*100)}%`:'Not recorded'],['Cumulative mortality rate',flock?.initialBirds?`${fmt(cumulative.mortality/flock.initialBirds*100)}%`:'Select a flock'],
        ['Saleable / damaged eggs',`${day.saleable} / ${day.damaged}`],['Eggs last 7 / 30 days',`${week.eggs} / ${month.eggs}`],['Hen-day production',(()=>{const es=records.filter(r=>r.category==='eggs'&&r.date===date&&r.status==='Recorded');const hens=es[0]?.values.layingHens;return hens&&es.every(r=>r.values.layingHens===hens)?`${fmt(day.eggs/hens*100)}%`:'Laying-hen population not recorded';})()],
        ['Water per bird',startBirds>0?`${fmt(day.water/startBirds,3)} L`:'Select a flock'],['Water last 7 / 30 days',`${fmt(week.water)} / ${fmt(month.water)} L`],['Latest / previous weight',`${fmt(latest?.values.averageWeightKg,3)} / ${fmt(previous?.values.averageWeightKg,3)} kg`],['Average daily weight gain',gain==null?'Two dated measurements required':`${fmt(gain*1000)} g/day`],
        ['Expenses last 7 / 30 days',`${fmt(week.expenses)} / ${fmt(month.expenses)} ${currency}`],['Sales last 7 / 30 days',`${fmt(week.revenue)} / ${fmt(month.revenue)} ${currency}`],
      ].map(([label,value])=><div key={label}><dt className="text-slate-500">{label}</dt><dd className="font-medium">{value}</dd></div>)}
    </dl></details>
    {capabilities?.reportsAnalytics && points.length>0 && <div className="grid gap-4 lg:grid-cols-2">{chart('Feed Consumption Trend',[['feed','Feed (kg)','#15803D']])}{chart('Mortality Trend',[['mortality','Deaths','#B45309']])}{chart('Egg Production Trend',[['eggs','Eggs collected','#2563EB']])}{chart('Financial Performance',[['revenue','Revenue','#2563EB'],['received','Payments received','#15803D'],['expenses','Expenses','#B45309']])}{flock&&weights.length>0&&<div className="rounded-xl border p-4"><h4 className="mb-3 text-sm font-semibold">Growth Trend (kg)</h4><div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={[...weights].reverse().map(r=>({date:r.date,weight:r.values.averageWeightKg}))}><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis/><Tooltip/><Line dataKey="weight" stroke="#15803D"/></LineChart></ResponsiveContainer></div></div>}</div>}
    {!selected.length&&<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No saved records in this period.</p>}
  </section>;
}

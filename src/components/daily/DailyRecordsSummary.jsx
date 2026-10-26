import React, {useEffect,useState} from 'react';
import { Link } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { usePoultry } from '../../context/PoultryContext';
import { localDate, totals, completion } from '../../../shared/dailyRecords';

export default function DailyRecordsSummary() {
  const {farm,flocks,dailyRecords,refreshAllData}=useFarm();
  const {activeType}=usePoultry();
  const [date,setDate]=useState(localDate);
  useEffect(()=>{const timer=setInterval(()=>{const next=localDate();if(next!==date){setDate(next);refreshAllData();}},30000);return()=>clearInterval(timer);},[date,refreshAllData]);
  const records=dailyRecords.filter(r=>r.date===date),t=totals(records);
  const trackers=flocks.filter(f=>!['Sold','Closed'].includes(f.status)).map(f=>completion(records,date,f));
  const total=trackers.reduce((n,c)=>n+c.total,0),completed=trackers.reduce((n,c)=>n+c.completed,0);
  const measured=records.filter(r=>r.category==='weight'&&r.status==='Recorded');
  const sample=measured.reduce((n,r)=>n+Number(r.values.sampleSize||0),0),weight=sample?measured.reduce((n,r)=>n+Number(r.values.totalWeightKg||0),0)/sample:null;
  const metric=(category,value,unit='')=>{
    const entries=records.filter(r=>r.category===category);
    return entries.some(r=>r.status==='Recorded')?`${Number(value).toLocaleString(undefined,{maximumFractionDigits:3})}${unit}`:entries.some(r=>r.status==='No Activity')?'No activity':'Not recorded';
  };
  const metrics=[['Feed consumed',metric('feed',t.feed,' kg')],['Mortality',metric('mortality',t.mortality,' birds')],activeType?.traits.eggs?['Egg production',metric('eggs',t.eggs,' eggs')]:['Body weight',weight==null?'Not recorded':`${weight.toFixed(3)} kg`],['Expenses',metric('expenses',t.expenses,` ${farm.currency||'NGN'}`)]];
  return <section aria-labelledby="today-records-title" className="rounded-2xl border border-green-200 bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 id="today-records-title" className="text-lg font-bold">Today's Farm Records</h2><p className="mt-1 text-sm text-slate-500">{activeType?.label||'All poultry'} · {date}</p></div><span className="text-sm font-semibold text-green-800">{completed} of {total} completed</span></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label,value])=><div className="min-w-0 rounded-xl bg-[#F8FAF9] p-3" key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-base font-bold sm:text-lg">{value}</dd></div>)}</dl>
    <div className="mt-4 flex flex-wrap gap-3"><Link to="/daily-records" className="min-h-11 rounded-lg bg-[#15803D] hover:bg-[#166534] px-4 py-3 text-sm font-semibold text-white transition-colors">View Daily Overview</Link></div>
  </section>;
}

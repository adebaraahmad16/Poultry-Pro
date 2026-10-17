import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { usePoultry } from '../../context/PoultryContext';
import { localDate, recordSummary, totals } from '../../../shared/dailyRecords';
import { dailyRecordService } from '../../services/dailyRecordService';
const choices=[['flocks','Flock Report'],['eggs','Egg Production Report'],['feed','Feed Consumption Report'],['mortality','Mortality Report'],['sales','Sales Report'],['expenses','Expense Report'],['financial','Profit & Loss Summary']];
export default function Reports() {
  const {farm,flocks,dailyRecords,currentPlan,canExportPdf,selectedFarmId}=useFarm();
  const {activeType,activeTypeId}=usePoultry();
  const [report,setReport]=useState('flocks'),[period,setPeriod]=useState('This Month'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const now=new Date(),end=new Date(now),start=new Date(now);
  if(period==='This Week')start.setDate(start.getDate()-6);
  if(period==='This Month')start.setDate(1);
  if(period==='Last Month'){start.setMonth(start.getMonth()-1,1);end.setDate(0);}
  const from=localDate(start),to=localDate(end);
  const entries=dailyRecords.filter(r=>r.date>=from&&r.date<=to&&(report==='flocks'||report==='financial'||r.category===report));
  const t=totals(entries),money=n=>`${farm.currency||'NGN'} ${Number(n).toLocaleString()}`;
  const exportCSV=async()=>{setError('');setBusy(true);try{await dailyRecordService.export({farmId:selectedFarmId,poultryType:activeTypeId,from,to,...(!['flocks','financial'].includes(report)?{category:report}:{})});}catch(e){setError(e.message);}finally{setBusy(false);}};
  const print=()=>{if(!canExportPdf()){setError(`Export requires an eligible plan. Current plan: ${currentPlan.name}.`);return;}window.print();};
  return <div className="space-y-6 pb-12"><header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-white p-4 sm:p-6"><div><h1 className="text-xl font-bold sm:text-2xl">Reports & Analytics</h1><p className="mt-1 text-sm text-slate-500">{activeType?.label||'All poultry'} · saved records for {farm.name}</p></div><div className="flex flex-wrap gap-2"><button disabled={busy||!canExportPdf()} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" onClick={exportCSV}>{busy?'Exporting…':'Export Records CSV'}</button><button className="rounded-lg border px-3 py-2 text-sm" onClick={print}>Export PDF</button><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>window.print()}>Print</button></div></header>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-2" role="group" aria-label="Report type">{choices.map(([id,label])=><button key={id} aria-pressed={report===id} onClick={()=>setReport(id)} className={`rounded-lg border px-3 py-2 text-sm ${report===id?'border-green-700 bg-green-50 text-green-800':'bg-white'}`}>{label}</button>)}</div>
    <label className="block text-sm font-semibold">Report period<select className="ml-2 rounded-lg border bg-white p-2" value={period} onChange={e=>setPeriod(e.target.value)}>{['Today','This Week','This Month','Last Month'].map(p=><option key={p}>{p}</option>)}</select></label>
    <section className="min-w-0 rounded-2xl border bg-white p-4 sm:p-6"><h2 className="text-lg font-bold">{choices.find(([id])=>id===report)?.[1]}</h2><p className="mt-1 text-sm text-slate-500">{activeType?.label||'All poultry'} · {from} to {to}</p>
    {report==='financial'&&<dl className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[['Sales revenue',money(t.revenue)],['Expenses',money(t.expenses)],['Revenue less expenses',money(t.revenue-t.expenses)]].map(([label,value])=><div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>}
    <div className="mt-4 max-w-full overflow-x-auto">{report==='flocks'?<table className="w-full min-w-[560px] text-left text-sm"><thead><tr>{['Flock','Poultry type','Initial birds','Live birds','Pen'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{flocks.filter(f=>f.dateAcquired<=to).map(f=><tr key={f.id} className="border-t"><td className="p-3">{f.name}</td><td className="p-3">{f.type}</td><td className="p-3">{f.initialBirds}</td><td className="p-3">{f.currentBirds}</td><td className="p-3">{f.pen||'Not recorded'}</td></tr>)}</tbody></table>:<table className="w-full min-w-[520px] text-left text-sm"><thead><tr>{['Date','Flock','Category','Saved values'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{entries.map(r=><tr key={r.id} className="border-t"><td className="p-3">{r.date}</td><td className="p-3">{flocks.find(f=>f.id===r.flockId)?.name||'Farm-wide'}</td><td className="p-3">{r.category}</td><td className="p-3">{recordSummary(r)}</td></tr>)}</tbody></table>}</div>
    {(report==='flocks'?!flocks.length:!entries.length)&&<p className="py-6 text-center text-sm text-slate-500">No saved records for this poultry type and period.</p>}</section>
  </div>;
}
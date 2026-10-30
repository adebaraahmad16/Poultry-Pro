import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import ResponsiveRecords from './ResponsiveRecords';

export default function TrialReminderMonitor() {
 const [rows,setRows]=useState([]),[page,setPage]=useState(0),[count,setCount]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true,pending=false;
  const load=async()=>{
   if(pending)return;pending=true;
   try{
    if(!isSupabaseConfigured())throw new Error('Delivery monitoring requires a configured Supabase backend.');
    const result=await supabase.from('subscription_reminders').select('id,farmer_name,farm_id,event_type,milestone,trial_started_at,trial_expires_at,dashboard_status,email_status,attempts,last_attempt_at,last_error,created_at',{count:'exact'}).order('created_at',{ascending:false}).range(page*25,page*25+24);
    if(result.error)throw result.error;
    if(active){setRows(result.data||[]);setCount(result.count||0);setError('');}
   }catch(e){if(active)setError(`Unable to load reminder delivery: ${e.message}`);}
   finally{pending=false;if(active)setLoading(false);}
  };
  setLoading(true);load();const timer=setInterval(load,60000);
  return()=>{active=false;clearInterval(timer);};
 },[page]);
 const date=value=>value?new Date(value).toLocaleString('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})+' UTC':'—';
 return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white" aria-label="Trial reminder delivery">
  <div className="p-4 sm:p-5 border-b"><h2 className="font-bold text-slate-900">Reminder Delivery</h2><p className="text-xs text-slate-500 mt-1">Automatic milestones: 10, 7, 5, 3 and 1 day. Accepted means the email provider accepted the request; delivered is confirmed by a signed provider webhook.</p></div>
  {error?<p role="alert" className="p-4 text-sm text-red-700 break-words">{error}</p>:loading?<p role="status" className="p-4 text-sm">Loading delivery records…</p>:<>
   <ResponsiveRecords><table className="w-full text-xs"><thead><tr>{['Farmer / Farm','Event','Trial Start / Expiry','Dashboard','Email','Attempts','Last Attempt / Error'].map(label=><th key={label} className="p-3 text-left text-slate-500">{label}</th>)}</tr></thead><tbody>
    {!rows.length&&<tr><td colSpan={7} className="p-5 text-slate-500">No reminder events recorded yet.</td></tr>}
    {rows.map(r=><tr key={r.id} className="border-t align-top"><td className="p-3 break-words"><strong>{r.farmer_name}</strong><p>{r.farm_id}</p></td><td className="p-3">{r.event_type==='trial_reminder'?`${r.milestone} days remaining`:r.event_type.replaceAll('_',' ')}<p className="text-slate-500">{date(r.created_at)}</p></td><td className="p-3">{date(r.trial_started_at)}<p>{date(r.trial_expires_at)}</p></td><td className="p-3">{r.dashboard_status}</td><td className="p-3 font-semibold">{r.email_status.replaceAll('_',' ')}</td><td className="p-3">{r.attempts}</td><td className="p-3 break-words">{date(r.last_attempt_at)}{r.last_error&&<p className="text-red-700 mt-1">{r.last_error}</p>}</td></tr>)}
   </tbody></table></ResponsiveRecords>
   <nav className="p-4 flex flex-wrap justify-between gap-3 text-sm" aria-label="Reminder delivery pagination"><button disabled={!page} onClick={()=>setPage(p=>p-1)} className="min-h-11 disabled:opacity-40">Previous</button><span>{count} events · Page {page+1} of {Math.max(1,Math.ceil(count/25))}</span><button disabled={(page+1)*25>=count} onClick={()=>setPage(p=>p+1)} className="min-h-11 disabled:opacity-40">Next</button></nav>
  </>}
 </section>;
}

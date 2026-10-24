import React, { useState } from 'react';
import PlanCards from '../../components/subscriptions/PlanCards';
import { usePlanCatalog } from '../../components/subscriptions/usePlanCatalog';
import { FEATURE_LABELS, LIMIT_KEYS, validatePlan } from '../../../shared/subscriptionPlans.js';
import { savePlan } from '../../services/planCatalog';
import { useAdmin } from '../context/AdminContext';
export default function SubscriptionPlansTab() {
 const { plans, loading, error, retry } = usePlanCatalog();
 const { farmers } = useAdmin();
 const [cycle, setCycle] = useState('monthly');
 const [editing, setEditing] = useState(null), [draft, setDraft] = useState(null);
 const [confirm, setConfirm] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
 const [subscribers, setSubscribers] = useState([]);
 const [view, setView] = useState(null);

 React.useEffect(() => {
   if (farmers && farmers.length) {
     setSubscribers(farmers);
   } else {
     request('/subscription/subscribers', { headers: { Authorization: `Bearer ${localStorage.getItem('poultrypro_admin_token') || ''}` } })
       .then(setSubscribers)
       .catch(() => setSubscribers([]));
   }
 }, [farmers]);
 const edit = p => { setEditing(p); setDraft(structuredClone(p)); setMessage(''); };
 const review = e => { e.preventDefault(); try { validatePlan(draft); setConfirm(draft); } catch(e) { setMessage(e.message); } };
 const save = async () => {
  setBusy(true); try { await savePlan(confirm.id,confirm); setConfirm(null);setEditing(null);setMessage('Plan saved. Published prices, features and limits are updated.'); } catch(e) {setMessage(e.message);} finally {setBusy(false);}
 };
 const input = 'w-full border border-slate-300 bg-white rounded-lg p-2 text-sm mt-1';
 const count = p => subscribers.filter(s => s.planId === p.id).length;
 return <div className="space-y-5">
  <div className="flex flex-wrap gap-3 justify-between"><div><h2 className="font-bold text-xl">Subscription Plans</h2><p className="text-sm text-slate-500">Manage the three paid plans published across PoultryPro.</p></div><select aria-label="Billing cycle" value={cycle} onChange={e => setCycle(e.target.value)} className="border rounded-lg px-3 py-2"><option value="monthly">Monthly billing</option><option value="annual">Annual billing</option></select></div>
  {loading && <p role="status">Loading subscription plans…</p>}
  {error && <div role="alert" className="p-3 border border-red-200 rounded-lg text-red-700">{error} <button onClick={retry} className="underline">Retry</button></div>}
  {message && <p role="status" className="p-3 bg-blue-50 text-blue-900 rounded-lg">{message}</p>}
  <PlanCards plans={plans} cycle={cycle} admin onEdit={edit} onToggle={p => setConfirm({...p,status:p.status === 'Active' ? 'Disabled' : 'Active'})} onView={setView} subscriberCount={count}/>
  {editing && <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="edit-plan-title" className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"><h3 id="edit-plan-title" className="text-xl font-bold">Edit {editing.name}</h3><form onSubmit={review} className="space-y-5 mt-4">
   <fieldset className="space-y-3"><legend className="font-bold">General Information</legend><label className="block text-sm">Plan name<input required maxLength={80} className={input} value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})}/></label><label className="block text-sm">Description<textarea required maxLength={1000} className={input} value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})}/></label><label className="block text-sm">Status<select className={input} value={draft.status} onChange={e => setDraft({...draft,status:e.target.value})}><option>Active</option><option>Disabled</option></select></label></fieldset>
   <fieldset><legend className="font-bold mb-2">Pricing (NGN)</legend><div className="grid grid-cols-2 gap-3">{[['Monthly price','monthlyPrice'],['Annual price','annualPrice']].map(([label,key]) => <label key={key} className="text-sm">{label}<input required type="number" min="0.01" step="0.01" className={input} value={draft[key]} onChange={e => setDraft({...draft,[key]:Number(e.target.value)})}/></label>)}</div></fieldset>
   <fieldset><legend className="font-bold">Usage Limits</legend><p className="text-xs text-slate-500 my-2">Select Unlimited for unrestricted capacity.</p><div className="grid sm:grid-cols-2 gap-3">{LIMIT_KEYS.map((key,i) => <label key={key} className="text-sm">{['Active flocks','Bird capacity','Poultry types','Staff accounts','Farm locations'][i]}<div className="flex items-center gap-2"><input aria-label={key} type="number" required={draft[key] !== null} disabled={draft[key] === null} min="1" step="1" className={input} value={draft[key] ?? ''} onChange={e => setDraft({...draft,[key]:Number(e.target.value)})}/><span className="whitespace-nowrap text-xs"><input type="checkbox" checked={draft[key] === null} onChange={e => setDraft({...draft,[key]:e.target.checked ? null : 1})}/> Unlimited</span></div></label>)}</div></fieldset>
   <fieldset><legend className="font-bold mb-2">Available Features</legend><div className="grid sm:grid-cols-2 gap-3">{Object.entries(FEATURE_LABELS).map(([key,label]) => <label className="text-sm flex gap-2" key={key}><input type="checkbox" checked={draft.capabilities[key]} onChange={e => setDraft({...draft,capabilities:{...draft.capabilities,[key]:e.target.checked}})}/>{label}</label>)}</div></fieldset>
   {message && <p role="alert" className="text-red-700 text-sm">{message}</p>}
   <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><button type="button" onClick={() => setDraft(structuredClone(editing))} className="px-4 py-2 border rounded-lg">Reset Changes</button><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancel</button><button className="px-4 py-2 bg-[#15803D] text-white rounded-lg">Save Changes</button></div>
  </form></section></div>}
  {confirm && <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="confirm-plan-title" className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"><h3 id="confirm-plan-title" className="font-bold">Confirm Plan Changes</h3><p className="text-sm">Publish changes to {confirm.name}? New selections will use this configuration. Existing subscriptions retain their agreed price. Usage limits apply immediately; disabling a plan preserves its subscribers.</p>{message && <p role="alert" className="text-sm text-red-700">{message}</p>}<div className="flex justify-end gap-2"><button disabled={busy} onClick={() => setConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button><button disabled={busy} onClick={save} className="px-4 py-2 bg-[#15803D] text-white rounded-lg">{busy ? 'Saving…' : 'Confirm and Save'}</button></div></section></div>}
  {view && <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Plan subscribers" className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto"><h3 className="font-bold text-lg">{view.name} Subscribers ({count(view)})</h3><ul className="divide-y my-4">{subscribers.filter(s => s.planId === view.id).map(s => <li key={s.id} className="py-3 text-sm"><strong>{s.fullName}</strong><p>{s.email} · {s.subscriptionStatus}</p></li>)}</ul>{!count(view) && <p className="my-4 text-sm text-slate-500">No subscribed farmers.</p>}<button onClick={() => setView(null)} className="px-4 py-2 border rounded-lg">Close</button></section></div>}
 </div>;
}

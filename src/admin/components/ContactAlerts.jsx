import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { contactQuery } from '../../services/contactService';
import { useContacts } from '../context/ContactContext';
import { adminRequestMessage, isAdminAccessError } from '../../services/adminAccess';
export default function ContactAlerts() {
  const { ready } = useContacts();
  const pending = useRef(null), blocked = useRef(false), sequence = useRef(0);
  const [rows,setRows] = useState([]);
  const [count,setCount] = useState(0);
  const [page,setPage] = useState(0);
  const [unread,setUnread] = useState(0);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!ready) return;
    if (pending.current?.page === page) return pending.current.promise;
    const seq = ++sequence.current;
    const request = (async () => {
    try {
      await contactQuery(async db => {
        const result = await db.from('notifications').select('*',{count:'exact'}).eq('category','contact').order('created_at',{ascending:false}).range(page*10,page*10+9);
        if (!result.error && seq === sequence.current) { setRows(result.data); setCount(result.count); }
        return result;
      });
      await contactQuery(async db => {
        const result = await db.from('notifications').select('id',{count:'exact',head:true}).eq('category','contact').eq('is_read',false);
        if (!result.error && seq === sequence.current) setUnread(result.count);
        return result;
      }); if (seq === sequence.current) { blocked.current = false; setError(''); }
    } catch (error) { if (seq === sequence.current) { blocked.current = isAdminAccessError(error); setError(adminRequestMessage(error)); } }
    })().finally(() => { if (pending.current?.promise === request) pending.current = null; });
    pending.current = { page, promise: request };
    return request;
  },[ready,page]);
  useEffect(() => { blocked.current = false; if (!ready) { sequence.current++; pending.current = null; setRows([]); setUnread(0); return; } load(); const t = setInterval(() => { if (!blocked.current && document.visibilityState !== 'hidden') load(); },15000); return () => clearInterval(t); },[ready,load]);
  const mark = async id => {
    setBusy(true);
    try { await contactQuery(db => db.from('notifications').update({is_read:true}).eq('id',id).eq('category','contact').select('id').single()); await load(); }
    catch { setError('Unable to mark notification as read.'); }
    finally { setBusy(false); }
  };
  return <section className="bg-white border rounded-2xl p-5 sm:p-8"><h2 className="text-xl font-bold">Enquiry Notifications <span className="text-sm text-blue-700">({unread} unread)</span></h2><p className="text-sm text-slate-500 mt-2">Alerts for new contact enquiries. Reading an alert leaves the enquiry unchanged.</p>{error && <p role="alert" className="text-red-700 mt-3">{error} <button onClick={load} className="underline">Retry</button></p>}<div className="divide-y mt-4">{rows.map(r => <article key={r.id} className="py-4 space-y-2"><h3 className="font-bold">{r.title} {!r.is_read && <span className="text-xs text-blue-700">Unread</span>}</h3><p className="text-sm">{r.message}</p><p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</p><div className="flex flex-wrap gap-4 text-sm"><Link className="text-emerald-700 underline" to={(r.related_entity_id ? `/admin/contact-messages?message=${encodeURIComponent(r.related_entity_id)}` : r.id.startsWith('contact:') ? `/admin/contact-messages?message=${encodeURIComponent(r.id.slice(8))}` : '/admin/contact-messages')}>View Message</Link>{!r.is_read && <button disabled={busy} className="text-blue-700 underline" onClick={() => mark(r.id)}>Mark notification as read</button>}</div></article>)}</div>{!rows.length && !error && <p className="mt-4 text-slate-500">No enquiry alerts.</p>}<div className="flex gap-4 mt-4 text-sm"><button disabled={!page} onClick={() => setPage(p=>p-1)}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*10>=count} onClick={() => setPage(p=>p+1)}>Next</button></div></section>;
}

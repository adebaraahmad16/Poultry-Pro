import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CONTACT_SUBJECTS, contactQuery, updateContact } from '../../services/contactService';
import { useContacts } from '../context/ContactContext';
import { adminRequestMessage, isAdminAccessError } from '../../services/adminAccess';
import AdminDialog from '../components/AdminDialog';
const control = 'border border-slate-300 rounded-lg p-3 bg-white text-sm min-w-0';
const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50';
const label = s => ({ new: 'New', in_progress: 'In Progress', resolved: 'Resolved' }[s]);
export default function ContactMessages() {
  const { ready, stats, error: statsError, refresh } = useContacts();
  const pending = useRef(null);
  const blocked = useRef(false);
  const [params, setParams] = useSearchParams();
  const id = params.get('message');
  const [filters, setFilters] = useState({ search: '', subject: '', status: '', read: '', from: '', to: '' });
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const selectedId = useRef(id);
  selectedId.current = id;
  const load = useCallback(async () => {
    if (!ready) return;
    const key = JSON.stringify([filters,page]);
    if (pending.current?.key === key) return pending.current.promise;
    const seq = ++sequence.current;
    const request = (async () => {
    try {
      await contactQuery(async db => {
        let q = db.from('contact_messages').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * 25, page * 25 + 24);
        if (filters.subject) q = q.eq('subject', filters.subject);
        if (filters.status) q = q.eq('status', filters.status);
        if (filters.read) q = q.eq('is_read', filters.read === 'read');
        if (filters.from) q = q.gte('created_at', new Date(filters.from + 'T00:00:00').toISOString());
        if (filters.to) { const end = new Date(filters.to + 'T00:00:00'); end.setDate(end.getDate() + 1); q = q.lt('created_at', end.toISOString()); }
        const search = filters.search.replace(/[^\p{L}\p{N}@ ._+-]/gu, '').trim();
        if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
        const result = await q;
        if (!result.error && seq === sequence.current) { blocked.current = false; setRows(result.data); setCount(result.count); setError(''); }
        return result;
      });
    } catch (error) { if (seq === sequence.current) { blocked.current = isAdminAccessError(error); setError(adminRequestMessage(error)); } }
    finally { if (seq === sequence.current) setLoading(false); }
    })().finally(() => { if (pending.current?.promise === request) pending.current = null; });
    pending.current = { key, promise: request };
    return request;
  }, [ready, filters, page]);
  useEffect(() => {
    blocked.current = false;
    if (!ready) { setRows([]); setCount(0); return; }
    setLoading(true);
    const timer = setTimeout(load, 250);
    const automatic = () => { if (!blocked.current && document.visibilityState !== 'hidden') load(); };
    const poll = setInterval(automatic, 15000);
    window.addEventListener('focus', automatic);
    return () => { clearTimeout(timer); clearInterval(poll); sequence.current++; window.removeEventListener('focus', automatic); };
  }, [load]);
  useEffect(() => {
    let active = true;
    setSelected(null);
    if (id && ready) contactQuery(db => db.from('contact_messages').select('*').eq('id', id).single()).then(data => { if (active) setSelected(data); }).catch(error => { if (active) setError(adminRequestMessage(error)); });
    return () => { active = false; };
  }, [id, ready]);
  const mutate = async patch => {
    setBusy(true); setError('');
    try {
      const updated = await updateContact(selected.id, patch);
      if (selectedId.current === updated.id) setSelected(updated);
      // updateContact already refreshes the shared badge through its change event.
      await load();
    }
    catch { setError('The update failed. Please retry.'); }
    finally { setBusy(false); }
  };
  const filter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(0); };
  const badges = r => <div className="flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-2 py-1 ${r.is_read ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800 font-bold'}`}>{r.is_read ? 'Read' : 'Unread'}</span><span className="rounded-full px-2 py-1 bg-emerald-50 text-emerald-800">{label(r.status)}</span></div>;
  return <div className="space-y-6 pb-10"><div><h1 className="text-2xl font-bold">Contact Messages</h1><p className="mt-2 text-slate-600">Manage customer enquiries, technical support requests, and feedback submitted through PoultryPro.</p></div>
    {(error || statsError) && <div role="alert" className="bg-red-50 text-red-800 p-4 rounded-xl">{error || statsError} <button className="underline" onClick={() => { load(); refresh(); }}>Retry</button></div>}
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 xl:grid-cols-4 gap-4">{[['Total Messages',stats?.total],['Unread Messages',stats?.unread],['In Progress',stats?.inProgress],['Resolved Messages',stats?.resolved]].map(([title,value]) => <div className="bg-white border rounded-xl p-5" key={title}><p className="text-sm text-slate-600">{title}</p><p className="mt-2 text-3xl font-bold text-emerald-800">{value ?? '—'}</p></div>)}</div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3"><input aria-label="Search messages" className={control} placeholder="Search name, email or message" value={filters.search} onChange={e => filter('search',e.target.value)} /><select aria-label="Filter subject" className={control} value={filters.subject} onChange={e => filter('subject',e.target.value)}><option value="">All subjects</option>{CONTACT_SUBJECTS.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Filter resolution status" className={control} value={filters.status} onChange={e => filter('status',e.target.value)}><option value="">All resolution statuses</option>{['new','in_progress','resolved'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select><select aria-label="Filter read status" className={control} value={filters.read} onChange={e => filter('read',e.target.value)}><option value="">Read and unread</option><option value="unread">Unread</option><option value="read">Read</option></select>{['from','to'].map(k => <label key={k} className="text-sm">{k === 'from' ? 'From date' : 'To date'}<input className={`${control} w-full`} type="date" value={filters[k]} onChange={e => filter(k,e.target.value)} /></label>)}</div>
    {loading ? <p role="status">Loading messages…</p> : <>
      <div className="hidden xl:block overflow-x-auto bg-white border rounded-xl"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr>{['Sender','Email','Subject','Submitted','Read / Resolution','Actions'].map(h => <th className="p-4" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr className="border-t" key={r.id}><td className="p-4 break-words">{r.full_name}</td><td className="p-4 break-all">{r.email}</td><td className="p-4">{r.subject}</td><td className="p-4">{new Date(r.created_at).toLocaleString()}</td><td className="p-4">{badges(r)}</td><td className="p-4"><button className={button} onClick={() => setParams({ message:r.id })}>View Message</button></td></tr>)}</tbody></table></div>
      <div className="xl:hidden space-y-3">{rows.map(r => <article key={r.id} className="bg-white border rounded-xl p-4 space-y-3"><h2 className="font-bold break-words">{r.full_name}</h2><p className="break-words text-sm text-slate-600">{r.email}</p><p>{r.subject}</p><p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</p>{badges(r)}<button className={button} onClick={() => setParams({message:r.id})}>View Message</button></article>)}</div>
      {!rows.length && <p className="p-4 sm:p-6 text-center text-slate-500">No messages found.</p>}
    </>}
    <div className="flex flex-wrap items-center gap-4"><button className={button} disabled={!page} onClick={() => setPage(p => p-1)}>Previous</button><span className="text-sm">Page {page+1} · {count} messages</span><button className={button} disabled={(page+1)*25 >= count} onClick={() => setPage(p => p+1)}>Next</button></div>
    {selected && <AdminDialog onClose={() => setParams({})} title="Contact Message"><div className="w-full max-w-2xl rounded-2xl border bg-white p-4 sm:p-6"><h2 className="mb-4 text-lg font-bold">Contact Message</h2><div className="space-y-4 break-words">{selected && <><h2 className="font-bold text-xl">{selected.subject}</h2><dl className="space-y-2 text-sm"><div><dt className="font-semibold">Full Name</dt><dd>{selected.full_name}</dd></div><div><dt className="font-semibold">Email</dt><dd className="break-all">{selected.email}</dd></div><div><dt className="font-semibold">Phone</dt><dd>{selected.phone || 'Not provided'}</dd></div><div><dt className="font-semibold">Submitted</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd></div></dl>{badges(selected)}<p className="whitespace-pre-wrap p-4 bg-slate-50 rounded-xl">{selected.message}</p><div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => mutate({is_read: !selected.is_read})}>{selected.is_read ? 'Mark as Unread' : 'Mark as Read'}</button><button className={button} disabled={busy || selected.status === 'in_progress'} onClick={() => mutate({status:'in_progress'})}>Mark In Progress</button><button className={button} disabled={busy || selected.status === 'resolved'} onClick={() => mutate({status:'resolved'})}>Mark Resolved</button><a className={button} href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}>Reply by Email</a></div><p className="text-xs text-slate-500">Reply by Email opens your email application.</p>{error && <p role="alert" className="text-red-700">{error}</p>}</>}</div></div></AdminDialog>}
  </div>;
}

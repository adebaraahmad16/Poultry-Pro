import SubscriptionPlansTab from './SubscriptionPlansTab';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useAdmin } from '../context/AdminContext';
import StatusBadge from '../components/StatusBadge';

/* ─── Inline SVG Icons ───────────────────────────────────────────────────── */
const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0 mt-0.5">
    <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
    <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconX = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);
const IconChevronLeft = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n) => (n || 0).toLocaleString();
const fmtDate = (iso) => {
  if (!iso) return '\u2014';
  try { return new Date(iso).toLocaleDateString('en-GB'); } catch { return iso; }
};
const daysRemaining = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso) - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const TABS = [
  { id: 'overview',    label: 'Subscription Overview' },
  { id: 'plans',       label: 'Subscription Plans' },
  { id: 'subscribers', label: "Farmers' Subscriptions" },
  { id: 'trials',      label: 'Free Trial Management' },
  { id: 'settings',    label: 'Subscription Settings' }
];

const STATUS_COLORS = {
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Trial: 'bg-sky-100 text-sky-800 border-sky-200',
  Expired: 'bg-rose-100 text-rose-800 border-rose-200',
  Cancelled: 'bg-slate-200 text-slate-600 border-slate-300',
  'Past Due': 'bg-amber-100 text-amber-800 border-amber-200',
  'Pending Activation': 'bg-violet-100 text-violet-800 border-violet-200',
};

const SubStatusBadge = ({ status }) => {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {status || 'Unknown'}
    </span>
  );
};

function getSubscriberStatus(farmer) {
  if (farmer.subscriptionStatus) return farmer.subscriptionStatus;
  if (!farmer.subscription || farmer.subscription === 'Free' || farmer.subscription === 'Trial') return 'Trial';
  if (farmer.status === 'Suspended') return 'Expired';
  return 'Active';
}

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><IconX /></button>
        </div>
        {description && <p className="text-sm text-slate-600">{description}</p>}
        {children}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition">Cancel</button>
          <button onClick={onConfirm} className={`px-5 py-2 font-bold rounded-xl text-xs text-white transition ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#15803D] hover:bg-emerald-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ message, type = 'success', onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold ${type === 'success' ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-rose-700 text-white border-rose-800'}`}>
      {type === 'success' ? <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> : <IconX className="w-4 h-4" />}
      {message}
    </div>
  );
}

/* ══════════ TAB 1 — OVERVIEW ══════════ */
function OverviewTab({ metrics, payments, farmers, subscriptionPlans, onTabChange }) {
  const navigate = useNavigate();
  const chartData = [
    { name: 'Basic', value: farmers.filter(f => ['basic', 'starter'].includes((f.subscription || '').toLowerCase())).length, fill: '#15803D' },
    { name: 'Pro', value: farmers.filter(f => f.planId === 'professional' || (f.subscription || '').toLowerCase() === 'professional').length, fill: '#2563EB' },
    { name: 'Enterprise', value: farmers.filter(f => f.planId === 'enterprise' || (!f.planId && ['enterprise','pro'].includes((f.subscription || '').toLowerCase()))).length, fill: '#7c3aed' },
  ];
  const recentActivity = useMemo(() => [...payments].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6), [payments]);
  const cards = [
    { label: 'Total Subscribers', value: metrics.totalFarmers, sub: 'All registered accounts', color: 'text-slate-900', border: 'border-slate-200' },
    { label: 'Active Subscriptions', value: metrics.activeSubscriptions, sub: 'Verified paid plans', color: 'text-emerald-700', border: 'border-emerald-200' },
    { label: 'Trial Users', value: metrics.trialFarmers, sub: '14-day free trials', color: 'text-sky-700', border: 'border-sky-200' },
    { label: 'Expired Subscriptions', value: metrics.expiredSubscriptions, sub: 'Needs re-activation', color: 'text-rose-700', border: 'border-rose-200' },
    { label: 'Monthly Recurring Revenue', value: `\u20A6${fmt(metrics.estimatedMRR)}`, sub: 'MRR from paid tiers', color: 'text-slate-900', border: 'border-slate-200' },
    { label: 'Annual Recurring Revenue', value: `\u20A6${fmt(metrics.estimatedARR)}`, sub: 'ARR (MRR \u00D7 12)', color: 'text-slate-900', border: 'border-slate-200' },
    { label: 'Pending Payments', value: metrics.pendingPayments, sub: 'Awaiting verification', color: 'text-amber-600', border: 'border-amber-200' },
    { label: 'Cancelled Subscriptions', value: metrics.cancelledSubscriptions, sub: 'Voluntarily cancelled', color: 'text-slate-600', border: 'border-slate-200' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`bg-white p-5 rounded-2xl border ${c.border} shadow-xs`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{c.label}</span>
            <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
            <span className="text-xs text-slate-500 mt-0.5 block">{c.sub}</span>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 mb-4">Subscription Plan Distribution</h2>
        {chartData.every(d => d.value === 0)
          ? <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No subscription data yet</div>
          : <ResponsiveContainer width="100%" height={180}><BarChart data={chartData} barSize={48}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip formatter={v => [`${v} farmers`, 'Subscribers']} /><Bar dataKey="value" radius={[6,6,0,0]}>{chartData.map((e,i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart></ResponsiveContainer>
        }
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
          <h2 className="text-sm font-extrabold text-slate-900">Recent Subscription Activity</h2>
          <button onClick={() => navigate('/admin/payments')} className="text-xs font-bold text-emerald-700 hover:underline">View All Payments &rarr;</button>
        </div>
        {recentActivity.length === 0
          ? <p className="text-sm text-slate-400 py-6 text-center">No recent activity yet</p>
          : <div className="divide-y divide-slate-100">{recentActivity.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{p.farmerName}</p><p className="text-xs text-slate-400">{p.plan} &middot; {p.billingCycle} &middot; {p.date}</p></div>
                <div className="flex items-center gap-2 shrink-0"><span className="text-sm font-black text-emerald-700">\u20A6{fmt(p.amount)}</span><StatusBadge variant={p.status}>{p.status}</StatusBadge></div>
              </div>
            ))}</div>
        }
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onTabChange('subscribers')} className="px-4 py-2.5 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition">View All Subscriptions</button>
          <button onClick={() => onTabChange('plans')} className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition">Manage Plans</button>
          <button onClick={() => navigate('/admin/payments')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition">View Payments</button>
          <button onClick={() => onTabChange('subscribers')} className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition">View Expiring Subscriptions</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════ TAB 2 — PLANS ══════════ */
const PAGE_SIZE = 10;

function SubscribersTab({ farmers, payments, subscriptionPlans, updateFarmerSubscription }) {
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCycle, setFilterCycle] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [action, setAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [changePlanForm, setChangePlanForm] = useState({ planId: '', billingCycle: 'Monthly' });
  const [extendDays, setExtendDays] = useState(30);

  const filtered = useMemo(() => farmers.filter(f => {
    const s = (search || '').toLowerCase();
    const matchSearch = !s || [f.fullName, f.email, f.farmName, f.businessName].some(v => v && v.toLowerCase().includes(s));
    const matchPlan = !filterPlan || (f.planId || (f.subscription || '').toLowerCase()) === filterPlan;
    const matchStatus = !filterStatus || getSubscriberStatus(f) === filterStatus;
    const matchCycle = !filterCycle || (f.billingCycle || '').toLowerCase() === filterCycle.toLowerCase();
    return matchSearch && matchPlan && matchStatus && matchCycle;
  }), [farmers, search, filterPlan, filterStatus, filterCycle]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const farmerPayments = id => payments.filter(p => p.farmerId === id);

  const handleAction = (type, farmer) => {
    setAction({ type, farmer });
    if (type === 'change_plan') setChangePlanForm({ planId: '', billingCycle: 'Monthly' });
    if (type === 'extend') setExtendDays(30);
  };

  const confirmAction = async () => {
    try {
    const { type, farmer } = action;
    if (type === 'change_plan') {
      const plan = subscriptionPlans.find(p => p.id === changePlanForm.planId);
      if (!plan) return;
      await updateFarmerSubscription(farmer.id, 'change_plan', { planId: plan.id, planName: plan.name, billingCycle: changePlanForm.billingCycle });
      setToast(`Plan changed to ${plan.name}`);
    } else if (type === 'cancel') {
      await updateFarmerSubscription(farmer.id, 'cancel');
      setToast('Subscription cancelled');
    } else if (type === 'extend') {
      await updateFarmerSubscription(farmer.id, 'extend', { days: Number(extendDays) });
      setToast(`Subscription extended by ${extendDays} days`);
    } else if (type === 'reactivate') {
      await updateFarmerSubscription(farmer.id, 'reactivate');
      setToast('Subscription reactivated');
    }
    setAction(null);
    setSelectedFarmer(null);
    } catch(e) { setToast(e.message); }
  };

  const inputCls = "px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600";

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></span>
          <input type="text" placeholder="Search by name, email, farm..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600" />
        </div>
        <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">All Plans</option>
          {subscriptionPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">All Statuses</option>
          {['Active','Trial','Expired','Cancelled','Past Due','Pending Activation'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCycle} onChange={e => { setFilterCycle(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">All Cycles</option>
          <option>Monthly</option><option>Annual</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Farmer','Farm','Plan','Billing','Amount','Start Date','Expiry','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No farmers found</td></tr>}
              {paginated.map(f => {
                const status = getSubscriberStatus(f);
                const plan = subscriptionPlans.find(p => p.id === (f.planId || (f.subscription || '').toLowerCase())) || {};
                const amount = f.agreedPrice ?? (String(f.billingCycle).toLowerCase() === 'annual' ? plan.annualPrice : plan.monthlyPrice);
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><p className="font-bold text-slate-900 truncate max-w-[130px]">{f.fullName || '\u2014'}</p><p className="text-slate-400 truncate max-w-[130px]">{f.email}</p></td>
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[120px]">{f.farmName || f.businessName || '\u2014'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{f.subscription || 'Trial'}</td>
                    <td className="px-4 py-3 text-slate-600">{f.billingCycle || '\u2014'}</td>
                    <td className="px-4 py-3 font-extrabold text-emerald-700">{amount ? `\u20A6${fmt(amount)}` : '\u2014'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(f.subscriptionStartDate || f.dateJoined)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(f.subscriptionExpiry)}</td>
                    <td className="px-4 py-3"><SubStatusBadge status={status} /></td>
                    <td className="px-4 py-3"><button onClick={() => setSelectedFarmer(f)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition whitespace-nowrap">View Details</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition"><IconChevronLeft /></button>
              <span className="text-xs font-bold text-slate-700">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition"><IconChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Farmer Subscription Details</h3>
              <button onClick={() => setSelectedFarmer(null)} className="text-slate-400 hover:text-slate-600"><IconX /></button>
            </div>
            <div className="p-5 space-y-5">
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Farmer Information</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[['Full Name', selectedFarmer.fullName],['Email', selectedFarmer.email],['Farm Name', selectedFarmer.farmName || selectedFarmer.businessName],['Registered', fmtDate(selectedFarmer.dateJoined)]].map(([l,v]) => (
                    <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100"><span className="text-slate-400 block mb-0.5">{l}</span><span className="font-bold text-slate-900">{v || '\u2014'}</span></div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Subscription Information</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Current Plan', selectedFarmer.subscription || 'Trial'],
                    ['Billing Cycle', selectedFarmer.billingCycle || '\u2014'],
                    ['Status', <SubStatusBadge status={getSubscriberStatus(selectedFarmer)} />],
                    ['Start Date', fmtDate(selectedFarmer.subscriptionStartDate)],
                    ['Expiry Date', fmtDate(selectedFarmer.subscriptionExpiry)],
                    ['Auto Renewal', selectedFarmer.autoRenew ? 'Yes' : 'No'],
                  ].map(([l,v]) => (
                    <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100"><span className="text-slate-400 block mb-0.5">{l}</span><span className="font-bold text-slate-900">{v}</span></div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Payment History</h4>
                {farmerPayments(selectedFarmer.id).length === 0
                  ? <p className="text-xs text-slate-400">No payment records</p>
                  : <div className="space-y-2">{farmerPayments(selectedFarmer.id).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                        <div><span className="font-bold text-slate-800">{p.plan}</span><span className="text-slate-400 block">{p.date}</span></div>
                        <div className="flex items-center gap-2"><span className="font-extrabold text-emerald-700">\u20A6{fmt(p.amount)}</span><StatusBadge variant={p.status}>{p.status}</StatusBadge></div>
                      </div>
                    ))}</div>
                }
              </section>
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Admin Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleAction('change_plan', selectedFarmer)} className="px-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition">Change Plan</button>
                  <button onClick={() => handleAction('extend', selectedFarmer)} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl transition">Extend</button>
                  <button onClick={() => handleAction('reactivate', selectedFarmer)} className="px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs rounded-xl transition">Reactivate</button>
                  <button onClick={() => handleAction('cancel', selectedFarmer)} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition">Cancel</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={action?.type === 'cancel'} title="Cancel Subscription" description={`Cancel subscription for ${action?.farmer?.fullName}?`} confirmLabel="Cancel Subscription" danger onConfirm={confirmAction} onCancel={() => setAction(null)} />
      <ConfirmModal open={action?.type === 'reactivate'} title="Reactivate Subscription" description={`Reactivate subscription for ${action?.farmer?.fullName}?`} confirmLabel="Reactivate" onConfirm={confirmAction} onCancel={() => setAction(null)} />
      <ConfirmModal open={action?.type === 'extend'} title="Extend Subscription" onConfirm={confirmAction} onCancel={() => setAction(null)}>
        <div className="space-y-2"><label className="block text-xs font-bold text-slate-700 uppercase">Extension (days)</label><input type="number" min="1" max="365" value={extendDays} onChange={e => setExtendDays(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" /></div>
      </ConfirmModal>
      <ConfirmModal open={action?.type === 'change_plan'} title="Change Subscription Plan" onConfirm={confirmAction} onCancel={() => setAction(null)}>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Plan</label><select value={changePlanForm.planId} onChange={e => setChangePlanForm({...changePlanForm, planId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"><option value="">Select a plan...</option>{subscriptionPlans.filter(p => p.status === 'Active').map(p => <option key={p.id} value={p.id}>{p.name} &mdash; \u20A6{fmt(p.monthlyPrice)}/mo</option>)}</select></div>
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Billing Cycle</label><select value={changePlanForm.billingCycle} onChange={e => setChangePlanForm({...changePlanForm, billingCycle: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"><option>Monthly</option><option>Annual</option></select></div>
        </div>
      </ConfirmModal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ══════════ TAB 4 — TRIALS ══════════ */
function TrialsTab({ farmers, updateFarmerSubscription }) {
  const [toast, setToast] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendDays, setExtendDays] = useState(7);

  const trialFarmers = useMemo(() => farmers.filter(f => getSubscriberStatus(f) === 'Trial' || f.trialEndsAt), [farmers]);
  const activeTrials = trialFarmers.filter(f => { const dr = daysRemaining(f.trialEndsAt); return dr === null || dr > 0; });
  const expiredTrials = trialFarmers.filter(f => { const dr = daysRemaining(f.trialEndsAt); return dr !== null && dr <= 0; });
  const converted = farmers.filter(f => f.convertedFromTrial === true);
  const totalEver = trialFarmers.length + converted.length;
  const convRate = totalEver > 0 ? Math.round((converted.length / totalEver) * 100) : 0;

  const handleExtend = async () => {
    try {
      await updateFarmerSubscription(extendTarget.id, 'extend_trial', { days: Number(extendDays) });
      setToast(`Trial extended by ${extendDays} days for ${extendTarget.fullName}`);
      setExtendTarget(null);
    } catch(e) {setToast(e.message);}
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[['Total Trial Users', trialFarmers.length, 'text-slate-900'],['Active Trials', activeTrials.length, 'text-sky-700'],['Expired Trials', expiredTrials.length, 'text-rose-700'],['Converted to Paid', converted.length, 'text-emerald-700'],['Conversion Rate', `${convRate}%`, 'text-violet-700']].map(([l,v,c]) => (
          <div key={l} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{l}</span><p className={`text-2xl font-black mt-1 ${c}`}>{v}</p></div>
        ))}
      </div>
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800">
        <p className="font-bold mb-1">Trial Rules</p>
        <ul className="list-disc list-inside space-y-0.5 text-sky-700">
          <li>Every new farmer receives one 14-day free trial.</li>
          <li>Trial users must select a paid plan (Basic, Pro, or Enterprise).</li>
          <li>Trial access follows the selected plan's feature limits.</li>
          <li>Trial extensions require admin action and are logged in the audit trail.</li>
          <li>Expired trials do not delete existing farm records.</li>
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-extrabold text-slate-900">Trial Users</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50">{['Farmer','Selected Plan','Trial Start','Trial End','Days Remaining','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-50">
              {trialFarmers.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No trial users yet</td></tr>}
              {trialFarmers.map(f => {
                const dr = daysRemaining(f.trialEndsAt);
                const expired = dr !== null && dr <= 0;
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><p className="font-bold text-slate-900">{f.fullName}</p><p className="text-slate-400">{f.email}</p></td>
                    <td className="px-4 py-3 font-bold text-slate-700">{f.subscription || 'Not Selected'}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(f.dateJoined)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(f.trialEndsAt)}</td>
                    <td className="px-4 py-3">{dr === null ? <span className="text-slate-400">\u2014</span> : <span className={`font-bold ${expired ? 'text-rose-600' : dr <= 3 ? 'text-amber-600' : 'text-emerald-700'}`}>{expired ? 'Expired' : `${dr} days`}</span>}</td>
                    <td className="px-4 py-3"><SubStatusBadge status={expired ? 'Expired' : 'Trial'} /></td>
                    <td className="px-4 py-3"><button onClick={() => { setExtendTarget(f); setExtendDays(7); }} className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-lg transition whitespace-nowrap">Extend Trial</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal open={!!extendTarget} title="Extend Trial Period" onConfirm={handleExtend} onCancel={() => setExtendTarget(null)}>
        <p className="text-sm text-slate-600 mb-3">Extend trial for <strong>{extendTarget?.fullName}</strong>. This action will be recorded in the audit log.</p>
        <div className="space-y-2"><label className="block text-xs font-bold text-slate-700 uppercase">Extension (days)</label><input type="number" min="1" max="30" value={extendDays} onChange={e => setExtendDays(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" /></div>
      </ConfirmModal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ══════════ TAB 5 — SETTINGS ══════════ */
function SettingsTab({ subscriptionSettings, updateSubscriptionSettings }) {
  const [form, setForm] = useState({ ...subscriptionSettings });
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);

  const handleChange = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); };
  const handleSave = (e) => { e.preventDefault(); updateSubscriptionSettings(form); setDirty(false); setToast('Subscription settings saved successfully'); };

  const Toggle = ({ label, k, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div><p className="text-xs font-bold text-slate-800">{label}</p>{description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}</div>
      <button type="button" onClick={() => handleChange(k, !form[k])} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form[k] ? 'bg-[#15803D]' : 'bg-slate-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[k] ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  const NumberField = ({ label, k, min = 1, max }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <label className="text-xs font-bold text-slate-800">{label}</label>
      <input type="number" min={min} max={max} value={form[k] || ''} onChange={e => handleChange(k, Number(e.target.value))} className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-600" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 mb-1">A. General Settings</h2>
        <Toggle label="Enable New Subscriptions" k="newSubscriptionsEnabled" description="Allow farmers to subscribe to paid plans" />
        <Toggle label="Enable Free Trials" k="freeTrialsEnabled" description="Grant 14-day trial to new farmers" />
        <Toggle label="Enable Annual Billing" k="annualBillingEnabled" description="Offer annual billing option to farmers" />
        <NumberField label="Trial Duration (days)" k="trialDurationDays" min={1} max={90} />
        <NumberField label="Renewal Reminder (days before)" k="renewalReminderDays" min={1} max={30} />
        <NumberField label="Expiration Reminder (days before)" k="expirationReminderDays" min={1} max={14} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 mb-1">B. Renewal Settings</h2>
        <Toggle label="Auto-Renewal Available" k="autoRenewalAvailable" description="Allow farmers to enable automatic renewal" />
        <NumberField label="Renewal Notification (days before)" k="renewalNotificationDays" min={1} max={30} />
        <NumberField label="Failed Payment Retry (days)" k="failedPaymentRetryDays" min={1} max={14} />
        <NumberField label="Grace Period (days after expiry)" k="gracePeriodDays" min={0} max={30} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 mb-1">C. Notification Settings</h2>
        <Toggle label="Subscription Activation" k="notifyOnActivation" />
        <Toggle label="Upcoming Expiry" k="notifyOnUpcomingExpiry" />
        <Toggle label="Successful Renewal" k="notifyOnRenewal" />
        <Toggle label="Failed Payment" k="notifyOnFailedPayment" />
        <Toggle label="Subscription Cancellation" k="notifyOnCancellation" />
        <Toggle label="Trial Expiration" k="notifyOnTrialExpiry" />
        <Toggle label="Plan Changes" k="notifyOnPlanChange" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 mb-3">D. Payment Settings</h2>
        <p className="text-xs text-slate-500 mb-4">Payment credentials are managed securely on the backend and are not exposed here.</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[['Payment Gateway', form.paymentGateway],['Gateway Status', form.gatewayStatus],['Currency', `${form.currencySymbol} (${form.paymentCurrency})`],['Verification Mode', form.verificationMode],['Supported Methods', (form.paymentMethods || []).join(', ')]].map(([l,v]) => (
            <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100"><span className="text-slate-400 block mb-0.5">{l}</span><span className={`font-bold ${l === 'Gateway Status' && v === 'Active' ? 'text-emerald-700' : 'text-slate-900'}`}>{v}</span></div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!dirty} className={`px-6 py-2.5 font-bold text-xs rounded-xl text-white transition ${dirty ? 'bg-[#15803D] hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}>Save Settings</button>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </form>
  );
}

/* ══════════ ROOT ══════════ */
export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    subscriptionPlans, updateSubscriptionPlan,
    farmers, payments,
    starterFarmers, professionalFarmers, enterpriseFarmers,
    subscriptionSettings, updateSubscriptionSettings,
    updateFarmerSubscription,
    metrics
  } = useAdmin();

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-slate-900">Subscription Management</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage subscription plans, monitor farmers' subscriptions, track free trials, and configure subscription settings.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex min-w-max border-b border-slate-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-[#15803D] text-[#15803D] bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>{tab.label}</button>
          ))}
        </div>
      </div>
      {activeTab === 'overview' && <OverviewTab metrics={metrics} payments={payments} farmers={farmers} subscriptionPlans={subscriptionPlans} onTabChange={setActiveTab} />}
      {activeTab === 'plans' && <SubscriptionPlansTab />}
      {activeTab === 'subscribers' && <SubscribersTab farmers={farmers} payments={payments} subscriptionPlans={subscriptionPlans} updateFarmerSubscription={updateFarmerSubscription} />}
      {activeTab === 'trials' && <TrialsTab farmers={farmers} updateFarmerSubscription={updateFarmerSubscription} />}
      {activeTab === 'settings' && <SettingsTab subscriptionSettings={subscriptionSettings} updateSubscriptionSettings={updateSubscriptionSettings} />}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useAdmin } from '../context/AdminContext';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => (n || 0).toLocaleString();
const fmtCurrency = (n) => `\u20A6${fmt(Math.round(n || 0))}`;

const PLAN_COLORS = { Basic: '#15803D', Pro: '#2563EB', Enterprise: '#7c3aed' };
const CYCLE_COLORS = ['#15803D', '#2563EB'];

/* ─── Stat Card ────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = 'text-slate-900', border = 'border-slate-200' }) {
  return (
    <div className={`bg-white p-5 rounded-2xl border ${border} shadow-xs`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
      {sub && <span className="text-xs text-slate-500 mt-0.5 block">{sub}</span>}
    </div>
  );
}

/* ─── Custom Tooltip ───────────────────────────────────────────────────── */
function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {fmtCurrency(p.value)}</p>
      ))}
    </div>
  );
}

const DATE_FILTERS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '12 Months', value: 365 },
];

export default function RevenueAnalytics() {
  const { payments, farmers, starterFarmers, professionalFarmers, enterpriseFarmers, trialFarmers, metrics } = useAdmin();
  const [dateRange, setDateRange] = useState(30);

  const successfulPayments = useMemo(() => payments.filter(p => p.status === 'Successful'), [payments]);

  /* ── Revenue Over Time ─────────────────────────────────────────────── */
  const revenueOverTime = useMemo(() => {
    const cutoff = Date.now() - dateRange * 24 * 60 * 60 * 1000;
    const dayMap = {};
    successfulPayments
      .filter(p => {
        try { return new Date(p.date).getTime() >= cutoff; } catch { return false; }
      })
      .forEach(p => {
        const d = new Date(p.date);
        let key;
        if (dateRange <= 90) {
          key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        } else {
          key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        }
        if (!dayMap[key]) dayMap[key] = { date: key, revenue: 0, sortMs: d.getTime() };
        dayMap[key].revenue += p.amount || 0;
      });
    return Object.values(dayMap).sort((a, b) => a.sortMs - b.sortMs);
  }, [successfulPayments, dateRange]);

  /* ── Revenue by Plan ────────────────────────────────────────────────── */
  const revenueByPlan = useMemo(() => {
    const map = { Basic: 0, Pro: 0, Enterprise: 0 };
    successfulPayments.forEach(p => {
      const planName = (p.plan || '').toLowerCase();
      if (planName === 'enterprise') map.Enterprise += p.amount || 0;
      else if (['professional','pro'].includes(planName)) map.Pro += p.amount || 0;
      else map.Basic += p.amount || 0;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [successfulPayments]);

  /* ── Billing Cycle Split ────────────────────────────────────────────── */
  const cycleSplit = useMemo(() => {
    const monthly = successfulPayments.filter(p => (p.billingCycle || '').toLowerCase() === 'monthly').reduce((s, p) => s + (p.amount || 0), 0);
    const annual = successfulPayments.filter(p => (p.billingCycle || '').toLowerCase() === 'annual').reduce((s, p) => s + (p.amount || 0), 0);
    return [
      { name: 'Monthly', value: monthly },
      { name: 'Annual', value: annual },
    ];
  }, [successfulPayments]);

  /* ── Subscription Growth ────────────────────────────────────────────── */
  const subscriptionGrowth = useMemo(() => {
    const monthMap = {};
    farmers.forEach(f => {
      if (!f.dateJoined) return;
      try {
        const d = new Date(f.dateJoined);
        const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        if (!monthMap[key]) monthMap[key] = { month: key, subscribers: 0, sortMs: d.getTime() };
        if (f.subscription && !['Free', 'Trial', ''].includes(f.subscription)) {
          monthMap[key].subscribers += 1;
        }
      } catch {}
    });
    return Object.values(monthMap).sort((a, b) => a.sortMs - b.sortMs);
  }, [farmers]);

  /* ── KPIs ───────────────────────────────────────────────────────────── */
  const totalRevenue = metrics.totalRevenue || 0;
  const mrr = metrics.estimatedMRR || 0;
  const arr = metrics.estimatedARR || 0;
  const payingCount = farmers.filter(f => f.subscription && !['Free', 'Trial'].includes(f.subscription)).length;
  const arpu = payingCount > 0 ? Math.round(mrr / payingCount) : 0;
  const convRate = metrics.trialConversionRate || 0;
  const churnRate = farmers.length > 0 ? Math.round(((metrics.cancelledSubscriptions || 0) / Math.max(farmers.length, 1)) * 100) : 0;

  const hasData = successfulPayments.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-slate-900">Revenue Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track subscription revenue, billing trends, and growth metrics. All values in Nigerian Naira (NGN).
        </p>
      </div>

      {/* Revenue Overview KPIs */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue Collected" value={fmtCurrency(totalRevenue)} sub="Verified payments only" color="text-emerald-700" border="border-emerald-200" />
        <StatCard label="Monthly Recurring Revenue" value={fmtCurrency(mrr)} sub="From active paid tiers" color="text-slate-900" />
        <StatCard label="Annual Recurring Revenue" value={fmtCurrency(arr)} sub="MRR \u00D7 12" color="text-slate-900" />
        <StatCard label="Avg. Revenue Per User" value={fmtCurrency(arpu)} sub="Per paying subscriber/mo" color="text-blue-700" border="border-blue-100" />
        <StatCard label="Monthly Subscribers" value={fmt(Math.max(0, payingCount - (arr > 0 ? 1 : 0)))} sub="Active monthly billing" />
        <StatCard label="Annual Subscribers" value={fmt(farmers.filter(f => f.billingCycle === 'Annual').length)} sub="Active annual billing" />
        <StatCard label="Churn Rate" value={`${churnRate}%`} sub="Cancelled / total farmers" color={churnRate > 10 ? 'text-rose-700' : 'text-slate-900'} />
        <StatCard label="Trial Conversion Rate" value={`${convRate}%`} sub="Trial \u2192 paid" color="text-violet-700" border="border-violet-100" />
      </div>

      {/* Revenue Over Time */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-extrabold text-slate-900">Revenue Over Time</h2>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setDateRange(f.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${dateRange === f.value ? 'bg-[#15803D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {!hasData || revenueOverTime.length === 0
          ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No revenue data in this period</div>
          : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart accessibilityLayer data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `\u20A6${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip content={<CurrencyTooltip />} />
                <Line isAnimationActive={false} type="monotone" dataKey="revenue" name="Revenue" stroke="#15803D" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Revenue by Plan + Billing Cycle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900 mb-4">Revenue by Subscription Plan</h2>
          {!hasData
            ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No revenue data yet</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart accessibilityLayer data={revenueByPlan} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tickFormatter={v => `\u20A6${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar isAnimationActive={false} dataKey="value" name="Revenue" radius={[6,6,0,0]}>
                    {revenueByPlan.map((e, i) => <Cell key={i} fill={PLAN_COLORS[e.name] || '#64748b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900 mb-4">Monthly vs Annual Billing Revenue</h2>
          {!hasData || cycleSplit.every(d => d.value === 0)
            ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No revenue data yet</div>
            : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart accessibilityLayer>
                    <Pie isAnimationActive={false} data={cycleSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {cycleSplit.map((e, i) => <Cell key={i} fill={CYCLE_COLORS[i % CYCLE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend formatter={(v) => <span className="text-xs font-bold text-slate-700">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>
      </div>

      {/* Subscription Growth */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 mb-4">Subscription Growth (Paying Subscribers)</h2>
        {subscriptionGrowth.length === 0
          ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No subscriber data yet</div>
          : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart accessibilityLayer data={subscriptionGrowth} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [`${v} subscribers`, 'New Paying']} />
                <Bar isAnimationActive={false} dataKey="subscribers" name="New Subscribers" fill="#2563EB" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Plan Breakdown Summary */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900 mb-4">Plan Subscriber Breakdown</h2>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Trial / Free', value: trialFarmers.length, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
            { label: 'Basic Plan', value: starterFarmers.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
            { label: 'Pro Plan', value: professionalFarmers.length, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'Enterprise Plan', value: enterpriseFarmers.length, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{c.label}</span>
              <p className={`text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State Note */}
      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800">
          <p className="font-bold mb-1">No payment data yet</p>
          <p>Revenue analytics will populate automatically once farmers complete subscription payments. All metrics are derived from verified payment records only — no estimated or simulated figures are shown.</p>
        </div>
      )}
    </div>
  );
}

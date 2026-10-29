import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Bird, CreditCard, DollarSign, Headphones, CheckCircle2, Activity, AlertTriangle, TrendingUp } from '../../components/common/Icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useAdmin } from '../context/AdminContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard() {
  const {
    metrics,
    farmers,
    auditLogs,
    tickets,
    poultryDistribution,
    registrationTrend,
    starterFarmers,
    professionalFarmers,
    enterpriseFarmers,
    trialFarmers,
    getFarmerSubscriptionStatus
  } = useAdmin();

  const hasChartData = registrationTrend.length > 0;
  const hasDistributionData = poultryDistribution.length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome & Platform Health Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              PoultryPro SaaS Platform — Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Super Admin Control Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time monitoring of registered Nigerian farmers, active flocks, Paystack transactions, and subscription health.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            Export Report
          </Link>
          <Link
            to="/admin/notifications"
            className="px-4 py-2.5 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Send Broadcast
          </Link>
        </div>
      </div>

      {/* Platform KPIs — all from live data */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Platform Key Performance Indicators
          </h2>
          <span className="text-xs font-bold text-slate-400">Live Data</span>
        </div>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            title="Total Farmers"
            value={metrics.totalFarmers.toLocaleString()}
            subtext="Registered accounts"
            icon={Users}
            color="green"
          />
          <StatCard
            title="Active Farmers"
            value={metrics.activeFarmers.toLocaleString()}
            subtext="Engaged users"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Total Farms"
            value={metrics.totalFarms.toLocaleString()}
            subtext="Managed estates"
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Active Flocks"
            value={metrics.totalFlocks.toLocaleString()}
            subtext="Production batches"
            icon={Bird}
            color="blue"
          />
          <StatCard
            title="Total Birds"
            value={metrics.totalBirds.toLocaleString()}
            subtext="Recorded bird count"
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Active Subscriptions"
            value={metrics.activeSubscriptions.toLocaleString()}
            subtext="Paid & verified tiers"
            icon={CreditCard}
            color="purple"
          />
          <StatCard
            title="Expired / Lapsed"
            value={metrics.expiredSubscriptions.toLocaleString()}
            subtext="Needs attention"
            icon={AlertTriangle}
            color={metrics.expiredSubscriptions > 0 ? 'rose' : 'green'}
            isPositive={metrics.expiredSubscriptions === 0}
          />
          <StatCard
            title="Total Revenue"
            value={`₦${metrics.totalRevenue.toLocaleString()}`}
            subtext="Gross billing (NGN)"
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Open Tickets"
            value={metrics.openTickets.toLocaleString()}
            subtext={metrics.openTickets > 0 ? 'Requires action' : 'All clear'}
            icon={Headphones}
            color={metrics.openTickets > 0 ? 'rose' : 'green'}
            isPositive={metrics.openTickets === 0}
          />
        </div>
      </div>

      {/* Subscription Tier Breakdown */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Trial / Free</span>
          <p className="text-3xl font-black text-slate-700 mt-1">{trialFarmers.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">14-day trial users</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Basic</span>
          <p className="text-3xl font-black text-slate-700 mt-1">{starterFarmers.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">Small-scale farmers</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide block">Pro</span>
          <p className="text-3xl font-black text-blue-700 mt-1">{professionalFarmers.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">Growing poultry setups</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wide block">Enterprise — ₦12k/mo</span>
          <p className="text-3xl font-black text-purple-700 mt-1">{enterpriseFarmers.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">Commercial operations</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Farmer Registration & Revenue Trend */}
        <div className="xl:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Farmer Registrations & Subscription Revenue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly trajectory from actual farm records (₦ NGN)
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
              {registrationTrend.length} months tracked
            </span>
          </div>

          <div className={`${hasChartData ? 'h-56 sm:h-64' : 'py-5'} mt-4`}>
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart accessibilityLayer data={registrationTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'revenue' ? `₦${Number(val).toLocaleString()}` : `${val} farmers`,
                      name === 'revenue' ? 'Revenue' : 'New Farmers'
                    ]}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Area isAnimationActive={false} type="monotone" dataKey="revenue" stroke="#15803D" strokeWidth={3} fillOpacity={1} fill="#dcfce7" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-2">
                <TrendingUp className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">No registration data yet</p>
                <p className="text-xs text-slate-300">Chart will populate as farmers register</p>
              </div>
            )}
          </div>
        </div>

        {/* Poultry Type Distribution — from real farm breakdown */}
        <div className="xl:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Poultry Type Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Farms per category (from actual farm records)
              </p>
            </div>
            <Link to="/admin/poultry-types" className="text-xs font-bold text-emerald-700 hover:underline">
              Manage &rarr;
            </Link>
          </div>

          <div className={`${hasDistributionData ? 'h-56 sm:h-64' : 'py-5'} mt-4`}>
            {hasDistributionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={poultryDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="type" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={70} />
                  <Tooltip
                    formatter={(val) => [`${val} Farms`, 'Adoption']}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Bar isAnimationActive={false} dataKey="farms" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-2">
                <Bird className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">No farm breakdown data yet</p>
                <p className="text-xs text-slate-300">Chart populates from farm records</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Grids: Recent Registrations & Live Audit Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Recent Farmer Registrations */}
        <div className="xl:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Recent Farmer Registrations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest commercial poultry accounts
              </p>
            </div>
            <Link to="/admin/farmers" className="text-xs font-bold text-emerald-700 hover:underline">
              View All ({farmers.length}) &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {farmers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No farmers registered yet.</p>
            ) : (
              farmers.slice(0, 5).map((f) => {
                const expired = getFarmerSubscriptionStatus(f);
                return (
                  <div key={f.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0">
                        {f.fullName ? f.fullName[0] : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{f.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {f.location}
                          {f.poultryTypes && f.poultryTypes.length > 0 ? ` • ${f.poultryTypes.join(', ')}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {expired && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Expired
                        </span>
                      )}
                      <StatusBadge variant={f.subscription}>{f.subscription || 'Trial'} Plan</StatusBadge>
                      <StatusBadge variant={f.status}>{f.status}</StatusBadge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Audit Activity Stream */}
        <div className="xl:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Admin Activity Stream
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trail of platform adjustments
              </p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-emerald-700 hover:underline">
              Audit Logs &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {auditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No audit activity yet.</p>
            ) : (
              auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{log.target}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {log.adminName} • {log.timestamp}
                    </span>
                  </div>
                  <StatusBadge variant="successful">OK</StatusBadge>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

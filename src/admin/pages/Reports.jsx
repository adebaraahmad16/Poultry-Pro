import ResponsiveRecords from '../components/ResponsiveRecords';
import React, { useState } from 'react';
import {
  BarChart3, Download, Printer, DollarSign, Users, Bird, CheckCircle2,
  TrendingUp, TrendingDown, ArrowUpRight
} from '../../components/common/Icons';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { useAdmin } from '../context/AdminContext';
import StatCard from '../components/StatCard';

const MONTHLY_REVENUE = [
  { month: 'May', revenue: 45000, farmers: 18, subscriptions: 12 },
  { month: 'Jun', revenue: 95000, farmers: 34, subscriptions: 22 },
  { month: 'Jul', revenue: 155000, farmers: 52, subscriptions: 38 },
  { month: 'Aug', revenue: 220000, farmers: 78, subscriptions: 59 },
  { month: 'Sep', revenue: 295000, farmers: 104, subscriptions: 82 },
  { month: 'Oct', revenue: 370000, farmers: 142, subscriptions: 121 }
];

const PLAN_DISTRIBUTION = [
  { name: 'Free', value: 1, color: '#94A3B8' },
  { name: 'Basic', value: 3, color: '#3B82F6' },
  { name: 'Pro', value: 3, color: '#7C3AED' }
];

const POULTRY_BREAKDOWN = [
  { category: 'Broilers', farms: 250, flocks: 512, birds: 145000 },
  { category: 'Layers', farms: 180, flocks: 320, birds: 98000 },
  { category: 'Cockerels', farms: 120, flocks: 195, birds: 34000 },
  { category: 'Turkeys', farms: 70, flocks: 98, birds: 16500 },
  { category: 'Ducks', farms: 35, flocks: 48, birds: 7800 },
  { category: 'Quails', farms: 20, flocks: 32, birds: 11200 }
];

const GEO_DATA = [
  { state: 'Kwara State', farms: 84, birds: 52000, share: 35 },
  { state: 'Oyo State', farms: 62, birds: 38000, share: 26 },
  { state: 'Kaduna State', farms: 45, birds: 28000, share: 19 },
  { state: 'Lagos State', farms: 32, birds: 21000, share: 14 },
  { state: 'Other States', farms: 18, birds: 11000, share: 6 }
];

const TOOLTIP_STYLE = {
  backgroundColor: '#1E293B',
  color: '#FFF',
  borderRadius: '12px',
  border: 'none',
  fontSize: '12px'
};

export default function Reports() {
  const { metrics, farmers, farms, payments, categories } = useAdmin();
  const [reportDateRange, setReportDateRange] = useState('All-Time');
  const [activeChart, setActiveChart] = useState('revenue');

  const handleExportCSV = () => {
    alert('Exporting PoultryPro platform summary report to CSV...');
  };

  const conversionRate = ((metrics.activeSubscriptions / (metrics.totalFarmers || 1)) * 100).toFixed(1);
  const paymentSuccessRate = (
    (payments.filter((p) => p.status === 'Successful').length / (payments.length || 1)) * 100
  ).toFixed(1);

  const currentRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
  const prevRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2].revenue;
  const revGrowth = (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reports & Platform Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Executive audit insights on user acquisition, commercial bird counts, payment conversions, and platform growth.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={reportDateRange}
            onChange={(e) => setReportDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All-Time">Date Range: All-Time</option>
            <option value="This Year">Calendar Year 2026</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Q3 2026">Q3 2026</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtext="Free to Paid Subscriptions"
          change="+4.2%"
          isPositive={true}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Payment Success Rate"
          value={`${paymentSuccessRate}%`}
          subtext="Paystack gateway completion"
          change="+1.5%"
          isPositive={true}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Total Recorded Birds"
          value={metrics.totalBirds.toLocaleString()}
          subtext="Live poultry population"
          change="+16.4%"
          isPositive={true}
          icon={Bird}
          color="green"
        />
        <StatCard
          title="Platform Billing Total"
          value={`₦${metrics.totalRevenue.toLocaleString()}`}
          subtext="Cleared revenue to date"
          change={`+${revGrowth}%`}
          isPositive={true}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Subscription Revenue Growth Curve
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monthly billing trajectory (₦ NGN) — May to October 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['revenue', 'farmers', 'subscriptions'].map((key) => (
              <button
                key={key}
                onClick={() => setActiveChart(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeChart === key
                    ? 'bg-[#15803D] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {key === 'revenue' ? '₦ Revenue' : key === 'farmers' ? 'Farmers' : 'Subscriptions'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72 mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart accessibilityLayer data={MONTHLY_REVENUE} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) =>
                  activeChart === 'revenue'
                    ? `₦${(v / 1000).toFixed(0)}k`
                    : v.toString()
                }
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val) =>
                  activeChart === 'revenue'
                    ? [`₦${Number(val).toLocaleString()}`, 'Revenue']
                    : [val, activeChart === 'farmers' ? 'Farmers' : 'Subscriptions']
                }
              />
              <Area
                type="monotone"
                dataKey={activeChart}
                stroke="#15803D"
                strokeWidth={3}
                fillOpacity={1}
                fill="#dcfce7"
                dot={{ fill: '#15803D', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Poultry Breakdown Bar Chart */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Poultry Species Farm Adoption</h3>
              <p className="text-xs text-slate-400 mt-0.5">Registered farm count by poultry category</p>
            </div>
          </div>
          <div className="h-56 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer data={POULTRY_BREAKDOWN} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val, name) => [val, name === 'farms' ? 'Farms' : name === 'flocks' ? 'Flocks' : 'Birds']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar isAnimationActive={false} dataKey="farms" fill="#15803D" radius={[4, 4, 0, 0]} name="Farms" />
                <Bar isAnimationActive={false} dataKey="flocks" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Flocks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Pie */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">Plan Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active farmers by subscription tier</p>
          </div>
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Pie
                  data={PLAN_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {PLAN_DISTRIBUTION.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val, name) => [val, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {PLAN_DISTRIBUTION.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-700 font-medium">{p.name} Plan</span>
                </div>
                <span className="font-extrabold text-slate-900">{p.value} farmers</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Species Distribution Table */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">
            Poultry Species & Flock Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Total active farm adoption across registered categories
          </p>
          <div className="overflow-x-auto">
            <ResponsiveRecords><table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Poultry Category</th>
                  <th className="py-2.5 px-3 text-right">Farms</th>
                  <th className="py-2.5 px-3 text-right">Flocks</th>
                  <th className="py-2.5 px-3 text-right">Total Birds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {POULTRY_BREAKDOWN.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.category}</td>
                    <td className="py-2.5 px-3 text-right">{c.farms.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{c.flocks.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-800">
                      {c.birds.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="py-2.5 px-3 font-black text-slate-900 text-xs uppercase">Total</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {POULTRY_BREAKDOWN.reduce((s, c) => s + c.farms, 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {POULTRY_BREAKDOWN.reduce((s, c) => s + c.flocks, 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-900">
                    {POULTRY_BREAKDOWN.reduce((s, c) => s + c.birds, 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table></ResponsiveRecords>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">
            Geographic Poultry Farm Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Poultry farm clustering across Nigerian states
          </p>
          <div className="space-y-3">
            {GEO_DATA.map((loc) => (
              <div key={loc.state} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2 flex-wrap gap-3">
                  <span>{loc.state}</span>
                  <span className="text-emerald-800 font-extrabold">
                    {loc.birds.toLocaleString()} birds
                    <span className="text-slate-400 font-medium ml-1.5">({loc.farms} farms)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#15803D] rounded-full transition-all duration-500"
                    style={{ width: `${loc.share}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 flex-wrap gap-3">
                  <span>{loc.share}% of platform farms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Monthly Revenue & Growth Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detailed month-by-month platform financial record</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            ₦{MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue.toLocaleString()} — Oct 2026
          </span>
        </div>
        <div className="overflow-x-auto">
          <ResponsiveRecords><table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 text-left font-bold text-slate-500 uppercase tracking-wider">Month</th>
                <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider">Revenue (₦)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider">New Farmers</th>
                <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</th>
                <th className="py-3 px-4 text-right font-bold text-slate-500 uppercase tracking-wider">MoM Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MONTHLY_REVENUE.map((row, i) => {
                const prev = MONTHLY_REVENUE[i - 1];
                const growth = prev
                  ? (((row.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
                  : null;
                return (
                  <tr key={row.month} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.month} 2026</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-800">
                      ₦{row.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 font-semibold">{row.farmers}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-semibold">{row.subscriptions}</td>
                    <td className="py-3 px-4 text-right">
                      {growth !== null ? (
                        <span className={`flex items-center justify-end gap-1 font-bold ${
                          Number(growth) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {Number(growth) >= 0
                            ? <TrendingUp className="w-3.5 h-3.5" />
                            : <TrendingDown className="w-3.5 h-3.5" />
                          }
                          {growth}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></ResponsiveRecords>
        </div>
      </div>
    </div>
  );
}

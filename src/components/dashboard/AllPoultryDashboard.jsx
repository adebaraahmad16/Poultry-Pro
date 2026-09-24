import React from 'react';
import { Link } from 'react-router-dom';
import { Bird, DollarSign, Egg, Wheat, LayoutGrid, PlusCircle, Sparkles } from 'lucide-react';
import { usePoultryData } from '../../context/FarmContext';
import StatCard from '../common/StatCard';
import RevenueVsExpenseChart from '../charts/RevenueVsExpenseChart';
import FlockPopulationChart from '../charts/FlockPopulationChart';

/**
 * "All Poultry" dashboard — high-level overview across every poultry type
 * the farmer manages, with a per-type breakdown table.
 */
export default function AllPoultryDashboard() {
  const { farm, flocks, sales, expenses, selectedTypes, presentTypeIds, computeTypeStats, metrics } = usePoultryData();

  // Types to show in the breakdown: selected types that have flocks, plus any
  // type present in records but not yet in the profile (migration edge case)
  const breakdownIds = Array.from(new Set([...selectedTypes.map((t) => t.id), ...presentTypeIds]));

  const currencySymbol = farm?.currency || '$';
  const money = (v) => `${currencySymbol}${Number(v || 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Farm Overview Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <LayoutGrid className="w-3.5 h-3.5" />
          Farm Overview — All Poultry
        </div>
        <h2 className="text-xl font-extrabold">{farm.name || 'My Poultry Farm'}</h2>
        <p className="text-xs text-slate-300 mt-1">
          Managing {breakdownIds.length} poultry type{breakdownIds.length !== 1 ? 's' : ''} across {flocks.length} active flock{flocks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Fresh Farm Welcome Callout when no flocks exist */}
      {flocks.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base">Brand New Farm Dashboard</h3>
              <p className="text-xs text-emerald-800 mt-0.5 max-w-xl leading-relaxed">
                Everything is fresh and ready for your records. Add your first flock to start monitoring bird populations, daily egg collections, feed intake, health logs, and profitability.
              </p>
            </div>
          </div>
          <Link
            to="/farm/flocks"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 shrink-0 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            + Add Your First Flock
          </Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Birds"
          value={metrics.totalBirds.toLocaleString()}
          icon={Bird}
          subtitle={`${flocks.length} Active Flocks`}
          color="green"
        />
        <StatCard
          title="Eggs Today"
          value={metrics.totalEggsToday.toLocaleString()}
          icon={Egg}
          subtitle="Across all laying flocks"
          color="blue"
        />
        <StatCard
          title="Feed Stock"
          value={`${metrics.totalFeedKg.toLocaleString()} kg`}
          icon={Wheat}
          subtitle="Farm-wide inventory"
          color="amber"
        />
        <StatCard
          title="Net Profit"
          value={money(metrics.netProfit)}
          icon={DollarSign}
          subtitle="Revenue vs Operating Expenses"
          color="indigo"
        />
      </div>

      {/* Per-Type Breakdown Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Poultry Type Breakdown</h3>
            <p className="text-xs text-slate-500">Birds, sales and expenses for each poultry type you manage</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-2 pr-4">Poultry Type</th>
                <th className="pb-2 pr-4 text-right">Birds</th>
                <th className="pb-2 pr-4 text-right">Flocks</th>
                <th className="pb-2 pr-4 text-right">Sales</th>
                <th className="pb-2 pr-4 text-right">Expenses</th>
                <th className="pb-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {breakdownIds.map((id) => {
                const stats = computeTypeStats(id);
                const type = selectedTypes.find((t) => t.id === id);
                const label = type ? `${type.emoji} ${type.label}` : id;
                return (
                  <tr key={id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-bold text-slate-800">{label}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-slate-700">{stats.totalBirds.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{stats.activeFlocks}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{money(stats.revenue)}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{money(stats.expenses)}</td>
                    <td className={`py-3 text-right font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {money(stats.profit)}
                    </td>
                  </tr>
                );
              })}
              {breakdownIds.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    No poultry flocks recorded yet — add your first flock to see the breakdown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Revenue vs Expenses</h3>
              <p className="text-xs text-slate-500">Daily cash flow breakdown (₦)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              Financial Overview
            </span>
          </div>
          <RevenueVsExpenseChart sales={sales} expenses={expenses} />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bird Population Distribution</h3>
              <p className="text-xs text-slate-500">Live bird count across active pens</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              All Poultry
            </span>
          </div>
          <FlockPopulationChart flocks={flocks} />
        </div>
      </div>
    </div>
  );
}

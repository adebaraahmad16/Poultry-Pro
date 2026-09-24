import React from 'react';
import {
  Bird, Egg, Wheat, DollarSign, Scale, TrendingUp, Activity,
  AlertTriangle, ShieldAlert, Calendar, Plus
} from 'lucide-react';
import { usePoultryData } from '../../context/FarmContext';
import StatCard from '../common/StatCard';
import EggProductionChart from '../charts/EggProductionChart';
import RevenueVsExpenseChart from '../charts/RevenueVsExpenseChart';
import FlockPopulationChart from '../charts/FlockPopulationChart';
import WeightTrendChart from '../charts/WeightTrendChart';
import MortalityChart from '../charts/MortalityChart';

const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

/**
 * Individual poultry-type dashboard — generated dynamically from the type's
 * config and its scoped records. Metrics, charts and quick actions adapt per
 * poultry type; records never mix between types.
 */
export default function PoultryDashboard({ poultryType, onQuickAction }) {
  const { farm, scopedDataFor, computeTypeStats } = usePoultryData();

  const currencySymbol = farm?.currency || '$';
  const money = (v) => `${currencySymbol}${Number(v || 0).toLocaleString()}`;

  const scoped = scopedDataFor(poultryType.id);
  const stats = computeTypeStats(poultryType.id);
  const { traits } = poultryType;
  const hasFlocks = scoped.flocks.length > 0;

  // Quick actions relevant to this poultry type (per registry traits)
  const actions = [
    { key: 'flock', label: `Add ${poultryType.label} Flock`, color: 'bg-emerald-600 hover:bg-emerald-700' },
    ...(traits.eggs ? [{ key: 'egg', label: 'Record Eggs', color: 'bg-blue-600 hover:bg-blue-700' }] : []),
    { key: 'feed', label: 'Record Feed', color: 'bg-teal-600 hover:bg-teal-700' },
    { key: 'mortality', label: 'Record Mortality', color: 'bg-rose-600 hover:bg-rose-700' },
    ...(traits.weight ? [{ key: 'weight', label: 'Record Weight', color: 'bg-amber-600 hover:bg-amber-700' }] : []),
    { key: 'sale', label: 'Record Sale', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { key: 'expense', label: 'Add Expense', color: 'bg-slate-800 hover:bg-slate-900' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{poultryType.emoji}</span>
            {poultryType.label} Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {poultryType.description}
          </p>
        </div>

        {/* Poultry-specific quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => onQuickAction(a.key === 'feed' ? 'expense' : a.key)}
              className={`px-3.5 py-2 ${a.color} text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5`}
            >
              <Plus className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {!hasFlocks && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-emerald-950 text-base">No {poultryType.label} Flocks Added Yet</h3>
            <p className="text-xs text-emerald-800 mt-0.5 max-w-xl leading-relaxed">
              Add your first {poultryType.label.toLowerCase()} flock to unlock full tracking for mortality, feed intake, health records, and profits.
            </p>
          </div>
          <button
            onClick={() => onQuickAction('flock')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Add {poultryType.label} Flock
          </button>
        </div>
      )}

      {/* KPI Stats — adapt to what matters for this poultry type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={`Total ${poultryType.label}`}
          value={stats.totalBirds.toLocaleString()}
          icon={Bird}
          subtitle={`${stats.activeFlocks} Active Flock${stats.activeFlocks !== 1 ? 's' : ''} • Avg age ${stats.avgBirdAge.toFixed(1)} wks`}
          color="green"
        />
        {traits.eggs && (
          <StatCard
            title="Eggs Today"
            value={stats.eggsToday.toLocaleString()}
            icon={Egg}
            subtitle={`${stats.eggsWeek.toLocaleString()} this week • ${stats.eggsMonth.toLocaleString()} this month`}
            color="blue"
          />
        )}
        {traits.weight && (
          <StatCard
            title="Average Weight"
            value={stats.latestWeight !== null ? `${Number(stats.latestWeight).toFixed(2)} kg` : '—'}
            icon={Scale}
            subtitle={stats.weightGain !== null ? `+${Number(stats.weightGain).toFixed(2)} kg growth recorded` : 'Record weights to track growth'}
            color="amber"
          />
        )}
        <StatCard
          title={traits.eggs ? 'Production Rate' : 'Mortality Rate'}
          value={traits.eggs ? pct(stats.productionRate) : pct(stats.mortalityRate)}
          icon={traits.eggs ? Activity : AlertTriangle}
          subtitle={traits.eggs ? 'Eggs per bird today' : `${stats.mortalityCount} total losses recorded`}
          color="indigo"
        />
        <StatCard
          title="Feed Stock (Farm-wide)"
          value={`${stats.feedKg.toLocaleString()} kg`}
          icon={Wheat}
          subtitle="Shared feed inventory"
          color="amber"
        />
        <StatCard
          title="Sales"
          value={money(stats.revenue)}
          icon={DollarSign}
          subtitle={`Expenses: ${money(stats.expenses)}`}
          color="green"
        />
        <StatCard
          title="Estimated Profit"
          value={money(stats.profit)}
          icon={TrendingUp}
          subtitle="Revenue − Expenses (this type)"
          color={stats.profit >= 0 ? 'green' : 'indigo'}
        />
      </div>

      {/* Mortality strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md">
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase">Mortality Rate</p>
          <p className="text-xl font-extrabold text-rose-400 mt-1">{pct(stats.mortalityRate)}</p>
          <p className="text-[10px] text-slate-400">{stats.mortalityCount} birds lost</p>
        </div>
        <div className="border-l border-slate-800 pl-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Broken Eggs</p>
          <p className="text-xl font-extrabold text-amber-400 mt-1">
            {traits.eggs ? stats.brokenEggs.toLocaleString() : '—'}
          </p>
          <p className="text-[10px] text-slate-400">{traits.eggs ? 'All recorded collections' : 'Not tracked for this type'}</p>
        </div>
        <div className="border-l border-slate-800 pl-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Feed Consumption Stock</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.feedKg.toLocaleString()} kg</p>
          <p className="text-[10px] text-slate-400">Available in store</p>
        </div>
        <div className="border-l border-slate-800 pl-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Flocks</p>
          <p className="text-xl font-extrabold text-blue-400 mt-1">{stats.activeFlocks}</p>
          <p className="text-[10px] text-slate-400">{poultryType.label} pens only</p>
        </div>
      </div>

      {/* Charts — adapt per poultry type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {traits.eggs && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Egg Production Trend</h3>
                <p className="text-xs text-slate-500">Daily {poultryType.label.toLowerCase()} egg yield</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                {poultryType.label}
              </span>
            </div>
            <EggProductionChart data={scoped.eggs} />
          </div>
        )}

        {traits.weight && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Weight / Growth Trend</h3>
                <p className="text-xs text-slate-500">Average bird weight over time (kg)</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                Growth Performance
              </span>
            </div>
            <WeightTrendChart weights={scoped.weights} />
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Mortality Trend</h3>
              <p className="text-xs text-slate-500">Daily losses over the last 7 days</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
              {poultryType.label}
            </span>
          </div>
          <MortalityChart mortality={scoped.mortality} />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Revenue vs Expenses</h3>
              <p className="text-xs text-slate-500">Daily cash flow for {poultryType.label.toLowerCase()} (₦)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              Financial
            </span>
          </div>
          <RevenueVsExpenseChart sales={scoped.sales} expenses={scoped.expenses} />
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">{poultryType.label} Flock Population</h3>
              <p className="text-xs text-slate-500">Live bird count across {poultryType.label.toLowerCase()} pens</p>
            </div>
          </div>
          <FlockPopulationChart flocks={scoped.flocks} />
        </div>
      </div>

      {/* Alerts for this poultry type */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {poultryType.label} Alerts
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">Live Updates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scoped.flocks.slice(0, 4).map((f) => (
            <div key={f.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${f.healthStatus === 'Healthy' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="text-xs font-bold text-slate-800">{f.name} — {f.healthStatus || 'Healthy'}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {Number(f.currentBirds).toLocaleString()} birds • {f.pen || 'Pen'} • {f.ageWeeks || 0} weeks old
                </p>
              </div>
            </div>
          ))}
          {!hasFlocks && (
            <p className="text-xs text-slate-400 col-span-2 text-center py-4">
              No {poultryType.label.toLowerCase()} flocks yet — add your first {poultryType.label.toLowerCase()} flock to start tracking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

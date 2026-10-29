import React, { useState, useMemo } from 'react';
import ChartEmptyState from './ChartEmptyState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

/**
 * Interactive Mortality Analytics Chart
 * Supports:
 * - Daily trends (last 14 days)
 * - Weekly trends (last 8 weeks)
 * - Monthly trends (last 6 months)
 * - Mortality rate by flock
 */
export default function MortalityChart({ mortality = [], data = [], flocks = [] }) {
  const records = useMemo(() => {
    return Array.isArray(mortality) && mortality.length > 0
      ? mortality
      : Array.isArray(data)
      ? data
      : [];
  }, [mortality, data]);

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'flock'

  // 1. Daily Trends (Last 14 days)
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = records
        .filter((r) => r.date === dateStr)
        .reduce((sum, r) => sum + (Number(r.count) || 0), 0);
      days.push({
        label: dateStr.split('-').slice(1).join('/'),
        fullDate: dateStr,
        Deaths: count
      });
    }
    return days;
  }, [records]);

  // 2. Weekly Trends (Last 8 weeks)
  const weeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const count = records
        .filter((r) => r.date >= startStr && r.date <= endStr)
        .reduce((sum, r) => sum + (Number(r.count) || 0), 0);

      weeks.push({
        label: `Wk ${8 - i}`,
        Deaths: count,
        range: `${startStr.slice(5)} to ${endStr.slice(5)}`
      });
    }
    return weeks;
  }, [records]);

  // 3. Monthly Trends (Last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;

      const count = records
        .filter((r) => String(r.date || '').startsWith(prefix))
        .reduce((sum, r) => sum + (Number(r.count) || 0), 0);

      const monthName = d.toLocaleString('en-US', { month: 'short' });
      months.push({
        label: `${monthName} '${String(year).slice(2)}`,
        Deaths: count
      });
    }
    return months;
  }, [records]);

  // 4. Mortality Rate By Flock
  const flockData = useMemo(() => {
    if (!flocks || flocks.length === 0) {
      // Group by flockName from records if flocks prop is empty
      const flockMap = {};
      records.forEach((r) => {
        const name = r.flockName || 'Unknown Flock';
        flockMap[name] = (flockMap[name] || 0) + (Number(r.count) || 0);
      });
      return Object.entries(flockMap).map(([name, deaths]) => ({
        label: name.length > 14 ? `${name.slice(0, 12)}…` : name,
        fullName: name,
        Deaths: deaths,
        rate: 0
      }));
    }

    return flocks.map((flock) => {
      const deaths = records
        .filter((r) => r.flockId === flock.id || r.flockName === flock.name)
        .reduce((sum, r) => sum + (Number(r.count) || 0), 0);
      const initial = Number(flock.initialBirds || flock.currentBirds || 0);
      const totalCapacity = initial > 0 ? initial : Number(flock.currentBirds || 0) + deaths;
      const rate = totalCapacity > 0 ? Number(((deaths / totalCapacity) * 100).toFixed(1)) : 0;

      return {
        label: flock.name.length > 12 ? `${flock.name.slice(0, 10)}…` : flock.name,
        fullName: flock.name,
        Deaths: deaths,
        rate: rate,
        currentBirds: flock.currentBirds
      };
    });
  }, [records, flocks]);

  const hasAnyData = records.some((r) => Number(r.count) > 0);

  if (!hasAnyData && activeTab !== 'flock') {
    return <ChartEmptyState>No mortality losses recorded yet. Start tracking to view mortality trends.</ChartEmptyState>;
  }

  return (
    <div className="space-y-4">
      {/* Tab Switcher for Analytics View */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daily (14d)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'weekly'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Weekly (8w)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'monthly'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Monthly (6m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('flock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rate by Flock
          </button>
        </div>

        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
          {activeTab === 'flock' ? 'Mortality % per flock' : 'Recorded bird losses'}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'flock' ? (
            <BarChart
              data={flockData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                unit="%"
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(val, name, props) => [
                  `${val}% mortality (${props.payload.Deaths} dead, ${props.payload.currentBirds || 0} live)`,
                  props.payload.fullName
                ]}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="rate" name="Mortality Rate %" fill="#E11D48" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : activeTab === 'daily' ? (
            <BarChart
              data={dailyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(val) => [`${val} birds lost`, 'Deaths']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="Deaths" fill="#E11D48" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : activeTab === 'weekly' ? (
            <LineChart
              data={weeklyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(val, _, props) => [`${val} dead (${props.payload.range})`, 'Weekly Loss']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="Deaths"
                stroke="#E11D48"
                strokeWidth={3}
                dot={{ r: 4, fill: '#E11D48' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(val) => [`${val} birds lost`, 'Monthly Total']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="Deaths" fill="#E11D48" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

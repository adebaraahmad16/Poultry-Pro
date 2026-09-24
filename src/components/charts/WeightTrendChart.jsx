import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function WeightTrendChart({ weights }) {
  const chartData = [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({
      date: w.date.split('-').slice(1).join('/'),
      'Avg Weight (kg)': Number(w.averageWeightKg)
    }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
        No weight records yet — record bird weights to see growth trends.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            domain={['dataMin - 0.2', 'dataMax + 0.2']}
            tickFormatter={(v) => `${Number(v).toFixed(1)}kg`}
          />
          <Tooltip
            formatter={(val) => [`${Number(val).toFixed(2)} kg`, '']}
            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          <Line type="monotone" dataKey="Avg Weight (kg)" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

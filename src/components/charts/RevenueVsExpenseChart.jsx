import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function RevenueVsExpenseChart({ sales, expenses }) {
  // Aggregate sales & expenses by recent dates
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = dates.map((date) => {
    const rev = sales.filter((s) => s.date === date).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const exp = expenses.filter((e) => e.date === date).reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      date: date.split('-').slice(1).join('/'),
      Revenue: rev,
      Expenses: exp
    };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `₦${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
          <Tooltip
            formatter={(val) => [`₦${val.toLocaleString()}`, '']}
            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          <Bar dataKey="Revenue" fill="#16A34A" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Expenses" fill="#2563EB" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

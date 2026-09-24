import React from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Receipt, BarChart2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

export default function ProfitLoss() {
  const { sales, expenses } = useFarm();

  const totalRevenue = sales.reduce((s, x) => s + (x.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Category breakdown
  const categories = ['Feed', 'Labour', 'Medication', 'Transportation', 'Electricity', 'Equipment', 'Other'];
  const categoryBreakdown = categories.map((cat) => {
    const amount = expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0);
    const share = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
    return { category: cat, amount, share };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-emerald-600" />
          Profit & Loss Statement
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Financial performance statement: Revenue, Operating Cost, Net Profit & Margin %.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₦{totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Sales Income</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Operating Expenses</span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">₦{totalExpenses.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Costs & Outflows</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Net Profit / (Loss)</span>
          <p className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            ₦{netProfit.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">Revenue - Expenses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Profit Margin Rate</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{marginPercent}%</p>
          <span className="text-[10px] text-slate-400">Net Profit Share</span>
        </div>
      </div>

      {/* Expense Share Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Expense Category Share Breakdown</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-xs border-b border-slate-200">
            <tr>
              <th className="p-3">Expense Category</th>
              <th className="p-3">Total Amount (₦)</th>
              <th className="p-3">Percentage Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categoryBreakdown.map((c, i) => (
              <tr key={i}>
                <td className="p-3 font-bold text-slate-800">{c.category}</td>
                <td className="p-3">₦{c.amount.toLocaleString()}</td>
                <td className="p-3 font-semibold text-emerald-700">{c.share}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

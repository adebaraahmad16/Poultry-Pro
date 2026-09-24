import React, { useState } from 'react';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { expenseService } from '../../services/businessService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Expenses() {
  const { expenses, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    category: 'Feed',
    description: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    expenseService.createExpense(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      expenseService.deleteExpense(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const columns = [
    { header: 'Date', accessor: 'date' },
    {
      header: 'Category',
      render: (r) => <Badge variant={r.category === 'Feed' ? 'green' : r.category === 'Labour' ? 'blue' : 'amber'}>{r.category}</Badge>
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Amount',
      render: (r) => <span className="font-extrabold text-slate-900">₦{(r.amount || 0).toLocaleString()}</span>
    },
    { header: 'Payment Method', accessor: 'paymentMethod' },
    {
      header: 'Actions',
      render: (r) => (
        <button onClick={() => setDeletingId(r.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Farm Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track feed orders, payroll, medication, diesel, water, and repairs.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-semibold text-slate-400 uppercase">Total Expenses Incurred</span>
        <p className="text-3xl font-extrabold text-slate-900 mt-1">₦{totalExp.toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-1">Operating expenditure sum</p>
      </div>

      <DataTable columns={columns} data={expenses} searchPlaceholder="Search expenses by category or description..." emptyTitle="No expense records found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Farm Expense">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="Feed">Feed</option>
              <option value="Medication">Medication</option>
              <option value="Labour">Labour</option>
              <option value="Transportation">Transportation</option>
              <option value="Electricity">Electricity</option>
              <option value="Equipment">Equipment</option>
              <option value="Repairs">Repairs</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. 50 bags TopFeeds Layer Mash"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₦)</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl">
            Save Expense
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Expense" message="Are you sure?" />
    </div>
  );
}

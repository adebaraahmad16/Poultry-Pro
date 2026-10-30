import useSaveAction from '../../hooks/useSaveAction';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt, Plus, Trash2, Edit2, Filter, DollarSign, Calendar, TrendingDown } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { expenseService } from '../../services/businessService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import StickyRecordButton from '../../components/common/StickyRecordButton';

export default function Expenses() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { expenses, flocks, refreshAllData } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [flockFilter, setFlockFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const defaultForm = {
    category: 'Feed',
    description: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    flockId: flocks[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  const [form, setForm] = useState(defaultForm);

  // Auto-open via quick action (?action=record or ?action=expense)
  useEffect(() => {
    const action = params.get('action');
    if (action === 'record' || action === 'expense') {
      const flockParam = params.get('flockId');
      if (flockParam && flocks.some(f => f.id === flockParam)) {
        setForm(prev => ({ ...prev, flockId: flockParam }));
      }
      setEditingRecord(null);
      setIsAddOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params, flocks]);

  const resetForm = () => {
    setForm({
      category: 'Feed',
      description: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      flockId: flocks[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingRecord(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setForm({
      category: record.category || 'Feed',
      description: record.description || '',
      amount: record.amount || '',
      paymentMethod: record.paymentMethod || 'Bank Transfer',
      flockId: record.flockId || flocks[0]?.id || '',
      date: record.date || new Date().toISOString().split('T')[0],
      notes: record.notes || ''
    });
    setIsAddOpen(true);
  };

  const [handleSubmit, handleSubmitSaving] = useSaveAction(async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) < 0) {
      toast.error('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!form.description) {
      toast.error('Validation Error', 'Please enter a description for the expense.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRecord) {
        await expenseService.updateExpense(editingRecord.id, form);
        toast.success('Expense Updated!', 'Your changes have been saved successfully.');
      } else {
        await expenseService.createExpense(form);
        toast.success('Expense Recorded!', 'Your expense record has been saved successfully.');
      }
      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Unable to Save Expense', err.message || 'Please check your information and try again.');
    } finally {
      setIsSaving(false);
    }
  });

  const [handleDelete, handleDeleteSaving] = useSaveAction(async () => {
    if (!deletingId) return;
    try {
      await expenseService.deleteExpense(deletingId);
      toast.success('Record Deleted!', 'The selected expense record has been removed.');
      await refreshAllData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete the record.');
    }
  });

  // Filter logic
  const now = new Date();
  const filteredExpenses = (expenses || []).filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (flockFilter !== 'all' && item.flockId !== flockFilter) return false;

    if (dateFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      if (item.date !== todayStr) return false;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      if (new Date(item.date) < weekAgo) return false;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      if (new Date(item.date) < monthAgo) return false;
    }
    return true;
  });

  // KPI Calculations
  const totalExp = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const feedExp = (expenses || []).filter(e => e.category === 'Feed').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const medExp = (expenses || []).filter(e => e.category === 'Medication').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const otherExp = totalExp - feedExp - medExp;

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (r) => <span className="font-semibold text-slate-800">{r.date}</span>
    },
    {
      header: 'Category',
      render: (r) => {
        const cat = r.category || 'Other';
        let variant = 'slate';
        if (cat === 'Feed') variant = 'green';
        else if (cat === 'Medication') variant = 'amber';
        else if (cat === 'Labour') variant = 'blue';
        return <Badge variant={variant}>{cat}</Badge>;
      }
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.description}</p>
          {r.notes && <p className="text-2xs text-slate-400 mt-0.5 line-clamp-1">{r.notes}</p>}
        </div>
      )
    },
    {
      header: 'Flock',
      render: (r) => {
        const fl = flocks.find(f => f.id === r.flockId);
        return <span className="text-xs text-slate-600">{fl ? fl.name : '—'}</span>;
      }
    },
    {
      header: 'Amount',
      render: (r) => <span className="font-extrabold text-slate-900">₦{(Number(r.amount) || 0).toLocaleString()}</span>
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (r) => <span className="text-xs text-slate-600">{r.paymentMethod || 'Cash'}</span>
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit Expense"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(r.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Expense"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Farm Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track feed orders, payroll, medication, diesel, water, and repairs.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Record Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Incurred</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₦{totalExp.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">All operating costs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Feed Purchases</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₦{feedExp.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">{totalExp > 0 ? ((feedExp / totalExp) * 100).toFixed(0) : 0}% of all expenses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Medication / Health</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₦{medExp.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">{totalExp > 0 ? ((medExp / totalExp) * 100).toFixed(0) : 0}% of all expenses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Other Overhead</span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₦{otherExp.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">Labour, utilities, repairs</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Categories</option>
          <option value="Feed">Feed</option>
          <option value="Medication">Medication</option>
          <option value="Labour">Labour</option>
          <option value="Transportation">Transportation</option>
          <option value="Electricity">Electricity</option>
          <option value="Equipment">Equipment</option>
          <option value="Repairs">Repairs</option>
          <option value="Other">Other</option>
        </select>

        {flocks.length > 0 && (
          <select
            value={flockFilter}
            onChange={(e) => setFlockFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Flocks</option>
            {flocks.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>

        {(categoryFilter !== 'all' || flockFilter !== 'all' || dateFilter !== 'all') && (
          <button
            onClick={() => { setCategoryFilter('all'); setFlockFilter('all'); setDateFilter('all'); }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        searchPlaceholder="Search expenses by description or category..."
        emptyTitle="No expense records found"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetForm(); }}
        title={editingRecord ? 'Edit Expense Record' : 'Record Farm Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. 50 bags TopFeeds Layer Mash, generator servicing"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₦) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="POS">POS</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Associated Flock (Optional)</label>
            <select
              value={form.flockId || ''}
              onChange={(e) => setForm({ ...form, flockId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">No specific flock / General Farm</option>
              {flocks.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Vendor details, invoice reference or remarks..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsAddOpen(false); resetForm(); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={handleSubmitSaving || (isSaving)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >{handleSubmitSaving ? 'Saving...' : <>
              {isSaving ? 'Saving...' : editingRecord ? 'Save Changes' : 'Record Expense'}
            </>}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
      />

      {/* Sticky Mobile Record Button */}
      <StickyRecordButton
        onClick={handleOpenAdd}
        label="Record Expense"
        color="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30"
        isModalOpen={isAddOpen || !!deletingId}
      />
    </div>
  );
}

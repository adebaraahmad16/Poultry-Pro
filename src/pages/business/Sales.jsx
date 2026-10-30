import useSaveAction from '../../hooks/useSaveAction';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, Plus, Trash2, Edit2, Filter, TrendingUp, CheckCircle2, Clock } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { salesService } from '../../services/businessService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import StickyRecordButton from '../../components/common/StickyRecordButton';

export default function Sales() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { sales, customers, flocks, refreshAllData } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const defaultForm = {
    customerName: '',
    product: 'Eggs',
    flockId: flocks[0]?.id || '',
    quantity: '',
    unitPrice: '',
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  const [form, setForm] = useState(defaultForm);

  // Auto-open via quick action (?action=record or ?action=sale)
  useEffect(() => {
    const action = params.get('action');
    if (action === 'record' || action === 'sale') {
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
      customerName: '',
      product: 'Eggs',
      flockId: flocks[0]?.id || '',
      quantity: '',
      unitPrice: '',
      paymentStatus: 'Paid',
      paymentMethod: 'Bank Transfer',
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
      customerName: record.customerName || record.customer || '',
      product: record.product || record.productType || 'Eggs',
      flockId: record.flockId || flocks[0]?.id || '',
      quantity: record.quantity || '',
      unitPrice: record.unitPrice || '',
      paymentStatus: record.paymentStatus || 'Paid',
      paymentMethod: record.paymentMethod || 'Bank Transfer',
      date: record.date || new Date().toISOString().split('T')[0],
      notes: record.notes || ''
    });
    setIsAddOpen(true);
  };

  const [handleSubmit, handleSubmitSaving] = useSaveAction(async (e) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const price = Number(form.unitPrice);

    if (!form.customerName.trim()) {
      toast.error('Validation Error', 'Customer name is required.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toast.error('Validation Error', 'Quantity must be greater than 0.');
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error('Validation Error', 'Unit price cannot be negative.');
      return;
    }

    const payload = {
      ...form,
      quantity: qty,
      unitPrice: price,
      totalAmount: qty * price
    };

    setIsSaving(true);
    try {
      if (editingRecord) {
        await salesService.updateSale(editingRecord.id, payload);
        toast.success('Sale Updated!', 'The sale transaction has been updated successfully.');
      } else {
        await salesService.createSale(payload);
        toast.success('Sale Recorded!', 'Your sales record has been saved successfully.');
      }
      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Unable to Save Sale', err.message || 'Please check your information and try again.');
    } finally {
      setIsSaving(false);
    }
  });

  const [handleUpdateStatus, handleUpdateStatusSaving] = useSaveAction(async (id, currentStatus) => {
    const next = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await salesService.updateSaleStatus(id, next);
      toast.success('Status Updated', `Sale status marked as ${next}.`);
      await refreshAllData();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  });

  const [handleDelete, handleDeleteSaving] = useSaveAction(async () => {
    if (!deletingId) return;
    try {
      await salesService.deleteSale(deletingId);
      toast.success('Record Deleted!', 'The selected sales record has been removed.');
      await refreshAllData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  });

  // Filter logic
  const now = new Date();
  const filteredSales = (sales || []).filter(item => {
    if (productFilter !== 'all' && (item.product !== productFilter && item.productType !== productFilter)) return false;
    if (statusFilter !== 'all' && item.paymentStatus !== statusFilter) return false;

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
  const totalSalesVal = (sales || []).reduce((s, x) => s + (Number(x.totalAmount) || 0), 0);
  const collectedVal = (sales || []).filter(x => x.paymentStatus === 'Paid').reduce((s, x) => s + (Number(x.totalAmount) || 0), 0);
  const pendingSalesVal = (sales || []).filter(x => x.paymentStatus === 'Pending' || x.paymentStatus === 'Partially Paid').reduce((s, x) => s + (Number(x.totalAmount) || 0), 0);
  const totalEggsCrates = (sales || []).filter(x => (x.product === 'Eggs' || x.productType === 'Eggs')).reduce((s, x) => s + (Number(x.quantity) || 0), 0);

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (r) => <span className="font-semibold text-slate-800">{r.date}</span>
    },
    {
      header: 'Customer',
      render: (r) => <span className="font-medium text-slate-900">{r.customerName || r.customer || 'Direct Customer'}</span>
    },
    {
      header: 'Product',
      render: (r) => {
        const prod = r.product || r.productType || 'Sale';
        return <Badge variant={prod === 'Eggs' ? 'amber' : prod === 'Live Birds' ? 'blue' : 'green'}>{prod}</Badge>;
      }
    },
    {
      header: 'Flock',
      render: (r) => {
        const fl = flocks.find(f => f.id === r.flockId);
        return <span className="text-xs text-slate-600">{fl ? fl.name : '—'}</span>;
      }
    },
    {
      header: 'Qty',
      render: (r) => <span className="font-semibold text-slate-800">{r.quantity}</span>
    },
    {
      header: 'Unit Price',
      render: (r) => `₦${(Number(r.unitPrice) || 0).toLocaleString()}`
    },
    {
      header: 'Total Amount',
      render: (r) => <span className="font-extrabold text-emerald-700">₦{(Number(r.totalAmount) || 0).toLocaleString()}</span>
    },
    {
      header: 'Payment Status',
      render: (r) => (
        <button disabled={handleUpdateStatusSaving}
          onClick={() => handleUpdateStatus(r.id, r.paymentStatus)}
          title="Click to toggle status"
          className="cursor-pointer"
        >{handleUpdateStatusSaving ? 'Saving...' : <>
          <Badge variant={r.paymentStatus === 'Paid' ? 'green' : r.paymentStatus === 'Pending' ? 'amber' : 'purple'}>
            {r.paymentStatus || 'Paid'}
          </Badge>
        </>}</button>
      )
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit Sale"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(r.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Sale"
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
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Sales & Revenue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Record product sales, track payments, and review customer revenue.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Record Sale
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₦{totalSalesVal.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">Total revenue booked</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Cash Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₦{collectedVal.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">Paid in full</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Outstanding</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">₦{pendingSalesVal.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">Pending customer collections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Egg Crates Sold</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalEggsCrates.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">Total crates dispatched</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Products</option>
          <option value="Eggs">Eggs (Crates)</option>
          <option value="Live Birds">Live Birds</option>
          <option value="Spent Layers">Spent Layers</option>
          <option value="Manure">Poultry Manure</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partially Paid">Partially Paid</option>
        </select>

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

        {(productFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
          <button
            onClick={() => { setProductFilter('all'); setStatusFilter('all'); setDateFilter('all'); }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredSales}
        searchPlaceholder="Search sales by customer or product..."
        emptyTitle="No sales records found"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetForm(); }}
        title={editingRecord ? 'Edit Sales Record' : 'Record Product Sale'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Sale Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product *</label>
              <select
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Eggs">Eggs (Crates)</option>
                <option value="Live Birds">Live Birds</option>
                <option value="Spent Layers">Spent Layers</option>
                <option value="Manure">Poultry Manure</option>
                <option value="Feed">Feed / Ingredients</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Alh. Bello Bakeries, Mama Ngozi, Walk-in buyer"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="Number of crates/birds"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Price (₦) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="Price per unit"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Auto Total preview */}
          {form.quantity && form.unitPrice && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Calculated Total Revenue</span>
              <span className="text-lg font-extrabold text-emerald-700">
                ₦{((Number(form.quantity) || 0) * (Number(form.unitPrice) || 0)).toLocaleString()}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Status</label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Paid">Paid in Full</option>
                <option value="Pending">Pending / Credit</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
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
              <option value="">No specific flock / General Inventory</option>
              {flocks.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Delivery note, invoice number, customer phone number..."
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
              {isSaving ? 'Saving...' : editingRecord ? 'Save Changes' : 'Record Sale'}
            </>}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Sale Record"
        message="Are you sure you want to delete this sales record? This action cannot be undone."
      />

      {/* Sticky Mobile Record Button */}
      <StickyRecordButton
        onClick={handleOpenAdd}
        label="Record Sale"
        color="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30"
        isModalOpen={isAddOpen || !!deletingId}
      />
    </div>
  );
}

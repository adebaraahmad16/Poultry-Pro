import React, { useState } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { salesService } from '../../services/businessService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Sales() {
  const { sales, customers, flocks, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    customerName: customers[0]?.name || '',
    product: 'Eggs',
    flockId: flocks[0]?.id || '',
    quantity: '',
    unitPrice: '',
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    salesService.createSale(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleUpdateStatus = (id, currentStatus) => {
    const next = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    salesService.updateSaleStatus(id, next);
    refreshAllData();
  };

  const handleDelete = () => {
    if (deletingId) {
      salesService.deleteSale(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const totalSalesVal = sales.reduce((s, x) => s + (x.totalAmount || 0), 0);
  const pendingSalesVal = sales.filter((x) => x.paymentStatus === 'Pending' || x.paymentStatus === 'Partially Paid').reduce((s, x) => s + (x.totalAmount || 0), 0);

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Product', accessor: 'product' },
    { header: 'Qty', accessor: 'quantity' },
    {
      header: 'Unit Price',
      render: (r) => `₦${(r.unitPrice || 0).toLocaleString()}`
    },
    {
      header: 'Total Amount',
      render: (r) => <span className="font-extrabold text-emerald-700">₦{(r.totalAmount || 0).toLocaleString()}</span>
    },
    {
      header: 'Payment Status',
      render: (r) => (
        <button onClick={() => handleUpdateStatus(r.id, r.paymentStatus)}>
          <Badge variant={r.paymentStatus === 'Paid' ? 'green' : r.paymentStatus === 'Pending' ? 'amber' : 'purple'}>
            {r.paymentStatus}
          </Badge>
        </button>
      )
    },
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
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Sales & Revenue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Record sales of eggs, live broilers, spent layers, and poultry manure.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record New Sale
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Gross Sales Revenue</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">₦{totalSalesVal.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Total revenue generated</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Outstanding Invoices</span>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">₦{pendingSalesVal.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Pending customer collections</p>
        </div>
      </div>

      <DataTable columns={columns} data={sales} searchPlaceholder="Search sales records..." emptyTitle="No sales records found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Sales Transaction">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product</label>
              <select
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Eggs">Eggs (Crates)</option>
                <option value="Live Birds">Live Birds</option>
                <option value="Spent Layers">Spent Layers</option>
                <option value="Manure">Poultry Manure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Price (₦)</label>
              <input
                type="number"
                required
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Status</label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Sale
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Sale" message="Are you sure?" />
    </div>
  );
}

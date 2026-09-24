import React, { useState } from 'react';
import { Users, Plus, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { customerService } from '../../services/businessService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Customers() {
  const { customers, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: 'Ilorin, Kwara State',
    type: 'Retailer',
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    customerService.createCustomer(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      customerService.deleteCustomer(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Customer Name', accessor: 'name' },
    { header: 'Type', render: (r) => <Badge variant="blue">{r.type}</Badge> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Total Purchases',
      render: (r) => <span className="font-bold text-slate-800">₦{(r.totalPurchases || 0).toLocaleString()}</span>
    },
    {
      header: 'Outstanding Balance',
      render: (r) => (
        <span className={`font-semibold ${r.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
          ₦{(r.outstandingBalance || 0).toLocaleString()}
        </span>
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
            <Users className="w-6 h-6 text-blue-600" />
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage egg buyers, distributors, bakeries, and outstanding ledger balances.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      <DataTable columns={columns} data={customers} searchPlaceholder="Search customers..." emptyTitle="No customers found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Customer Profile">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company / Customer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kwara Fresh Supermarkets"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Retailer">Retailer</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Distributor">Distributor</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
            Save Customer Profile
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Customer" message="Are you sure?" />
    </div>
  );
}

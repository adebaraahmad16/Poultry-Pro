import React, { useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { inventoryService } from '../../services/businessService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Inventory() {
  const { inventory, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Equipment',
    quantity: 10,
    unit: 'pcs',
    minStock: 5,
    supplier: 'AgroTech Supplies',
    cost: 5000
  });

  const handleCreate = (e) => {
    e.preventDefault();
    inventoryService.addItem(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      inventoryService.deleteItem(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Item Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Quantity',
      render: (r) => <span className="font-extrabold text-slate-800">{r.quantity} {r.unit}</span>
    },
    {
      header: 'Est. Unit Cost',
      render: (r) => `₦${(r.cost || 0).toLocaleString()}`
    },
    { header: 'Supplier', accessor: 'supplier' },
    {
      header: 'Stock Status',
      render: (r) => (
        <Badge variant={r.status === 'Low Stock' ? 'amber' : 'green'}>
          {r.status}
        </Badge>
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
            <Package className="w-6 h-6 text-emerald-600" />
            Farm Inventory & Equipment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track feeders, drinkers, egg trays, disinfectants, and packaging supplies.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Inventory Item
        </button>
      </div>

      <DataTable columns={columns} data={inventory} searchPlaceholder="Search inventory items..." emptyTitle="No inventory items found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Automatic Bell Drinkers"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Equipment">Equipment</option>
                <option value="Packaging materials">Packaging materials</option>
                <option value="Farm supplies">Farm supplies</option>
                <option value="Vaccines & Meds">Vaccines & Meds</option>
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
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Item
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Item" message="Are you sure?" />
    </div>
  );
}

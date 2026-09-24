import React, { useState } from 'react';
import { Wheat, Plus, MinusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { feedService } from '../../services/productionService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function FeedManagement() {
  const { feeds, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [bagsToDeduct, setBagsToDeduct] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    type: 'Layer Mash',
    quantityBags: '',
    unitPrice: '',
    supplier: '',
    minStockThresholdBags: 10
  });

  const handleCreate = (e) => {
    e.preventDefault();
    feedService.addFeedItem(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleRecordUsage = (e) => {
    e.preventDefault();
    if (selectedFeedId) {
      feedService.recordUsage(selectedFeedId, bagsToDeduct);
      refreshAllData();
      setIsUsageOpen(false);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      feedService.deleteFeedItem(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const totalBags = feeds.reduce((s, f) => s + (f.quantityBags || 0), 0);
  const totalKg = totalBags * 25;

  const columns = [
    { header: 'Feed Name', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    {
      header: 'Stock (Bags)',
      render: (r) => <span className="font-bold text-slate-800">{r.quantityBags} Bags</span>
    },
    {
      header: 'Stock (kg)',
      render: (r) => <span className="font-semibold text-slate-600">{(r.quantityBags * 25).toLocaleString()} kg</span>
    },
    {
      header: 'Price / Bag',
      render: (r) => `₦${(r.unitPrice || 0).toLocaleString()}`
    },
    { header: 'Supplier', accessor: 'supplier' },
    {
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'Low Stock' ? 'amber' : 'green'}>
          {r.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedFeedId(r.id);
              setIsUsageOpen(true);
            }}
            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
          >
            Log Usage
          </button>
          <button
            onClick={() => setDeletingId(r.id)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
            <Wheat className="w-6 h-6 text-emerald-600" />
            Feed Inventory & Usage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage feed stock types, log daily pen feeding, and track low-stock thresholds.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Feed Stock
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Feed Bags</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalBags} Bags</p>
          <p className="text-xs text-slate-500 mt-1">25kg standard bags</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Feed Weight</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{totalKg.toLocaleString()} kg</p>
          <p className="text-xs text-slate-500 mt-1">Total farm store weight</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Low Stock Warnings</span>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">
            {feeds.filter((f) => f.status === 'Low Stock').length} Items
          </p>
          <p className="text-xs text-slate-500 mt-1">Below minimum threshold</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={feeds}
        searchPlaceholder="Search feed stock by name or type..."
        emptyTitle="No feed inventory items recorded"
      />

      {/* Add Feed Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Feed Inventory Stock">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feed Name</label>
            <input
              type="text"
              required
              placeholder="e.g. TopFeeds Layer Mash Phase 1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feed Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Starter">Starter</option>
                <option value="Grower">Grower</option>
                <option value="Finisher">Finisher</option>
                <option value="Layer Mash">Layer Mash</option>
                <option value="Breeder Feed">Breeder Feed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity (Bags)</label>
              <input
                type="number"
                required
                min="1"
                value={form.quantityBags}
                onChange={(e) => setForm({ ...form, quantityBags: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Per Bag (₦)</label>
              <input
                type="number"
                required
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier</label>
              <input
                type="text"
                required
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Feed Stock
          </button>
        </form>
      </Modal>

      {/* Log Feed Usage Modal */}
      <Modal isOpen={isUsageOpen} onClose={() => setIsUsageOpen(false)} title="Log Daily Feed Consumption">
        <form onSubmit={handleRecordUsage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bags Consumed Today</label>
            <input
              type="number"
              required
              min="1"
              value={bagsToDeduct}
              onChange={(e) => setBagsToDeduct(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Deduct Stock & Log Usage
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Feed Record"
        message="Are you sure you want to delete this feed item from inventory?"
      />
    </div>
  );
}

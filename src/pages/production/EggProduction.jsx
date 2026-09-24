import React, { useState } from 'react';
import { Egg, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { eggService } from '../../services/productionService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import EggProductionChart from '../../components/charts/EggProductionChart';

export default function EggProduction() {
  const { eggs, flocks, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    flockId: flocks[0]?.id || '',
    totalEggs: '',
    brokenEggs: 0,
    rejectedEggs: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const calculatedGood = Math.max(0, form.totalEggs - form.brokenEggs - form.rejectedEggs);
  const calculatedCrates = (calculatedGood / 30).toFixed(1);

  const handleCreate = (e) => {
    e.preventDefault();
    const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
    eggService.createRecord({ ...form, flockName: flockObj?.name || 'Layer Flock' });
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      eggService.deleteRecord(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Flock Name', accessor: 'flockName' },
    { header: 'Total Eggs', accessor: 'totalEggs' },
    { header: 'Broken', accessor: 'brokenEggs' },
    { header: 'Rejected', accessor: 'rejectedEggs' },
    {
      header: 'Good Eggs',
      render: (r) => <span className="font-bold text-emerald-700">{r.goodEggs?.toLocaleString()}</span>
    },
    {
      header: 'Crates (30s)',
      render: (r) => <span className="font-semibold text-blue-700">{r.crates} Crates</span>
    },
    { header: 'Notes', accessor: 'notes' },
    {
      header: 'Actions',
      render: (r) => (
        <button
          onClick={() => setDeletingId(r.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  const totalGoodEggsPeriod = eggs.reduce((s, e) => s + (e.goodEggs || 0), 0);
  const totalCratesPeriod = (totalGoodEggsPeriod / 30).toFixed(0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Egg className="w-6 h-6 text-emerald-600" />
            Egg Production Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Record daily collections, track tray crate yields, and monitor breakage rates.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record Daily Eggs
        </button>
      </div>

      {/* Production Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Good Eggs Collected</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{totalGoodEggsPeriod.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Across all layer logs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Equivalent Egg Crates</span>
          <p className="text-3xl font-extrabold text-blue-700 mt-1">{totalCratesPeriod} Crates</p>
          <p className="text-xs text-slate-500 mt-1">Standard 30-egg trays</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Average Daily Lay Rate</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">88.4%</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">High efficiency range</p>
        </div>
      </div>

      {/* Production Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-base mb-4">Daily Yield Trend</h3>
        <EggProductionChart data={eggs} />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={eggs}
        searchPlaceholder="Search egg logs by flock or date..."
        emptyTitle="No egg records found"
      />

      {/* Add Egg Record Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Daily Egg Collection">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Layer Flock</label>
            <select
              value={form.flockId}
              onChange={(e) => setForm({ ...form, flockId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {flocks.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Eggs</label>
              <input
                type="number"
                required
                value={form.totalEggs}
                onChange={(e) => setForm({ ...form, totalEggs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Broken</label>
              <input
                type="number"
                value={form.brokenEggs}
                onChange={(e) => setForm({ ...form, brokenEggs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Rejected</label>
              <input
                type="number"
                value={form.rejectedEggs}
                onChange={(e) => setForm({ ...form, rejectedEggs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            Auto-Calculated: <strong>{calculatedGood.toLocaleString()} Good Eggs</strong> ({calculatedCrates} Crates)
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Shell quality check passed."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Record
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Egg Record"
        message="Are you sure you want to delete this daily egg record?"
      />
    </div>
  );
}

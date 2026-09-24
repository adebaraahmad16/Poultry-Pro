import React, { useState } from 'react';
import { TrendingDown, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { healthService } from '../../services/healthService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Mortality() {
  const { mortality, flocks, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    flockId: flocks[0]?.id || '',
    count: 2,
    cause: 'Heat Stress',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
    healthService.recordMortality({ ...form, flockName: flockObj?.name || 'Flock' });
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      healthService.deleteMortalityRecord(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Flock Name', accessor: 'flockName' },
    {
      header: 'Mortality Count',
      render: (r) => <span className="font-extrabold text-rose-600">{r.count} Birds</span>
    },
    {
      header: 'Cause of Loss',
      render: (r) => (
        <Badge variant={r.cause === 'Disease' ? 'rose' : r.cause === 'Heat Stress' ? 'amber' : 'slate'}>
          {r.cause}
        </Badge>
      )
    },
    { header: 'Notes', accessor: 'notes' },
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
            <TrendingDown className="w-6 h-6 text-rose-600" />
            Mortality Tracking & Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Log bird mortality losses by flock and analyze causes (Heat Stress, Disease, Injury).</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Mortality
        </button>
      </div>

      <DataTable columns={columns} data={mortality} searchPlaceholder="Search mortality logs..." emptyTitle="No mortality records found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Bird Mortality">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Affected Flock</label>
            <select
              value={form.flockId}
              onChange={(e) => setForm({ ...form, flockId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {flocks.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.currentBirds} live birds)</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Number of Birds Lost</label>
              <input
                type="number"
                required
                min="1"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primary Cause</label>
              <select
                value={form.cause}
                onChange={(e) => setForm({ ...form, cause: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Disease">Disease</option>
                <option value="Heat Stress">Heat Stress</option>
                <option value="Injury">Injury</option>
                <option value="Predators">Predators</option>
                <option value="Natural Causes">Natural Causes</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Observation Notes</label>
            <input
              type="text"
              placeholder="e.g. Found dead near feeder grid."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-rose-600 font-medium">* Saving will automatically deduct the count from current live flock population.</p>
          <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl">
            Confirm & Log Loss
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Record" message="Are you sure?" />
    </div>
  );
}

import React, { useState } from 'react';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { healthService } from '../../services/healthService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function Medication() {
  const { medications, flocks, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    medicationName: '',
    flockId: flocks[0]?.id || '',
    reason: 'Coccidiosis Treatment',
    dosage: '1ml / 2L water',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    cost: 15000,
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
    healthService.addMedication({ ...form, flockName: flockObj?.name || 'Flock' });
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      healthService.deleteMedication(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Medication Name', accessor: 'medicationName' },
    { header: 'Flock', accessor: 'flockName' },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Dosage', accessor: 'dosage' },
    {
      header: 'Course Duration',
      render: (r) => `${r.startDate} to ${r.endDate}`
    },
    {
      header: 'Cost',
      render: (r) => `₦${(r.cost || 0).toLocaleString()}`
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
            <Pill className="w-6 h-6 text-blue-600" />
            Medication Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track therapeutic treatments, antibiotics, vitamins, and anti-coccidials.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Medication Log
        </button>
      </div>

      <DataTable columns={columns} data={medications} searchPlaceholder="Search medications..." emptyTitle="No medication records found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Medication Course">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Medication Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Coxi-Stop Oral Solution"
              value={form.medicationName}
              onChange={(e) => setForm({ ...form, medicationName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Flock</label>
              <select
                value={form.flockId}
                onChange={(e) => setForm({ ...form, flockId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost (₦)</label>
              <input
                type="number"
                required
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason</label>
              <input
                type="text"
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dosage</label>
              <input
                type="text"
                required
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
            Save Medication
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Medication" message="Are you sure?" />
    </div>
  );
}

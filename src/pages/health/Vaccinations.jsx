import React, { useState } from 'react';
import { Syringe, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { healthService } from '../../services/healthService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Vaccinations() {
  const { vaccinations, flocks, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    vaccine: '',
    flockId: flocks[0]?.id || '',
    scheduledDate: new Date().toISOString().split('T')[0],
    administeredBy: 'Dr. Folorunsho',
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
    healthService.addVaccination({ ...form, flockName: flockObj?.name || 'Layer Flock' });
    refreshAllData();
    setIsAddOpen(false);
  };

  const toggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Upcoming' : 'Completed';
    healthService.updateVaccinationStatus(id, nextStatus);
    refreshAllData();
  };

  const handleDelete = () => {
    if (deletingId) {
      healthService.deleteVaccination(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Vaccine Name', accessor: 'vaccine' },
    { header: 'Flock', accessor: 'flockName' },
    { header: 'Scheduled Date', accessor: 'scheduledDate' },
    { header: 'Administered By', accessor: 'administeredBy' },
    {
      header: 'Status',
      render: (r) => (
        <button onClick={() => toggleStatus(r.id, r.status)}>
          <Badge variant={r.status === 'Completed' ? 'green' : 'amber'}>{r.status}</Badge>
        </button>
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
            <Syringe className="w-6 h-6 text-emerald-600" />
            Vaccination Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Schedule and track vaccine administration for Newcastle, Gumboro, Fowl Pox.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Vaccination
        </button>
      </div>

      <DataTable columns={columns} data={vaccinations} searchPlaceholder="Search vaccine schedules..." emptyTitle="No vaccinations scheduled" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Schedule New Vaccination">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vaccine Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Newcastle Disease Vaccine (Lasota)"
              value={form.vaccine}
              onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flock</label>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Administered By</label>
            <input
              type="text"
              required
              value={form.administeredBy}
              onChange={(e) => setForm({ ...form, administeredBy: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Schedule
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Vaccine Record" message="Are you sure?" />
    </div>
  );
}

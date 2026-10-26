import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Syringe, Plus, Trash2, Edit2, Calendar, CheckCircle2, AlertTriangle, Clock, Filter } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { healthService } from '../../services/healthService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Vaccinations() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { vaccinations, flocks, refreshAllData, farm } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [flockFilter, setFlockFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const defaultForm = {
    flockId: flocks[0]?.id || '',
    vaccine: '',
    diseasePrevented: '',
    birdsVaccinated: flocks[0]?.currentBirds || 0,
    dosage: '1 dose / bird',
    method: 'Drinking Water',
    scheduledDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    cost: '',
    status: 'Completed',
    administeredBy: '',
    notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  // Quick Action opening (?action=record)
  useEffect(() => {
    if (params.get('action') === 'record') {
      const flockParam = params.get('flockId');
      if (flockParam && flocks.some(f => f.id === flockParam)) {
        const fl = flocks.find(f => f.id === flockParam);
        setForm(prev => ({ ...prev, flockId: flockParam, birdsVaccinated: fl?.currentBirds || 0 }));
      }
      setEditingRecord(null);
      setIsAddOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params, flocks]);

  const resetForm = () => {
    const f0 = flocks[0];
    setForm({
      flockId: f0?.id || '',
      vaccine: '',
      diseasePrevented: '',
      birdsVaccinated: f0?.currentBirds || 0,
      dosage: '1 dose / bird',
      method: 'Drinking Water',
      scheduledDate: new Date().toISOString().split('T')[0],
      nextDueDate: '',
      cost: '',
      status: 'Completed',
      administeredBy: '',
      notes: ''
    });
    setEditingRecord(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditingRecord(r);
    setForm({
      flockId: r.flockId || flocks[0]?.id || '',
      vaccine: r.vaccineName || r.vaccine || '',
      diseasePrevented: r.diseasePrevented || '',
      birdsVaccinated: r.birdsVaccinated || flocks.find(f => f.id === r.flockId)?.currentBirds || 0,
      dosage: r.dose || r.dosage || '1 dose / bird',
      method: r.method || 'Drinking Water',
      scheduledDate: r.scheduledDate || r.date || new Date().toISOString().split('T')[0],
      nextDueDate: r.nextDueDate || '',
      cost: r.cost || '',
      status: r.status || 'Completed',
      administeredBy: r.administeredBy || '',
      notes: r.notes || ''
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vaccine.trim()) {
      toast.error('Vaccine name is required.', { title: 'Validation Error' });
      return;
    }
    if (!form.flockId && flocks.length > 0) {
      toast.error('Please select a target flock.', { title: 'Validation Error' });
      return;
    }

    setIsSaving(true);
    try {
      const flockObj = flocks.find(f => f.id === form.flockId) || flocks[0];
      const payload = {
        ...form,
        vaccineName: form.vaccine.trim(),
        flockName: flockObj?.name || 'Target Flock',
        cost: Number(form.cost || 0),
        birdsVaccinated: Number(form.birdsVaccinated || 0)
      };

      if (editingRecord) {
        await healthService.updateVaccination(editingRecord.id, payload);
        toast.success('Vaccination record updated successfully.', { title: 'Record Updated!' });
      } else {
        await healthService.addVaccination(payload);
        toast.success('Vaccination has been recorded successfully.', { title: 'Vaccination Recorded!' });
      }

      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving vaccination:', err);
      toast.error(err.message || 'Please check your information and try again.', { title: 'Unable to Save Record' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Upcoming' : 'Completed';
    try {
      await healthService.updateVaccinationStatus(id, nextStatus);
      toast.success(`Status updated to ${nextStatus}.`, { title: 'Status Updated' });
      await refreshAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await healthService.deleteVaccination(deletingId);
      toast.success('The selected vaccination record has been removed.', { title: 'Record Deleted!' });
      await refreshAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete record.', { title: 'Delete Failed' });
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive dynamic status (Completed, Upcoming, Overdue)
  const enrichedVaccinations = vaccinations.map(v => {
    const vDate = v.scheduledDate || v.date;
    let computedStatus = v.status || 'Upcoming';
    if (computedStatus !== 'Completed' && vDate && vDate < todayStr) {
      computedStatus = 'Overdue';
    }
    return { ...v, computedStatus, displayDate: vDate };
  });

  const completedCount = enrichedVaccinations.filter(v => v.computedStatus === 'Completed').length;
  const upcomingCount = enrichedVaccinations.filter(v => v.computedStatus === 'Upcoming').length;
  const overdueCount = enrichedVaccinations.filter(v => v.computedStatus === 'Overdue').length;

  // Filter
  const filteredVaccinations = enrichedVaccinations.filter(r => {
    if (flockFilter !== 'all' && r.flockId !== flockFilter) return false;
    if (statusFilter !== 'all' && r.computedStatus !== statusFilter) return false;
    if (dateFilter === 'today' && r.displayDate !== todayStr) return false;
    if (dateFilter === 'upcoming' && (r.computedStatus !== 'Upcoming' || r.displayDate < todayStr)) return false;
    return true;
  });

  const columns = [
    { 
      header: 'Vaccine & Disease',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800">{r.vaccineName || r.vaccine}</span>
          {r.diseasePrevented && <span className="block text-xs text-emerald-700 font-medium">{r.diseasePrevented}</span>}
        </div>
      )
    },
    { 
      header: 'Flock',
      render: (r) => {
        const fl = flocks.find(f => f.id === r.flockId);
        return <span>{r.flockName || fl?.name || 'Target Flock'}</span>;
      }
    },
    { header: 'Date', accessor: 'displayDate' },
    { 
      header: 'Method & Dose',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {r.method || 'Water'} {r.dosage || r.dose ? `(${r.dosage || r.dose})` : ''}
        </span>
      )
    },
    {
      header: 'Next Booster',
      render: (r) => r.nextDueDate ? <span className="text-xs font-semibold text-blue-700">{r.nextDueDate}</span> : <span className="text-xs text-slate-400">—</span>
    },
    {
      header: 'Status',
      render: (r) => (
        <button 
          onClick={() => toggleStatus(r.id, r.computedStatus)}
          title="Click to toggle status"
          className="cursor-pointer"
        >
          <Badge variant={r.computedStatus === 'Completed' ? 'green' : r.computedStatus === 'Overdue' ? 'rose' : 'amber'}>
            {r.computedStatus}
          </Badge>
        </button>
      )
    },
    { header: 'Remarks', accessor: 'notes' },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleOpenEdit(r)} 
            title="Edit Vaccination"
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDeletingId(r.id)} 
            title="Delete Record"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
            <Syringe className="w-6 h-6 text-emerald-600" />
            Vaccination Tracking & Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Schedule and track vaccine administration for Newcastle, Gumboro, Fowl Pox, and Marek's.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Record Vaccination
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Completed Vaccinations</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Successfully administered to flocks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming Scheduled</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-700 mt-1">{upcomingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Due in coming days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Overdue Vaccinations</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-extrabold text-rose-600 mt-1">{overdueCount}</p>
          <p className="text-xs text-slate-500 mt-1">Past scheduled date without completion</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={flockFilter}
            onChange={(e) => setFlockFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Flocks</option>
            {flocks.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Future Dates</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredVaccinations.length} of {vaccinations.length} records
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredVaccinations} 
        searchPlaceholder="Search vaccine names, diseases, or flock..." 
        emptyTitle="No vaccination records found" 
      />

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={() => { if (!isSaving) { setIsAddOpen(false); resetForm(); } }} 
        title={editingRecord ? "Edit Vaccination Record" : "Record Flock Vaccination"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vaccination Date *</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Flock *</label>
              <select
                required
                value={form.flockId}
                onChange={(e) => {
                  const targetFlock = flocks.find(f => f.id === e.target.value);
                  setForm({ ...form, flockId: e.target.value, birdsVaccinated: targetFlock?.currentBirds || form.birdsVaccinated });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.currentBirds} live birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vaccine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lasota, Gumboro (IBDV), Fowl Pox"
                value={form.vaccine}
                onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Disease Prevented</label>
              <input
                type="text"
                placeholder="e.g. Newcastle Disease"
                value={form.diseasePrevented}
                onChange={(e) => setForm({ ...form, diseasePrevented: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Birds Vaccinated</label>
              <input
                type="number"
                min="1"
                placeholder="Count"
                value={form.birdsVaccinated}
                onChange={(e) => setForm({ ...form, birdsVaccinated: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Administration Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Drinking Water">Drinking Water</option>
                <option value="Eye Drop">Eye Drop</option>
                <option value="Injection (Subcutaneous)">Injection (Subcutaneous)</option>
                <option value="Injection (Intramuscular)">Injection (Intramuscular)</option>
                <option value="Wing Web">Wing Web</option>
                <option value="Spray">Spray</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dosage</label>
              <input
                type="text"
                placeholder="e.g. 1000 doses / 20L"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Next Vaccination Date</label>
              <input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost ({farm.currency || '₦'})</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Completed">Completed (Administered)</option>
                <option value="Upcoming">Upcoming (Scheduled)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks & Administrator Notes</label>
            <input
              type="text"
              placeholder="e.g. Administered in early morning before feeding; no stress observed."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => { setIsAddOpen(false); resetForm(); }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSaving ? 'Saving…' : editingRecord ? 'Update Vaccination' : 'Save Vaccination'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Vaccination Record"
        message="Are you sure you want to delete this vaccination record from your schedule history?"
      />
    </div>
  );
}

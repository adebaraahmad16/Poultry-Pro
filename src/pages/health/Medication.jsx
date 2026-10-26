import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pill, Plus, Trash2, Edit2, Calendar, Filter, Activity, Clock } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { healthService } from '../../services/healthService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Medication() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { medications, flocks, refreshAllData, farm } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [flockFilter, setFlockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const defaultForm = {
    medicationName: '',
    flockId: flocks[0]?.id || '',
    reason: 'Coccidiosis Treatment',
    dosage: '1ml / 2L drinking water',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    durationDays: 5,
    cost: '',
    status: 'Ongoing',
    notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  // Quick Action opening (?action=record)
  useEffect(() => {
    if (params.get('action') === 'record') {
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
    setForm(defaultForm);
    setEditingRecord(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditingRecord(r);
    setForm({
      medicationName: r.medicationName || '',
      flockId: r.flockId || flocks[0]?.id || '',
      reason: r.reason || 'Treatment',
      dosage: r.dosage || '',
      startDate: r.startDate || r.date || new Date().toISOString().split('T')[0],
      endDate: r.endDate || r.startDate || new Date().toISOString().split('T')[0],
      durationDays: r.durationDays || 5,
      cost: r.cost || '',
      status: r.status || 'Ongoing',
      notes: r.notes || ''
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicationName.trim()) {
      toast.error('Medication name is required.', { title: 'Validation Error' });
      return;
    }
    if (!form.flockId && flocks.length > 0) {
      toast.error('Please select an affected flock.', { title: 'Validation Error' });
      return;
    }

    setIsSaving(true);
    try {
      const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
      const payload = {
        ...form,
        medicationName: form.medicationName.trim(),
        flockName: flockObj?.name || 'Target Flock',
        cost: Number(form.cost || 0),
        durationDays: Number(form.durationDays || 1),
        date: form.startDate
      };

      if (editingRecord) {
        await healthService.updateMedication(editingRecord.id, payload);
        toast.success('Medication record updated successfully.', { title: 'Record Updated!' });
      } else {
        await healthService.addMedication(payload);
        toast.success('Medication course has been logged successfully.', { title: 'Medication Recorded!' });
      }

      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving medication:', err);
      toast.error(err.message || 'Please check your information and try again.', { title: 'Unable to Save Record' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await healthService.deleteMedication(deletingId);
      toast.success('The selected medication record has been removed.', { title: 'Record Deleted!' });
      await refreshAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive ongoing vs completed
  const enrichedMedications = medications.map(m => {
    const sDate = m.startDate || m.date;
    const eDate = m.endDate || sDate;
    let computedStatus = m.status || 'Completed';
    if (sDate && eDate) {
      if (todayStr >= sDate && todayStr <= eDate) {
        computedStatus = 'Ongoing';
      } else if (todayStr > eDate) {
        computedStatus = 'Completed';
      }
    }
    return { ...m, computedStatus, displayStartDate: sDate, displayEndDate: eDate };
  });

  const ongoingCount = enrichedMedications.filter(m => m.computedStatus === 'Ongoing').length;
  const completedCount = enrichedMedications.filter(m => m.computedStatus === 'Completed').length;
  const totalCost = enrichedMedications.reduce((s, m) => s + Number(m.cost || 0), 0);

  // Filter
  const filteredMedications = enrichedMedications.filter(r => {
    if (flockFilter !== 'all' && r.flockId !== flockFilter) return false;
    if (statusFilter !== 'all' && r.computedStatus !== statusFilter) return false;
    return true;
  });

  const columns = [
    { 
      header: 'Medication Name',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800">{r.medicationName}</span>
          {r.reason && <span className="block text-xs text-blue-700 font-medium">{r.reason}</span>}
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
    { header: 'Dosage', accessor: 'dosage' },
    {
      header: 'Treatment Period',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {r.displayStartDate} {r.displayEndDate && r.displayEndDate !== r.displayStartDate ? `to ${r.displayEndDate}` : ''}
        </span>
      )
    },
    {
      header: 'Cost',
      render: (r) => `₦${Number(r.cost || 0).toLocaleString()}`
    },
    {
      header: 'Status',
      render: (r) => (
        <Badge variant={r.computedStatus === 'Ongoing' ? 'blue' : 'green'}>
          {r.computedStatus}
        </Badge>
      )
    },
    { header: 'Remarks', accessor: 'notes' },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleOpenEdit(r)} 
            title="Edit Medication"
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
            <Pill className="w-6 h-6 text-blue-600" />
            Flock Medication & Treatment Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record therapeutic treatments, antibiotics, vitamins, and anti-coccidials directly on this dashboard.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Record Medication
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Ongoing Treatments</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-700 mt-1">{ongoingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Courses currently active in pens</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Completed Courses</span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Finished treatment cycles</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Medication Expenses</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₦{totalCost.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Cumulative therapeutic expenditure</p>
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
            <option value="Ongoing">Ongoing Treatments</option>
            <option value="Completed">Completed Courses</option>
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
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredMedications.length} of {medications.length} records
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredMedications} 
        searchPlaceholder="Search medications, diagnoses, or flock..." 
        emptyTitle="No medication records found" 
      />

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={() => { if (!isSaving) { setIsAddOpen(false); resetForm(); } }} 
        title={editingRecord ? "Edit Medication Course" : "Record Medication Course"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Medication Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Coxi-Stop, Tylodox, Vitalyte"
                value={form.medicationName}
                onChange={(e) => setForm({ ...form, medicationName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Flock *</label>
              <select
                required
                value={form.flockId}
                onChange={(e) => setForm({ ...form, flockId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.currentBirds} live birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Diagnosis / Reason</label>
              <input
                type="text"
                placeholder="e.g. Coccidiosis, CRD, Stress Booster"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dosage & Mixing</label>
              <input
                type="text"
                placeholder="e.g. 1ml per 2L water"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks & Observations</label>
            <input
              type="text"
              placeholder="e.g. Administered for 3 consecutive days; birds recovering well."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSaving ? 'Saving…' : editingRecord ? 'Update Medication' : 'Save Medication Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Medication Record"
        message="Are you sure you want to delete this medication course record from your treatment history?"
      />
    </div>
  );
}

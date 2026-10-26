import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingDown, Plus, Trash2, Edit2, AlertTriangle, Filter, Bird } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { healthService } from '../../services/healthService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import MortalityChart from '../../components/charts/MortalityChart';

export default function Mortality() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { mortality, flocks, refreshAllData } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [flockFilter, setFlockFilter] = useState('all');
  const [causeFilter, setCauseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const defaultForm = {
    flockId: flocks[0]?.id || '',
    count: 1,
    cause: 'Heat Stress',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  // Quick Action auto-opening (?action=record)
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
    setForm({
      flockId: flocks[0]?.id || '',
      count: 1,
      cause: 'Heat Stress',
      date: new Date().toISOString().split('T')[0],
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
      count: r.count || 1,
      cause: r.cause || 'Heat Stress',
      date: r.date || new Date().toISOString().split('T')[0],
      notes: r.notes || ''
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.flockId && flocks.length > 0) {
      toast.error('Please select an affected flock.', { title: 'Validation Error' });
      return;
    }
    const countNum = Number(form.count);
    if (!countNum || countNum <= 0) {
      toast.error('Mortality count must be greater than zero.', { title: 'Validation Error' });
      return;
    }

    const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
    if (flockObj && countNum > flockObj.currentBirds && !editingRecord) {
      toast.error(`Count (${countNum}) cannot exceed available birds in flock (${flockObj.currentBirds}).`, { title: 'Validation Error' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        count: countNum,
        flockName: flockObj?.name || 'Target Flock'
      };

      if (editingRecord) {
        await healthService.updateMortalityRecord(editingRecord.id, payload);
        toast.success('Mortality record has been updated successfully.', { title: 'Record Updated!' });
      } else {
        await healthService.recordMortality(payload);
        toast.success('Mortality loss logged and bird population updated.', { title: 'Mortality Recorded!' });
      }

      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving mortality:', err);
      toast.error(err.message || 'Please check your information and try again.', { title: 'Unable to Save Record' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await healthService.deleteMortalityRecord(deletingId);
      toast.success('The selected mortality record has been removed.', { title: 'Record Deleted!' });
      await refreshAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete mortality record.');
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

  // Filtering
  const filteredMortality = mortality.filter((r) => {
    if (flockFilter !== 'all' && r.flockId !== flockFilter) return false;
    if (causeFilter !== 'all' && r.cause !== causeFilter) return false;
    if (dateFilter === 'today' && r.date !== todayStr) return false;
    if (dateFilter === '7days' && r.date < sevenDaysStr) return false;
    return true;
  });

  // Analytics
  const totalBirdsNow = flocks.reduce((s, f) => s + (Number(f.currentBirds) || 0), 0);
  const totalDead = filteredMortality.reduce((s, r) => s + (Number(r.count) || 0), 0);
  const todayDead = mortality.filter(r => r.date === todayStr).reduce((s, r) => s + (Number(r.count) || 0), 0);
  const mortalityRatePct = (totalBirdsNow + totalDead) > 0 ? (totalDead / (totalBirdsNow + totalDead)) * 100 : 0;

  // Most common cause
  const causeCounts = {};
  mortality.forEach(r => {
    const c = r.cause || 'Unknown';
    causeCounts[c] = (causeCounts[c] || 0) + (Number(r.count) || 0);
  });
  const topCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None recorded';

  const columns = [
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Flock Name',
      render: (r) => {
        const fl = flocks.find(f => f.id === r.flockId);
        return <span className="font-semibold text-slate-800">{r.flockName || fl?.name || 'Affected Flock'}</span>;
      }
    },
    {
      header: 'Mortality Count',
      render: (r) => <span className="font-extrabold text-rose-600">{Number(r.count).toLocaleString()} Birds</span>
    },
    {
      header: 'Suspected Cause',
      render: (r) => (
        <Badge variant={r.cause === 'Disease' ? 'rose' : r.cause === 'Heat Stress' ? 'amber' : 'slate'}>
          {r.cause || 'Unknown'}
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
            title="Edit Mortality Record"
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
            <TrendingDown className="w-6 h-6 text-rose-600" />
            Mortality Tracking & Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log bird losses directly by flock and monitor causes such as Heat Stress, Disease, and Smothering.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Record Mortality
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Today's Losses</span>
          <p className="text-3xl font-extrabold text-rose-600 mt-1">{todayDead.toLocaleString()} Birds</p>
          <p className="text-xs text-slate-500 mt-1">Recorded on {todayStr}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Mortality (Filtered)</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalDead.toLocaleString()} Birds</p>
          <p className="text-xs text-slate-500 mt-1">Cumulative loss in selection</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Cumulative Mortality Rate</span>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{mortalityRatePct.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Target benchmark: &lt; 5.0%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Primary Cause</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1 truncate">{topCause}</p>
          <p className="text-xs text-slate-500 mt-1">Highest frequency loss factor</p>
        </div>
      </div>

      {/* Mortality Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-base mb-4">Mortality Trend Over Time</h3>
        <MortalityChart data={filteredMortality} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </div>

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
            value={causeFilter}
            onChange={(e) => setCauseFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Causes</option>
            <option value="Heat Stress">Heat Stress</option>
            <option value="Disease">Disease</option>
            <option value="Smothering / Injury">Smothering / Injury</option>
            <option value="Predators">Predators</option>
            <option value="Old Age">Old Age</option>
            <option value="Unknown">Unknown</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredMortality.length} of {mortality.length} records
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredMortality} 
        searchPlaceholder="Search mortality logs by flock, cause, or date..." 
        emptyTitle="No mortality records found" 
      />

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={() => { if (!isSaving) { setIsAddOpen(false); resetForm(); } }} 
        title={editingRecord ? "Edit Mortality Record" : "Record Flock Mortality"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date *</label>
              <input
                type="date"
                required
                max={todayStr}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Affected Flock *</label>
              <select
                required
                value={form.flockId}
                onChange={(e) => setForm({ ...form, flockId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.currentBirds} live birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Number of Dead Birds *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="Count"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Suspected Cause</label>
              <select
                value={form.cause}
                onChange={(e) => setForm({ ...form, cause: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              >
                <option value="Heat Stress">Heat Stress</option>
                <option value="Disease">Disease (Bacterial / Viral)</option>
                <option value="Smothering / Injury">Smothering / Injury</option>
                <option value="Predators">Predators / Rodents</option>
                <option value="Old Age">Old Age / Natural</option>
                <option value="Water Deprivation">Water Deprivation</option>
                <option value="Unknown">Unknown / Under Investigation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks & Observations</label>
            <input
              type="text"
              placeholder="e.g. Birds found near pen north vent; ventilation checked."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
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
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSaving ? 'Saving…' : editingRecord ? 'Update Record' : 'Save Mortality Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Mortality Record"
        message="Are you sure you want to delete this mortality record? Bird flock populations will be adjusted accordingly."
      />
    </div>
  );
}

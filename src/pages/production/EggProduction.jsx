import useSaveAction from '../../hooks/useSaveAction';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Egg, Plus, Trash2, Edit2, Calendar, TrendingUp, Filter } from '../../components/common/Icons';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { eggService } from '../../services/productionService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import EggProductionChart from '../../components/charts/EggProductionChart';
import StickyRecordButton from '../../components/common/StickyRecordButton';

export default function EggProduction() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { eggs, flocks, sales, dailyRecords, refreshAllData, farm } = useFarm();
  const { selectedTypes } = usePoultryData();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [flockFilter, setFlockFilter] = useState('all');
  const [poultryTypeFilter, setPoultryTypeFilter] = useState('all');

  // Form State
  const defaultForm = {
    flockId: flocks[0]?.id || '',
    totalEggs: '',
    brokenEggs: 0,
    rejectedEggs: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  // Auto-open modal if navigated from Quick Action (?action=record)
  useEffect(() => {
    if (params.get('action') === 'record') {
      const flockParam = params.get('flockId');
      if (flockParam && flocks.some(f => f.id === flockParam)) {
        setForm(prev => ({ ...prev, flockId: flockParam }));
      }
      setEditingRecord(null);
      setIsAddOpen(true);
      // Clean up param
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params, flocks]);

  const selectedFlock = flocks.find(f => f.id === form.flockId) || flocks[0];
  const calculatedGood = Math.max(0, (Number(form.totalEggs) || 0) - (Number(form.brokenEggs) || 0) - (Number(form.rejectedEggs) || 0));
  const calculatedCrates = (calculatedGood / 30).toFixed(1);

  const resetForm = () => {
    setForm({
      flockId: flocks[0]?.id || '',
      totalEggs: '',
      brokenEggs: 0,
      rejectedEggs: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingRecord(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setForm({
      flockId: record.flockId || flocks[0]?.id || '',
      totalEggs: record.totalEggs ?? (Number(record.goodEggs || 0) + Number(record.brokenEggs || 0) + Number(record.rejectedEggs || 0)),
      brokenEggs: record.brokenEggs || 0,
      rejectedEggs: record.rejectedEggs || 0,
      date: record.date || new Date().toISOString().split('T')[0],
      notes: record.notes || ''
    });
    setIsAddOpen(true);
  };

  const [handleSubmit, handleSubmitSaving] = useSaveAction(async (e) => {
    e.preventDefault();
    if (!form.flockId && flocks.length > 0) {
      toast.error('Please select a flock.', { title: 'Validation Error' });
      return;
    }
    if (Number(form.totalEggs) < 0 || Number(form.brokenEggs) < 0 || Number(form.rejectedEggs) < 0) {
      toast.error('Egg quantities cannot be negative.', { title: 'Validation Error' });
      return;
    }
    if ((Number(form.brokenEggs) + Number(form.rejectedEggs)) > Number(form.totalEggs)) {
      toast.error('Cracked and damaged eggs cannot exceed total eggs collected.', { title: 'Validation Error' });
      return;
    }

    setIsSaving(true);
    try {
      const flockObj = flocks.find((f) => f.id === form.flockId) || flocks[0];
      const payload = {
        ...form,
        flockName: flockObj?.name || 'Layer Flock',
        poultryType: flockObj?.type || 'Layers',
        goodEggs: calculatedGood,
        brokenEggs: Number(form.brokenEggs) || 0,
        rejectedEggs: Number(form.rejectedEggs) || 0,
        totalEggs: Number(form.totalEggs) || 0,
      };

      if (editingRecord) {
        await eggService.updateRecord(editingRecord.id, payload);
        toast.success('Your changes have been saved successfully.', { title: 'Record Updated!' });
      } else {
        await eggService.createRecord(payload);
        toast.success('Your egg production record has been saved successfully.', { title: 'Egg Production Recorded!' });
      }

      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving egg record:', err);
      toast.error(err.message || 'Please check your information and try again.', { title: 'Unable to Save Record' });
    } finally {
      setIsSaving(false);
    }
  });

  const [handleDelete, handleDeleteSaving] = useSaveAction(async () => {
    if (!deletingId) return;
    try {
      await eggService.deleteRecord(deletingId);
      toast.success('The selected egg record has been removed.', { title: 'Record Deleted!' });
      await refreshAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete egg record.', { title: 'Delete Failed' });
    } finally {
      setDeletingId(null);
    }
  });

  // Filter eggs
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
  const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const filteredEggs = eggs.filter((r) => {
    if (flockFilter !== 'all' && r.flockId !== flockFilter) return false;
    if (poultryTypeFilter !== 'all') {
      const f = flocks.find(fl => fl.id === r.flockId);
      if (f && f.type !== poultryTypeFilter) return false;
    }
    if (dateFilter === 'today' && r.date !== todayStr) return false;
    if (dateFilter === 'yesterday' && r.date !== yesterdayStr) return false;
    if (dateFilter === '7days' && r.date < sevenDaysStr) return false;
    if (dateFilter === 'month' && r.date < monthStartStr) return false;
    return true;
  });

  // Egg Stock Calculation
  const eggStock = eggs.reduce((n, r) => n + Number(r.goodEggs || 0), 0) -
    sales.filter((s) => s.product === 'Eggs').reduce((n, s) => n + Number(s.quantity || 0), 0);

  // Lay rate calculation
  const measuredDays = new Map();
  dailyRecords.filter((r) => r.category === 'eggs' && r.status === 'Recorded' && r.values?.layingHens > 0).forEach((r) => {
    const key = `${r.date}:${r.flockId}`;
    const day = measuredDays.get(key) || { eggs: 0, hens: r.values.layingHens };
    day.eggs += Number(r.values.totalEggs || 0);
    measuredDays.set(key, day);
  });
  const hens = [...measuredDays.values()].reduce((n, d) => n + d.hens, 0);
  const layRate = hens ? ([...measuredDays.values()].reduce((n, d) => n + d.eggs, 0) / hens) * 100 : null;

  const totalGoodEggsPeriod = filteredEggs.reduce((s, e) => s + Number(e.goodEggs || 0), 0);
  const totalCratesPeriod = (totalGoodEggsPeriod / 30).toFixed(0);

  const columns = [
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Flock Name',
      render: (r) => {
        const fl = flocks.find(f => f.id === r.flockId);
        return (
          <div>
            <span className="font-semibold text-slate-800">{r.flockName || fl?.name || 'Layer Flock'}</span>
            {fl?.type && <span className="block text-xs text-slate-400">{fl.type}</span>}
          </div>
        );
      }
    },
    { 
      header: 'Total Collected', 
      render: (r) => <span className="font-medium text-slate-800">{Number(r.totalEggs || (Number(r.goodEggs || 0) + Number(r.brokenEggs || 0) + Number(r.rejectedEggs || 0))).toLocaleString()}</span>
    },
    {
      header: 'Good Eggs',
      render: (r) => <span className="font-bold text-emerald-700">{Number(r.goodEggs || 0).toLocaleString()}</span>
    },
    { 
      header: 'Cracked', 
      render: (r) => <span className="text-amber-700 font-medium">{r.brokenEggs || 0}</span>
    },
    { 
      header: 'Damaged', 
      render: (r) => <span className="text-rose-700 font-medium">{r.rejectedEggs || 0}</span>
    },
    {
      header: 'Crates (30s)',
      render: (r) => <span className="font-semibold text-blue-700">{((r.goodEggs || 0) / 30).toFixed(1)}</span>
    },
    { header: 'Remarks', accessor: 'notes' },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(r)}
            title="Edit Record"
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
            <Egg className="w-6 h-6 text-emerald-600" />
            Egg Production Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record daily collections, monitor crate yields, and track breakage rates directly on this dashboard.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Record Egg Production
        </button>
      </div>

      {/* Production Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Good Eggs (Selected)</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{totalGoodEggsPeriod.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Ready for sale / consumption</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Equivalent Trays</span>
          <p className="text-3xl font-extrabold text-blue-700 mt-1">{totalCratesPeriod} Crates</p>
          <p className="text-xs text-slate-500 mt-1">Standard 30-egg commercial crates</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Average Lay Rate</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{layRate == null ? 'Not recorded' : `${layRate.toFixed(1)}%`}</p>
          <p className="text-xs text-slate-500 mt-1">Hens in active production</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Available Stock</span>
          <p className="text-3xl font-extrabold text-amber-700 mt-1">{eggStock.toLocaleString()} Eggs</p>
          <p className="text-xs text-slate-500 mt-1">Production minus recorded sales</p>
        </div>
      </div>

      {/* Production Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-base mb-4">Daily Yield Trend</h3>
        <EggProductionChart data={filteredEggs} />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
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

          {selectedTypes?.length > 1 && (
            <select
              value={poultryTypeFilter}
              onChange={(e) => setPoultryTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">All Poultry Types</option>
              {selectedTypes.map((t) => (
                <option key={t.id} value={t.label}>{t.label}</option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredEggs.length} of {eggs.length} total records
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEggs}
        searchPlaceholder="Search egg logs by flock, remarks, or date..."
        emptyTitle="No egg records found"
      />

      {/* Add / Edit Record Modal */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={() => { if (!isSaving) { setIsAddOpen(false); resetForm(); } }} 
        title={editingRecord ? "Edit Egg Production Record" : "Record Daily Egg Production"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Production Date *</label>
              <input
                type="date"
                required
                max={todayStr}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Layer Flock *</label>
              <select
                required
                value={form.flockId}
                onChange={(e) => setForm({ ...form, flockId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.type} • {f.currentBirds} birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Eggs *</label>
              <input
                type="number"
                min="0"
                required
                placeholder="e.g. 300"
                value={form.totalEggs}
                onChange={(e) => setForm({ ...form, totalEggs: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cracked / Broken</label>
              <input
                type="number"
                min="0"
                value={form.brokenEggs}
                onChange={(e) => setForm({ ...form, brokenEggs: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Damaged / Rejected</label>
              <input
                type="number"
                min="0"
                value={form.rejectedEggs}
                onChange={(e) => setForm({ ...form, rejectedEggs: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>Good Eggs: <strong>{calculatedGood.toLocaleString()}</strong></span>
            <span>Equivalent Trays: <strong>{calculatedCrates} Crates</strong></span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks / Quality Notes</label>
            <input
              type="text"
              placeholder="e.g. Clean shells, good yolk color, no abnormal breakage"
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
              disabled={handleSubmitSaving || (isSaving)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >{handleSubmitSaving ? 'Saving...' : <>
              {isSaving ? 'Saving…' : editingRecord ? 'Update Record' : 'Save Egg Record'}
            </>}</button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Egg Record"
        message="Are you sure you want to delete this daily egg collection record? This will update your calculated egg inventory and yield statistics."
      />

      {/* Sticky Mobile Record Button */}
      <StickyRecordButton
        onClick={handleOpenAdd}
        label="Record Eggs"
        color="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30"
        isModalOpen={isAddOpen || !!deletingId}
      />
    </div>
  );
}

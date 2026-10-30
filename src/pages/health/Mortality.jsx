import useSaveAction from '../../hooks/useSaveAction';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  Filter,
  Bird,
  Calendar,
  Layers,
  Building2,
  FileText
} from '../../components/common/Icons';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { usePoultry } from '../../context/PoultryContext';
import { healthService } from '../../services/healthService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import MortalityChart from '../../components/charts/MortalityChart';
import StickyRecordButton from '../../components/common/StickyRecordButton';

export default function Mortality() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { farm, mortality = [], flocks = [], refreshAllData } = useFarm();
  const { selectedTypes = [] } = usePoultryData();
  const { activeTypeId } = usePoultry();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [flockFilter, setFlockFilter] = useState('all');
  const [causeFilter, setCauseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'
  const [poultryTypeFilter, setPoultryTypeFilter] = useState(activeTypeId || 'all');

  // Form State
  const defaultForm = {
    flockId: flocks[0]?.id || '',
    poultryType: flocks[0]?.type || selectedTypes[0]?.id || 'Broiler',
    count: 1,
    cause: 'Heat Stress',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  // Auto-open via query param (?action=record)
  useEffect(() => {
    if (params.get('action') === 'record') {
      const flockParam = params.get('flockId');
      if (flockParam && flocks.some((f) => f.id === flockParam)) {
        const foundFlock = flocks.find((f) => f.id === flockParam);
        setForm((prev) => ({
          ...prev,
          flockId: flockParam,
          poultryType: foundFlock?.type || prev.poultryType
        }));
      }
      setEditingRecord(null);
      setIsAddOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params, flocks, setParams]);

  // When flock changes in form, automatically align poultryType
  const handleFlockChange = (fId) => {
    const selectedFlock = flocks.find((f) => f.id === fId);
    setForm((prev) => ({
      ...prev,
      flockId: fId,
      poultryType: selectedFlock?.type || prev.poultryType
    }));
  };

  const resetForm = () => {
    setForm({
      flockId: flocks[0]?.id || '',
      poultryType: flocks[0]?.type || selectedTypes[0]?.id || 'Broiler',
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
    const fl = flocks.find((f) => f.id === r.flockId);
    setForm({
      flockId: r.flockId || flocks[0]?.id || '',
      poultryType: r.poultryType || fl?.type || 'Broiler',
      count: r.count || 1,
      cause: r.cause || 'Heat Stress',
      date: r.date || new Date().toISOString().split('T')[0],
      notes: r.notes || ''
    });
    setIsAddOpen(true);
  };

  const [handleSubmit, handleSubmitSaving] = useSaveAction(async (e) => {
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
    if (flockObj && countNum > Number(flockObj.currentBirds || 0) && !editingRecord) {
      toast.error(
        `Loss count (${countNum}) cannot exceed available birds in flock (${flockObj.currentBirds}).`,
        { title: 'Validation Error' }
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        count: countNum,
        flockName: flockObj?.name || 'Affected Flock',
        poultryType: form.poultryType || flockObj?.type || 'Broiler',
        farmName: farm?.name || 'My Farm'
      };

      if (editingRecord) {
        await healthService.updateMortalityRecord(editingRecord.id, payload);
        toast.success('Mortality record has been updated successfully.', { title: 'Record Updated!' });
      } else {
        await healthService.recordMortality(payload);
        toast.success('Mortality loss logged and flock population updated.', { title: 'Mortality Recorded!' });
      }

      await refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving mortality record:', err);
      toast.error(err.message || 'Please check your information and try again.', { title: 'Unable to Save Record' });
    } finally {
      setIsSaving(false);
    }
  });

  const [handleDelete, handleDeleteSaving] = useSaveAction(async () => {
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
  });

  // Date boundaries for filtering and KPIs
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Filtering
  const filteredMortality = useMemo(() => {
    return mortality.filter((r) => {
      if (flockFilter !== 'all' && r.flockId !== flockFilter) return false;
      if (causeFilter !== 'all' && r.cause !== causeFilter) return false;

      // Poultry Type Filter
      if (poultryTypeFilter !== 'all') {
        const fl = flocks.find((f) => f.id === r.flockId);
        const rType = String(r.poultryType || fl?.type || '').toLowerCase();
        if (!rType.includes(poultryTypeFilter.toLowerCase())) return false;
      }

      // Date Filter
      if (dateFilter === 'today' && r.date !== todayStr) return false;
      if (dateFilter === '7days' && r.date < sevenDaysStr) return false;
      if (dateFilter === '30days' && r.date < thirtyDaysStr) return false;

      return true;
    });
  }, [mortality, flockFilter, causeFilter, poultryTypeFilter, dateFilter, flocks, todayStr, sevenDaysStr, thirtyDaysStr]);

  // Overview KPI Metrics
  const totalDead = useMemo(() => {
    return filteredMortality.reduce((s, r) => s + (Number(r.count) || 0), 0);
  }, [filteredMortality]);

  const todayDead = useMemo(() => {
    return mortality.filter((r) => r.date === todayStr).reduce((s, r) => s + (Number(r.count) || 0), 0);
  }, [mortality, todayStr]);

  const weeklyDead = useMemo(() => {
    return mortality.filter((r) => r.date >= sevenDaysStr).reduce((s, r) => s + (Number(r.count) || 0), 0);
  }, [mortality, sevenDaysStr]);

  const monthlyDead = useMemo(() => {
    return mortality.filter((r) => r.date >= thirtyDaysStr).reduce((s, r) => s + (Number(r.count) || 0), 0);
  }, [mortality, thirtyDaysStr]);

  const totalCurrentBirds = useMemo(() => {
    return flocks.reduce((s, f) => s + (Number(f.currentBirds) || 0), 0);
  }, [flocks]);

  const cumulativeMortalityRate = useMemo(() => {
    const totalFlockBase = totalCurrentBirds + totalDead;
    return totalFlockBase > 0 ? (totalDead / totalFlockBase) * 100 : 0;
  }, [totalCurrentBirds, totalDead]);

  // Primary Suspected Cause
  const topCause = useMemo(() => {
    const counts = {};
    filteredMortality.forEach((r) => {
      const c = r.cause || 'Unknown';
      counts[c] = (counts[c] || 0) + (Number(r.count) || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None recorded';
  }, [filteredMortality]);

  // Table Columns
  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (r) => <span className="font-semibold text-slate-800">{r.date}</span>
    },
    {
      header: 'Flock Name',
      render: (r) => {
        const fl = flocks.find((f) => f.id === r.flockId);
        return (
          <div>
            <span className="font-extrabold text-slate-900 block">{r.flockName || fl?.name || 'Affected Flock'}</span>
            <span className="text-[11px] text-slate-400 font-medium">{r.poultryType || fl?.type || 'Poultry'}</span>
          </div>
        );
      }
    },
    {
      header: 'Mortality Count',
      render: (r) => (
        <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
          {Number(r.count).toLocaleString()} Dead
        </span>
      )
    },
    {
      header: 'Suspected Cause',
      render: (r) => (
        <Badge
          variant={
            r.cause === 'Disease'
              ? 'rose'
              : r.cause === 'Heat Stress'
              ? 'amber'
              : r.cause === 'Smothering / Injury'
              ? 'blue'
              : 'slate'
          }
        >
          {r.cause || 'Unknown'}
        </Badge>
      )
    },
    {
      header: 'Remarks',
      render: (r) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block" title={r.notes || 'No remarks'}>
          {r.notes || '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewingRecord(r)}
            title="View Details"
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(r)}
            title="Edit Mortality Record"
            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingId(r.id)}
            title="Delete Record"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* ── Page Header & Direct Record Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-600 shrink-0" />
            Mortality Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log bird losses directly by flock, monitor cause factors, and track mortality rates across all poultry batches.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-900/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Record Mortality</span>
        </button>
      </div>

      {/* ── Overview KPI Cards (5 required cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Mortality */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Mortality</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {totalDead.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-slate-500">birds</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative losses recorded</p>
        </div>

        {/* 2. Today's Mortality */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600">Today's Losses</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
            {todayDead.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-rose-500">dead</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{todayStr}</p>
        </div>

        {/* 3. Weekly Mortality */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Weekly (7 Days)</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
            {weeklyDead.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-slate-500">birds</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Past 7 days mortality</p>
        </div>

        {/* 4. Monthly Mortality */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Monthly (30 Days)</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
            {monthlyDead.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-slate-500">birds</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Past 30 days loss log</p>
        </div>

        {/* 5. Mortality Rate */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600">Mortality Rate</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
            {cumulativeMortalityRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Target benchmark: &lt; 5.0%</p>
        </div>
      </div>

      {/* ── Analytics Trends Section (Daily, Weekly, Monthly, Flock Rate) ── */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Mortality Trends & Analytics</h2>
            <p className="text-xs text-slate-500">
              Interactive loss patterns across daily periods, weekly cohorts, and flock benchmark comparisons.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto mt-1 sm:mt-0">
            Top Factor: <span className="text-rose-600">{topCause}</span>
          </span>
        </div>

        <MortalityChart mortality={filteredMortality} flocks={flocks} />
      </div>

      {/* ── Filter Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">Date: All Time</option>
            <option value="today">Date: Today</option>
            <option value="7days">Date: Last 7 Days</option>
            <option value="30days">Date: Last 30 Days</option>
          </select>

          {/* Flock Filter */}
          <select
            value={flockFilter}
            onChange={(e) => setFlockFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">Flock: All Flocks</option>
            {flocks.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Poultry Type Filter */}
          <select
            value={poultryTypeFilter}
            onChange={(e) => setPoultryTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">Type: All Poultry Types</option>
            <option value="Broiler">Broilers</option>
            <option value="Layer">Layers</option>
            <option value="Cockerel">Cockerels</option>
            <option value="Turkey">Turkeys</option>
            <option value="Duck">Ducks</option>
            <option value="Quail">Quails</option>
          </select>

          {/* Suspected Cause Filter */}
          <select
            value={causeFilter}
            onChange={(e) => setCauseFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">Cause: All Causes</option>
            <option value="Heat Stress">Heat Stress</option>
            <option value="Disease">Disease</option>
            <option value="Smothering / Injury">Smothering / Injury</option>
            <option value="Predators">Predators</option>
            <option value="Water Deprivation">Water Deprivation</option>
            <option value="Old Age">Old Age</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium self-end sm:self-auto">
          Showing {filteredMortality.length} of {mortality.length} records
        </div>
      </div>

      {/* ── Responsive Record Presentation (Table on Desktop, Cards on Mobile) ── */}
      <DataTable
        columns={columns}
        data={filteredMortality}
        searchPlaceholder="Search mortality logs by flock, cause, or date..."
        emptyTitle="No mortality records found"
        emptySubtitle="Track losses by recording dead birds per flock."
        onAdd={handleOpenAdd}
        addText="+ Record Mortality"
      />

      {/* ── Mobile Sticky Record Button ── */}
      <StickyRecordButton
        onClick={handleOpenAdd}
        label="Record Mortality"
        color="bg-rose-600 hover:bg-rose-700 shadow-rose-900/30"
        isModalOpen={isAddOpen || !!viewingRecord || !!deletingId}
      />

      {/* ── Record Mortality Modal Form (Add & Edit) ── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          if (!isSaving) {
            setIsAddOpen(false);
            resetForm();
          }
        }}
        title={editingRecord ? 'Edit Mortality Record' : 'Record Flock Mortality'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date *</label>
              <input
                type="date"
                required
                max={todayStr}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Farm (Current Farm Display) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm</label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{farm?.name || 'Default Farm'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Affected Flock */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Affected Flock *</label>
              <select
                required
                value={form.flockId}
                onChange={(e) => handleFlockChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.currentBirds} live birds)
                  </option>
                ))}
              </select>
            </div>

            {/* Poultry Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Poultry Type</label>
              <select
                value={form.poultryType}
                onChange={(e) => setForm({ ...form, poultryType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              >
                <option value="Broiler">Broiler</option>
                <option value="Layer">Layer</option>
                <option value="Cockerel">Cockerel</option>
                <option value="Turkey">Turkey</option>
                <option value="Duck">Duck</option>
                <option value="Quail">Quail</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Number of Dead Birds */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Number of Dead Birds *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="Count"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Suspected Cause of Death */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Suspected Cause of Death</label>
              <select
                value={form.cause}
                onChange={(e) => setForm({ ...form, cause: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
              >
                <option value="Heat Stress">Heat Stress (High Temperature)</option>
                <option value="Disease">Disease (Bacterial / Viral)</option>
                <option value="Smothering / Injury">Smothering / Trampling / Injury</option>
                <option value="Predators">Predators / Pests / Rodents</option>
                <option value="Water Deprivation">Water Deprivation / Nipple Block</option>
                <option value="Old Age">Old Age / Natural</option>
                <option value="Feed Issue">Feed Impaction / Toxicosis</option>
                <option value="Unknown">Unknown / Under Investigation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Remarks & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks & Observations</label>
            <textarea
              rows={3}
              placeholder="e.g. Birds found near pen north ventilation vents; temperature noted at 34°C."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsAddOpen(false);
                resetForm();
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={handleSubmitSaving || (isSaving)}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >{handleSubmitSaving ? 'Saving...' : <>
              {isSaving ? 'Saving…' : editingRecord ? 'Update Record' : 'Save Mortality Record'}
            </>}</button>
          </div>
        </form>
      </Modal>

      {/* ── View Record Details Modal ── */}
      {viewingRecord && (
        <Modal
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          title="Mortality Record Details"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Recorded Loss</span>
                <p className="text-2xl font-black text-rose-700">{viewingRecord.count} Birds Dead</p>
              </div>
              <Badge variant={viewingRecord.cause === 'Disease' ? 'rose' : 'amber'}>
                {viewingRecord.cause || 'Unknown'}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Date Recorded</dt>
                <dd className="font-extrabold text-slate-800 mt-0.5">{viewingRecord.date}</dd>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Flock Name</dt>
                <dd className="font-extrabold text-slate-800 mt-0.5">{viewingRecord.flockName || 'Affected Flock'}</dd>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Poultry Type</dt>
                <dd className="font-bold text-slate-800 mt-0.5">{viewingRecord.poultryType || 'Poultry'}</dd>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Farm</dt>
                <dd className="font-bold text-slate-800 mt-0.5">{farm?.name || 'My Farm'}</dd>
              </div>
            </dl>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Remarks & Observations</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {viewingRecord.notes || 'No remarks recorded for this mortality event.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingRecord;
                  setViewingRecord(null);
                  handleOpenEdit(toEdit);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
              >
                Edit This Record
              </button>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirmation Modal ── */}
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

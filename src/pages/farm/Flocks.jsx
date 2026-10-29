import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, Plus, Trash2, Eye, Edit2, Filter, AlertTriangle, CheckCircle2 } from '../../components/common/Icons';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { flockService } from '../../services/flockService';
import { ALL_FLOCK_TYPE_OPTIONS } from '../../constants/poultryTypes';
import { usePoultry } from '../../context/PoultryContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';
import StickyRecordButton from '../../components/common/StickyRecordButton';

export default function Flocks() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { flocks, currentPlan, canAddFlock, canAddBirds, metrics, refreshAllData, isSubscriptionExpired, activeFlocksCount } = useFarm();
  const { selectedTypes } = usePoultryData();
  const { activeType } = usePoultry();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [limitError, setLimitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Bird type options limited to the farmer's selected poultry types
  const flockTypeOptions = activeType ? activeType.flockTypes : selectedTypes.length > 0
    ? selectedTypes.flatMap((t) => t.flockTypes)
    : ALL_FLOCK_TYPE_OPTIONS;

  const defaultForm = {
    name: '',
    type: flockTypeOptions[0] || 'Broiler',
    breed: 'Isa Brown',
    initialBirds: 250,
    currentBirds: 250,
    ageWeeks: 1,
    costPerBird: 1000,
    pen: 'House 1',
    status: 'Active',
    acquisitionDate: new Date().toISOString().split('T')[0],
    source: 'Local Hatchery',
    notes: ''
  };

  const [form, setForm] = useState(defaultForm);

  // Auto-open via quick action (?action=record or ?action=flock)
  useEffect(() => {
    const action = params.get('action');
    if (action === 'record' || action === 'flock') {
      handleOpenAdd();
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params]);

  const handleOpenAdd = () => {
    if (isSubscriptionExpired) {
      setLimitError(`Your 14-day free trial or subscription has expired. You can view all existing flocks and records safely, but must activate a plan to create new flocks.`);
    } else if (!canAddFlock()) {
      setLimitError(`Your ${currentPlan.name} plan is limited to ${currentPlan.limits.maxFlocks} active flocks (${activeFlocksCount}/${currentPlan.limits.maxFlocks} used). Upgrade your plan to expand your capacity.`);
    } else {
      setLimitError('');
    }
    setEditingFlock(null);
    setForm(defaultForm);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (flock) => {
    setLimitError('');
    setEditingFlock(flock);
    setForm({
      name: flock.name || '',
      type: flock.type || flockTypeOptions[0] || 'Broiler',
      breed: flock.breed || '',
      initialBirds: flock.initialBirds || 0,
      currentBirds: flock.currentBirds !== undefined ? flock.currentBirds : flock.initialBirds,
      ageWeeks: flock.ageWeeks || 1,
      costPerBird: flock.costPerBird || 0,
      pen: flock.pen || flock.housingType || 'House 1',
      status: flock.status || 'Active',
      acquisitionDate: flock.acquisitionDate || flock.dateAcquired || new Date().toISOString().split('T')[0],
      source: flock.source || 'Local Hatchery',
      notes: flock.notes || ''
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Validation Error', 'Flock name is required.');
      return;
    }

    if (!editingFlock) {
      // Adding new flock validation
      if (isSubscriptionExpired) {
        setLimitError(`Subscription or trial expired. Please activate your subscription to add new flocks.`);
        return;
      }
      if (!canAddFlock()) {
        setLimitError(`Flock creation limit reached for your ${currentPlan.name} plan (${currentPlan.limits.maxFlocks} active flocks max).`);
        return;
      }
      if (!canAddBirds(Number(form.initialBirds))) {
        setLimitError(`Adding ${form.initialBirds} birds would exceed your ${currentPlan.name} plan capacity.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingFlock) {
        await flockService.update(editingFlock.id, form);
        toast.success('Flock Updated!', `${form.name} details have been updated successfully.`);
      } else {
        await flockService.create({
          ...form,
          currentBirds: Number(form.initialBirds)
        });
        toast.success('Flock Created!', `${form.name} has been added to your farm flocks.`);
      }
      await refreshAllData();
      setIsAddOpen(false);
      setEditingFlock(null);
      setLimitError('');
    } catch (err) {
      toast.error('Unable to Save Flock', err.message || 'Please check your information and try again.');
      setLimitError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await flockService.delete(deletingId);
      toast.success('Flock Deleted!', 'The flock and its records have been removed.');
      await refreshAllData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  const filteredFlocks = flocks.filter((f) => filterType === 'All' || f.type === filterType);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Plan Quota Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-600" />
              Flock Management
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
              {currentPlan.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Flock usage: <strong className="text-slate-900">{flocks.length} / {currentPlan.limits.maxFlocks === Infinity ? 'Unlimited' : currentPlan.limits.maxFlocks}</strong> flocks • Total Birds: <strong className="text-slate-900">{metrics.totalBirds.toLocaleString()} / {currentPlan.limits.maxBirds === Infinity ? 'Unlimited' : currentPlan.limits.maxBirds.toLocaleString()}</strong>
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Flock
        </button>
      </div>

      {/* Filter Tabs — driven by the farmer's selected poultry types */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', ...flockTypeOptions].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === t
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t} Flocks {t === 'All' ? `(${flocks.length})` : `(${flocks.filter((f) => f.type === t).length})`}
          </button>
        ))}
      </div>

      {/* Flock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFlocks.map((flock) => {
          const init = Number(flock.initialBirds) || 1;
          const curr = Number(flock.currentBirds) !== undefined ? Number(flock.currentBirds) : init;
          const mortalityRate = (((init - curr) / init) * 100).toFixed(1);
          return (
            <div
              key={flock.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{flock.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{flock.breed} • {flock.pen || flock.housingType || 'Pen 1'}</p>
                  </div>
                  <Badge variant={flock.type === 'Layer' ? 'green' : flock.type === 'Broiler' ? 'blue' : 'amber'}>
                    {flock.type}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Live Birds</span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">{curr.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-400">Initial: {init.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Flock Age</span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">{flock.ageWeeks || 1} wks</p>
                    <span className="text-[10px] text-rose-500 font-semibold">Mortality: {mortalityRate}%</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-600 space-y-1">
                  <p><strong>Status:</strong> <span className={`font-semibold ${flock.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>{flock.status || 'Active'}</span></p>
                  <p><strong>Source:</strong> {flock.source || 'Local Hatchery'}</p>
                  <p><strong>Acquired:</strong> {flock.dateAcquired || flock.acquisitionDate || '—'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/farm/flocks/${flock.id}`)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(flock)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit Flock"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(flock.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Flock"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFlocks.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Flocks Recorded Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6 max-w-sm mx-auto leading-relaxed">
            Get started by adding your first batch of birds. You will be able to track bird count, mortality, feed intake, and egg production.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            + Add Your First Flock
          </button>
        </div>
      )}

      {/* Add / Edit Flock Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); setLimitError(''); }}
        title={editingFlock ? 'Update Flock Details' : 'Create New Flock'}
      >
        {limitError && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <p className="font-extrabold text-amber-950 mb-1">⚠️ Plan Tier Limit Reached</p>
            <p className="leading-relaxed">{limitError}</p>
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                navigate('/settings/subscription');
              }}
              className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flock Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Layer Batch C, Broiler Pen 2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bird Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              >
                {flockTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Breed *</label>
              <input
                type="text"
                required
                placeholder="e.g. Isa Brown, Cobb 500, Marshall"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {editingFlock ? 'Live Birds Population *' : 'Initial Birds Count *'}
              </label>
              <input
                type="number"
                required
                min="1"
                value={editingFlock ? form.currentBirds : form.initialBirds}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (editingFlock) {
                    setForm({ ...form, currentBirds: val });
                  } else {
                    setForm({ ...form, initialBirds: val, currentBirds: val });
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Age (Weeks)</label>
              <input
                type="number"
                min="0"
                value={form.ageWeeks}
                onChange={(e) => setForm({ ...form, ageWeeks: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Pen / House / Cage</label>
              <input
                type="text"
                placeholder="e.g. Pen 1, House A"
                value={form.pen}
                onChange={(e) => setForm({ ...form, pen: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Per Bird (₦)</label>
              <input
                type="number"
                min="0"
                value={form.costPerBird}
                onChange={(e) => setForm({ ...form, costPerBird: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {editingFlock && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flock Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Active">Active</option>
                <option value="Culled">Culled</option>
                <option value="Sold">Sold</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Hatchery / Source</label>
            <input
              type="text"
              placeholder="e.g. CHI Farms, Zartech, Amo Hatchery"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Flock vaccination history, batch notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsAddOpen(false); setLimitError(''); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {isSaving ? 'Saving...' : editingFlock ? 'Save Flock Changes' : 'Create Flock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Flock Record"
        message="Are you sure you want to permanently delete this flock? This action will remove all historical production records associated with it."
      />

      {/* Mobile Sticky Action Button */}
      <StickyRecordButton
        label="Add Flock"
        onClick={handleOpenAdd}
        isModalOpen={isAddOpen || !!deletingId}
      />
    </div>
  );
}

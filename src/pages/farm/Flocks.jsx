import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Trash2, Eye, Filter } from 'lucide-react';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { flockService } from '../../services/flockService';
import { POULTRY_TYPE_MAP, ALL_FLOCK_TYPE_OPTIONS } from '../../constants/poultryTypes';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Flocks() {
  const { flocks, currentPlan, canAddFlock, canAddBirds, metrics, refreshAllData } = useFarm();
  const { selectedTypes } = usePoultryData();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [limitError, setLimitError] = useState('');

  // Bird type options limited to the farmer's selected poultry types
  const flockTypeOptions = selectedTypes.length > 0
    ? selectedTypes.flatMap((t) => t.flockTypes)
    : ALL_FLOCK_TYPE_OPTIONS;

  const [form, setForm] = useState({
    name: '',
    type: flockTypeOptions[0] || 'Broiler',
    breed: 'Isa Brown',
    initialBirds: 250,
    costPerBird: 1000,
    pen: 'House 1',
    source: 'Local Hatchery',
    notes: ''
  });

  const filteredFlocks = flocks.filter((f) => filterType === 'All' || f.type === filterType);

  const handleOpenAdd = () => {
    if (!canAddFlock()) {
      setLimitError(`Your ${currentPlan.name} plan is limited to ${currentPlan.limits.maxFlocks} flocks. Upgrade to Basic (₦5,000/mo) for up to 10 flocks or Pro (₦15,000/mo) for unlimited flocks.`);
    } else {
      setLimitError('');
    }
    setIsAddOpen(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!canAddFlock()) {
      setLimitError(`Flock creation limit reached for your ${currentPlan.name} plan (${currentPlan.limits.maxFlocks} flocks max). Please upgrade to add more flocks.`);
      return;
    }

    if (!canAddBirds(form.initialBirds)) {
      setLimitError(`Adding ${form.initialBirds} birds would exceed your ${currentPlan.name} plan capacity (${metrics.totalBirds + Number(form.initialBirds)} / ${currentPlan.limits.maxBirds} max birds). Upgrade to Basic (₦5,000/mo) for up to 5,000 birds.`);
      return;
    }

    flockService.create(form);
    refreshAllData();
    setIsAddOpen(false);
    setLimitError('');
    setForm({ name: '', type: 'Layer', breed: 'Isa Brown', initialBirds: 250, costPerBird: 1000, pen: 'House 1', source: 'Local Hatchery', notes: '' });
  };

  const handleDelete = () => {
    if (deletingId) {
      flockService.delete(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

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
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
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
          const mortalityRate = (((flock.initialBirds - flock.currentBirds) / flock.initialBirds) * 100).toFixed(1);
          return (
            <div
              key={flock.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{flock.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{flock.breed} • {flock.pen}</p>
                  </div>
                  <Badge variant={flock.type === 'Layer' ? 'green' : flock.type === 'Broiler' ? 'blue' : 'amber'}>
                    {flock.type}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Live Birds</span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">{flock.currentBirds.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-400">Initial: {flock.initialBirds.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Flock Age</span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">{flock.ageWeeks || 12} wks</p>
                    <span className="text-[10px] text-rose-500 font-semibold">Mortality: {mortalityRate}%</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-600 space-y-1">
                  <p><strong>Source:</strong> {flock.source || 'Local Hatchery'}</p>
                  <p><strong>Acquired:</strong> {flock.dateAcquired}</p>
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
                <button
                  onClick={() => setDeletingId(flock.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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

      {/* Add Flock Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Flock">
        {limitError && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <p className="font-extrabold text-amber-950 mb-1">⚠️ Plan Tier Limit Reached</p>
            <p className="leading-relaxed">{limitError}</p>
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                navigate('/settings');
              }}
              className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Go to Subscription Settings →
            </button>
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flock Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Layer Batch C"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bird Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                {flockTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Breed</label>
              <input
                type="text"
                required
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Birds</label>
              <input
                type="number"
                required
                min="1"
                value={form.initialBirds}
                onChange={(e) => setForm({ ...form, initialBirds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Per Bird (₦)</label>
              <input
                type="number"
                required
                min="0"
                value={form.costPerBird}
                onChange={(e) => setForm({ ...form, costPerBird: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Flock
          </button>
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
    </div>
  );
}

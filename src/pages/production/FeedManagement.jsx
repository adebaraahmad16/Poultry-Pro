import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wheat, Plus, MinusCircle, Trash2, Edit2, AlertTriangle, Filter, CheckCircle2 } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { feedService } from '../../services/productionService';
import { dailyRecordMutations } from '../../services/supabase/mutationService.js';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function FeedManagement() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { feeds, flocks, dailyRecords, refreshAllData, selectedFarmId, farm } = useFarm();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'feeding'
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isFeedingModalOpen, setIsFeedingModalOpen] = useState(false);
  const [editingFeedItem, setEditingFeedItem] = useState(null);
  const [editingDailyRecord, setEditingDailyRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingType, setDeletingType] = useState('stock'); // 'stock' | 'feeding'
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [flockFilter, setFlockFilter] = useState('all');

  // Stock Form
  const defaultStockForm = {
    name: '',
    type: 'Layer Mash',
    quantityBags: '',
    bagWeightKg: 25,
    unitPrice: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    minStockThresholdBags: 10,
    notes: ''
  };
  const [stockForm, setStockForm] = useState(defaultStockForm);

  // Feeding Form
  const defaultFeedingForm = {
    flockId: flocks[0]?.id || '',
    feedType: feeds[0]?.name || feeds[0]?.type || 'Layer Mash',
    consumedKg: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };
  const [feedingForm, setFeedingForm] = useState(defaultFeedingForm);

  // Quick Action auto-opening
  useEffect(() => {
    const action = params.get('action');
    if (action === 'feed' || action === 'record') {
      const flockParam = params.get('flockId');
      if (flockParam && flocks.some(f => f.id === flockParam)) {
        setFeedingForm(prev => ({ ...prev, flockId: flockParam }));
      }
      setActiveTab('feeding');
      setIsFeedingModalOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    } else if (action === 'stock') {
      setActiveTab('inventory');
      setIsStockModalOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params, flocks, feeds]);

  const resetStockForm = () => {
    setStockForm(defaultStockForm);
    setEditingFeedItem(null);
  };

  const resetFeedingForm = () => {
    setFeedingForm({
      flockId: flocks[0]?.id || '',
      feedType: feeds[0]?.name || feeds[0]?.type || 'Layer Mash',
      consumedKg: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingDailyRecord(null);
  };

  const handleOpenAddStock = () => {
    resetStockForm();
    setIsStockModalOpen(true);
  };

  const handleOpenEditStock = (item) => {
    setEditingFeedItem(item);
    setStockForm({
      name: item.name || '',
      type: item.type || item.feedType || 'Layer Mash',
      quantityBags: item.quantityBags ?? item.quantity_bags ?? '',
      bagWeightKg: item.bagWeightKg ?? item.bag_weight_kg ?? 25,
      unitPrice: item.unitPrice ?? item.cost_per_bag ?? '',
      supplier: item.supplier || '',
      date: item.date || new Date().toISOString().split('T')[0],
      minStockThresholdBags: item.minStockThresholdBags || 10,
      notes: item.notes || ''
    });
    setIsStockModalOpen(true);
  };

  const handleOpenAddFeeding = () => {
    resetFeedingForm();
    setIsFeedingModalOpen(true);
  };

  const handleOpenEditFeeding = (record) => {
    setEditingDailyRecord(record);
    setFeedingForm({
      flockId: record.flockId || flocks[0]?.id || '',
      feedType: record.values?.feedType || 'Layer Mash',
      consumedKg: record.values?.consumedKg || '',
      date: record.date || new Date().toISOString().split('T')[0],
      notes: record.values?.notes || ''
    });
    setIsFeedingModalOpen(true);
  };

  // Stock Form Submission
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockForm.name.trim()) {
      toast.error('Feed name is required.', { title: 'Validation Error' });
      return;
    }
    if (Number(stockForm.quantityBags) < 0) {
      toast.error('Quantity cannot be negative.', { title: 'Validation Error' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: stockForm.name.trim(),
        type: stockForm.type,
        feedType: stockForm.type,
        quantityBags: Number(stockForm.quantityBags || 0),
        bagWeightKg: Number(stockForm.bagWeightKg || 25),
        costPerBag: Number(stockForm.unitPrice || 0),
        unitPrice: Number(stockForm.unitPrice || 0),
        supplier: stockForm.supplier || '',
        date: stockForm.date,
        minStockThresholdBags: Number(stockForm.minStockThresholdBags || 10),
        status: Number(stockForm.quantityBags) <= Number(stockForm.minStockThresholdBags || 10) ? 'Low Stock' : 'In Stock',
        notes: stockForm.notes || ''
      };

      if (editingFeedItem) {
        await feedService.updateFeedItem(editingFeedItem.id, payload);
        toast.success('Feed stock item updated successfully.', { title: 'Stock Updated!' });
      } else {
        await feedService.addFeedItem(payload);
        toast.success('Feed stock item added to inventory.', { title: 'Feed Stock Added!' });
      }

      await refreshAllData();
      setIsStockModalOpen(false);
      resetStockForm();
    } catch (err) {
      console.error('Error saving feed stock:', err);
      toast.error(err.message || 'Unable to save feed stock.', { title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  // Feeding Form Submission
  const handleFeedingSubmit = async (e) => {
    e.preventDefault();
    if (!feedingForm.flockId && flocks.length > 0) {
      toast.error('Please select a target flock.', { title: 'Validation Error' });
      return;
    }
    const kg = Number(feedingForm.consumedKg);
    if (!kg || kg <= 0) {
      toast.error('Quantity consumed must be greater than zero kg.', { title: 'Validation Error' });
      return;
    }

    setIsSaving(true);
    try {
      const farmId = selectedFarmId || farm?.id;
      const targetFlock = flocks.find(f => f.id === feedingForm.flockId) || flocks[0];
      const payload = {
        farmId,
        flockId: feedingForm.flockId,
        date: feedingForm.date,
        category: 'feed',
        poultryType: targetFlock?.type || 'all',
        status: 'Recorded',
        values: {
          feedType: feedingForm.feedType,
          consumedKg: kg,
          notes: feedingForm.notes || ''
        }
      };

      if (editingDailyRecord) {
        await dailyRecordMutations.update(farmId, editingDailyRecord.id, payload);
        toast.success('Feeding record updated successfully.', { title: 'Feeding Updated!' });
      } else {
        await dailyRecordMutations.create(farmId, payload);
        toast.success(`${kg} kg feeding recorded for ${targetFlock?.name || 'flock'}.`, { title: 'Feeding Recorded!' });
      }

      await refreshAllData();
      setIsFeedingModalOpen(false);
      resetFeedingForm();
    } catch (err) {
      console.error('Error saving feeding record:', err);
      toast.error(err.message || 'Unable to save feeding record.', { title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      if (deletingType === 'stock') {
        await feedService.deleteFeedItem(deletingId);
        toast.success('Feed stock item removed from inventory.', { title: 'Stock Item Deleted' });
      } else {
        const farmId = selectedFarmId || farm?.id;
        await dailyRecordMutations.delete(farmId, deletingId);
        toast.success('Feeding activity log deleted.', { title: 'Feeding Log Deleted' });
      }
      await refreshAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculations
  const totalBags = feeds.reduce((s, f) => s + Number(f.quantityBags || 0), 0);
  const totalKg = feeds.reduce((s, f) => s + Number(f.quantityBags || 0) * Number(f.bagWeightKg || 25), 0);
  const lowStockCount = feeds.filter(f => Number(f.quantityBags || 0) <= Number(f.minStockThresholdBags || 10)).length;

  const feedingLogs = dailyRecords.filter(r => r.category === 'feed' && r.status === 'Recorded');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFeedingKg = feedingLogs.filter(r => r.date === todayStr).reduce((s, r) => s + Number(r.values?.consumedKg || 0), 0);

  // Filtered lists
  const filteredFeeds = feeds.filter(f => {
    if (typeFilter !== 'all' && (f.type !== typeFilter && f.name !== typeFilter)) return false;
    return true;
  });

  const filteredFeedingLogs = feedingLogs.filter(r => {
    if (flockFilter !== 'all' && r.flockId !== flockFilter) return false;
    return true;
  });

  const stockColumns = [
    { header: 'Feed Name & Brand', accessor: 'name' },
    { header: 'Feed Type', accessor: 'type' },
    {
      header: 'Available Stock',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800">{Number(r.quantityBags || 0).toLocaleString()} Bags</span>
          <span className="block text-xs text-slate-400">({(Number(r.quantityBags || 0) * Number(r.bagWeightKg || 25)).toLocaleString()} kg)</span>
        </div>
      )
    },
    {
      header: 'Cost / Bag',
      render: (r) => `₦${Number(r.costPerBag || r.unitPrice || 0).toLocaleString()}`
    },
    { header: 'Supplier', accessor: 'supplier' },
    {
      header: 'Stock Status',
      render: (r) => {
        const isLow = Number(r.quantityBags || 0) <= Number(r.minStockThresholdBags || 10);
        return <Badge variant={isLow ? 'amber' : 'green'}>{isLow ? 'Low Stock' : 'Healthy'}</Badge>;
      }
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEditStock(r)}
            title="Edit Stock"
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setDeletingId(r.id); setDeletingType('stock'); }}
            title="Delete Stock Item"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const feedingColumns = [
    { header: 'Date', accessor: 'date' },
    {
      header: 'Flock Name',
      render: (r) => {
        const fl = flocks.find(f => f.id === r.flockId);
        return <span className="font-semibold text-slate-800">{fl?.name || 'Target Flock'}</span>;
      }
    },
    {
      header: 'Feed Type',
      render: (r) => <span className="font-medium text-slate-700">{r.values?.feedType || 'General Feed'}</span>
    },
    {
      header: 'Quantity Consumed',
      render: (r) => <span className="font-extrabold text-emerald-700">{Number(r.values?.consumedKg || 0).toLocaleString()} kg</span>
    },
    {
      header: 'Bags Equivalent',
      render: (r) => <span className="text-xs text-slate-500">~{(Number(r.values?.consumedKg || 0) / 25).toFixed(1)} Bags (25kg)</span>
    },
    {
      header: 'Remarks',
      render: (r) => <span className="text-xs text-slate-500">{r.values?.notes || '—'}</span>
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEditFeeding(r)}
            title="Edit Feeding Log"
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setDeletingId(r.id); setDeletingType('feeding'); }}
            title="Delete Feeding Log"
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
            <Wheat className="w-6 h-6 text-emerald-600" />
            Feed Management & Feeding Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage feed inventory purchases, track store bags, and record daily pen feeding directly on this dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenAddFeeding}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Record Feeding
          </button>
          <button
            onClick={handleOpenAddStock}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Add Feed Stock
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Available Feed Bags</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalBags.toLocaleString()} Bags</p>
          <p className="text-xs text-slate-500 mt-1">{totalKg.toLocaleString()} kg total store weight</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Today's Consumption</span>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{todayFeedingKg.toLocaleString()} kg</p>
          <p className="text-xs text-slate-500 mt-1">Fed to active flocks today</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Low Stock Alerts</span>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{lowStockCount} Items</p>
          <p className="text-xs text-slate-500 mt-1">{lowStockCount > 0 ? 'Requires replenishment' : 'All items well stocked'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Feeding Logs</span>
          <p className="text-3xl font-extrabold text-blue-700 mt-1">{feedingLogs.length}</p>
          <p className="text-xs text-slate-500 mt-1">Historical flock feeding events</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Feed Inventory & Stock ({feeds.length})
        </button>
        <button
          onClick={() => setActiveTab('feeding')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'feeding'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Feeding Logs ({feedingLogs.length})
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Store Feed Inventory</h3>
            <button
              onClick={handleOpenAddStock}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              + Add Feed Stock / Purchase
            </button>
          </div>
          <DataTable
            columns={stockColumns}
            data={filteredFeeds}
            searchPlaceholder="Search feed inventory by brand or type..."
            emptyTitle="No feed stock records found"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Daily Feeding Records</h3>
            <button
              onClick={handleOpenAddFeeding}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              + Record Daily Feeding
            </button>
          </div>
          <DataTable
            columns={feedingColumns}
            data={filteredFeedingLogs}
            searchPlaceholder="Search feeding records by flock or feed type..."
            emptyTitle="No daily feeding records found"
          />
        </div>
      )}

      {/* Modal 1: Add/Edit Feed Stock */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => { if (!isSaving) { setIsStockModalOpen(false); resetStockForm(); } }}
        title={editingFeedItem ? "Edit Feed Stock Item" : "Add Feed Stock / Purchase"}
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feed Name / Brand *</label>
              <input
                type="text"
                required
                placeholder="e.g. TopFeed Broiler Starter"
                value={stockForm.name}
                onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feed Type *</label>
              <select
                value={stockForm.type}
                onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Broiler Starter">Broiler Starter</option>
                <option value="Broiler Grower">Broiler Grower</option>
                <option value="Broiler Finisher">Broiler Finisher</option>
                <option value="Chick Mash">Chick Mash</option>
                <option value="Grower Mash">Grower Mash</option>
                <option value="Layer Mash">Layer Mash</option>
                <option value="Custom Farm Mix">Custom Farm Mix</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity (Bags) *</label>
              <input
                type="number"
                min="0"
                required
                placeholder="Bags"
                value={stockForm.quantityBags}
                onChange={(e) => setStockForm({ ...stockForm, quantityBags: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bag Weight (kg)</label>
              <input
                type="number"
                min="1"
                placeholder="25"
                value={stockForm.bagWeightKg}
                onChange={(e) => setStockForm({ ...stockForm, bagWeightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Price / Bag ({farm.currency || '₦'})</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={stockForm.unitPrice}
                onChange={(e) => setStockForm({ ...stockForm, unitPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier / Feed Mill</label>
              <input
                type="text"
                placeholder="e.g. Animal Care Feeds Ltd"
                value={stockForm.supplier}
                onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Stock Date</label>
              <input
                type="date"
                value={stockForm.date}
                onChange={(e) => setStockForm({ ...stockForm, date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Low Stock Warning Threshold (Bags)</label>
            <input
              type="number"
              min="1"
              value={stockForm.minStockThresholdBags}
              onChange={(e) => setStockForm({ ...stockForm, minStockThresholdBags: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => { setIsStockModalOpen(false); resetStockForm(); }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSaving ? 'Saving…' : editingFeedItem ? 'Update Stock' : 'Save Feed Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Daily Feeding */}
      <Modal
        isOpen={isFeedingModalOpen}
        onClose={() => { if (!isSaving) { setIsFeedingModalOpen(false); resetFeedingForm(); } }}
        title={editingDailyRecord ? "Edit Feeding Log" : "Record Daily Flock Feeding"}
      >
        <form onSubmit={handleFeedingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feeding Date *</label>
              <input
                type="date"
                required
                max={todayStr}
                value={feedingForm.date}
                onChange={(e) => setFeedingForm({ ...feedingForm, date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Flock *</label>
              <select
                required
                value={feedingForm.flockId}
                onChange={(e) => setFeedingForm({ ...feedingForm, flockId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {flocks.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.type} • {f.currentBirds} birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feed Type Consumed *</label>
              <select
                value={feedingForm.feedType}
                onChange={(e) => setFeedingForm({ ...feedingForm, feedType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {feeds.map((f) => (
                  <option key={f.id} value={f.name || f.type}>{f.name} ({f.type})</option>
                ))}
                <option value="Broiler Starter">Broiler Starter</option>
                <option value="Broiler Finisher">Broiler Finisher</option>
                <option value="Layer Mash">Layer Mash</option>
                <option value="Grower Mash">Grower Mash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity Consumed (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="e.g. 50"
                value={feedingForm.consumedKg}
                onChange={(e) => setFeedingForm({ ...feedingForm, consumedKg: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks & Feeding Notes</label>
            <input
              type="text"
              placeholder="e.g. Morning and evening rations cleared completely."
              value={feedingForm.notes}
              onChange={(e) => setFeedingForm({ ...feedingForm, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => { setIsFeedingModalOpen(false); resetFeedingForm(); }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSaving ? 'Saving…' : editingDailyRecord ? 'Update Feeding' : 'Save Feeding Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title={deletingType === 'stock' ? "Delete Feed Item" : "Delete Feeding Record"}
        message={
          deletingType === 'stock'
            ? "Are you sure you want to delete this feed inventory item from store records?"
            : "Are you sure you want to remove this flock feeding activity record?"
        }
      />
    </div>
  );
}

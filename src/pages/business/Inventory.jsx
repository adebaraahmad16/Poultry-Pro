import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Plus, Trash2, Edit2, ArrowDownRight, ArrowUpRight, AlertTriangle, Filter, CheckCircle2, DollarSign } from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { inventoryService } from '../../services/businessService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { inventory, refreshAllData } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const defaultForm = {
    name: '',
    category: 'Equipment',
    quantity: 10,
    unit: 'pcs',
    minStock: 5,
    supplier: '',
    cost: '',
    notes: ''
  };

  const [form, setForm] = useState(defaultForm);

  const defaultMovement = {
    itemId: inventory[0]?.id || '',
    type: 'usage', // 'usage' or 'addition'
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  const [movementForm, setMovementForm] = useState(defaultMovement);

  // Auto-open via quick actions
  useEffect(() => {
    const action = params.get('action');
    if (action === 'record' || action === 'inventory') {
      setIsAddOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    } else if (action === 'movement') {
      setIsMovementOpen(true);
      params.delete('action');
      setParams(params, { replace: true });
    }
  }, [params]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingRecord(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setForm({
      name: item.name || '',
      category: item.category || 'Equipment',
      quantity: item.quantity || 0,
      unit: item.unit || 'pcs',
      minStock: item.minStock || 5,
      supplier: item.supplier || '',
      cost: item.cost || '',
      notes: item.notes || ''
    });
    setIsAddOpen(true);
  };

  const handleOpenMovement = (item = null) => {
    setMovementForm({
      itemId: item ? item.id : (inventory[0]?.id || ''),
      type: 'usage',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsMovementOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Validation Error', 'Item name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRecord) {
        inventoryService.updateItem(editingRecord.id, form);
        toast.success('Item Updated!', `${form.name} details have been updated.`);
      } else {
        inventoryService.addItem(form);
        toast.success('Item Added!', `${form.name} has been added to farm inventory.`);
      }
      refreshAllData();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to save', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMovement = async (e) => {
    e.preventDefault();
    const qty = Number(movementForm.quantity);
    if (!movementForm.itemId) {
      toast.error('Validation Error', 'Please select an inventory item.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toast.error('Validation Error', 'Please enter a valid quantity.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedItem = inventory.find(i => i.id === movementForm.itemId);
      inventoryService.recordMovement(movementForm.itemId, qty, movementForm.type, movementForm.notes);
      toast.success(
        movementForm.type === 'addition' ? 'Stock Added!' : 'Stock Usage Recorded!',
        `${qty} ${selectedItem?.unit || 'units'} ${movementForm.type === 'addition' ? 'added to' : 'deducted from'} ${selectedItem?.name || 'inventory'}.`
      );
      refreshAllData();
      setIsMovementOpen(false);
    } catch (err) {
      toast.error('Movement Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    try {
      inventoryService.deleteItem(deletingId);
      toast.success('Item Deleted!', 'The inventory item has been removed.');
      refreshAllData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  // Filtered inventory
  const filteredInventory = (inventory || []).filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  // KPIs
  const totalItems = (inventory || []).length;
  const lowStockCount = (inventory || []).filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = (inventory || []).filter(i => Number(i.quantity) === 0 || i.status === 'Out of Stock').length;
  const totalInvValue = (inventory || []).reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.cost) || 0)), 0);

  const columns = [
    {
      header: 'Item Name',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{r.name}</span>
          {r.lastMovement && (
            <p className="text-2xs text-slate-400 mt-0.5">
              Last movement: {r.lastMovement.type === 'addition' ? '+' : '-'}{r.lastMovement.quantity} on {r.lastMovement.date}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      render: (r) => <Badge variant="slate">{r.category || 'General'}</Badge>
    },
    {
      header: 'Stock Level',
      render: (r) => (
        <div>
          <span className="font-extrabold text-slate-900">{r.quantity} {r.unit || 'pcs'}</span>
          <span className="text-2xs text-slate-400 block">Min: {r.minStock || 5}</span>
        </div>
      )
    },
    {
      header: 'Est. Unit Cost',
      render: (r) => `₦${(Number(r.cost) || 0).toLocaleString()}`
    },
    {
      header: 'Total Value',
      render: (r) => <span className="font-bold text-emerald-700">₦{((Number(r.quantity) || 0) * (Number(r.cost) || 0)).toLocaleString()}</span>
    },
    {
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'In Stock' ? 'green' : r.status === 'Low Stock' ? 'amber' : 'rose'}>
          {r.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenMovement(r)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Record Stock Movement"
          >
            <ArrowDownRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit Item"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(r.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Item"
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
            <Package className="w-6 h-6 text-emerald-600" />
            Farm Inventory & Equipment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track feeders, drinkers, egg trays, medications, packaging, and farm supplies.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => handleOpenMovement()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4 text-slate-600" />
            Record Movement
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Inventory Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Tracked Items</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalItems}</p>
          <p className="text-2xs text-slate-500 mt-1">Active inventory lines</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Estimated Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₦{totalInvValue.toLocaleString()}</p>
          <p className="text-2xs text-slate-500 mt-1">Total stock valuation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{lowStockCount}</p>
          <p className="text-2xs text-slate-500 mt-1">At or below reorder level</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{outOfStockCount}</p>
          <p className="text-2xs text-slate-500 mt-1">Needs urgent replenishment</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Categories</option>
          <option value="Equipment">Equipment</option>
          <option value="Packaging materials">Packaging materials</option>
          <option value="Farm supplies">Farm supplies</option>
          <option value="Vaccines & Meds">Vaccines & Meds</option>
          <option value="Feed & Ingredients">Feed & Ingredients</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Stock Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        {(categoryFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredInventory}
        searchPlaceholder="Search inventory by item or category..."
        emptyTitle="No inventory items found"
      />

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetForm(); }}
        title={editingRecord ? 'Edit Inventory Item' : 'Add Inventory Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Automatic Bell Drinkers, 30-egg Paper Trays"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Equipment">Equipment</option>
                <option value="Packaging materials">Packaging materials</option>
                <option value="Farm supplies">Farm supplies</option>
                <option value="Vaccines & Meds">Vaccines & Meds</option>
                <option value="Feed & Ingredients">Feed & Ingredients</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit of Measure</label>
              <input
                type="text"
                placeholder="e.g. pcs, bundles, bottles, bags"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Current Quantity *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Low Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Est. Unit Cost (₦)</label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier / Vendor</label>
            <input
              type="text"
              placeholder="e.g. AgroTech Nigeria, Premier Veterinary"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsAddOpen(false); resetForm(); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {isSaving ? 'Saving...' : editingRecord ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Stock Movement Modal */}
      <Modal
        isOpen={isMovementOpen}
        onClose={() => setIsMovementOpen(false)}
        title="Record Stock Movement"
      >
        <form onSubmit={handleSaveMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Inventory Item *</label>
            <select
              required
              value={movementForm.itemId}
              onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select an item...</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Current: {item.quantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Movement Type *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'usage' })}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    movementForm.type === 'usage'
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Stock Usage
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'addition' })}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    movementForm.type === 'addition'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Restock Addition
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Movement Date *</label>
              <input
                type="date"
                required
                value={movementForm.date}
                onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity *</label>
            <input
              type="number"
              required
              min="0.1"
              step="any"
              placeholder="Quantity used or received"
              value={movementForm.quantity}
              onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Distributed 20 feeders to Pen B, restock from manufacturer..."
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMovementOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {isSaving ? 'Recording...' : 'Record Movement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to remove this item from your inventory? This action cannot be undone."
      />
    </div>
  );
}

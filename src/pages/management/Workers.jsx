import React, { useState } from 'react';
import { UserCheck, Plus, Trash2, Phone, Mail } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { workerService } from '../../services/managementService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Workers() {
  const { workers, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Farm Worker',
    assignedPen: 'House 1 & 2'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    workerService.addWorker(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      workerService.deleteWorker(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = [
    { header: 'Worker Name', accessor: 'name' },
    { header: 'Role', render: (r) => <Badge variant="blue">{r.role}</Badge> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    { header: 'Assigned Pen', accessor: 'assignedPen' },
    { header: 'Status', render: (r) => <Badge variant="green">{r.status}</Badge> },
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
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Worker & Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage farm staff directory, roles, and assigned pen locations.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Farm Worker
        </button>
      </div>

      <DataTable columns={columns} data={workers} searchPlaceholder="Search workers..." emptyTitle="No workers found" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Staff Member">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Suleiman Ibrahim"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Farm Manager">Farm Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Farm Worker">Farm Worker</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Pen</label>
              <input
                type="text"
                required
                value={form.assignedPen}
                onChange={(e) => setForm({ ...form, assignedPen: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
            Save Staff Member
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Worker" message="Are you sure?" />
    </div>
  );
}

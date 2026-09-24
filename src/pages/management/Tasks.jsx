import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { taskService } from '../../services/managementService';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

export default function Tasks() {
  const { tasks, workers, refreshAllData } = useFarm();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    assignedTo: workers[0]?.name || 'Suleiman Ibrahim',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'High',
    status: 'Pending',
    notes: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    taskService.addTask(form);
    refreshAllData();
    setIsAddOpen(false);
  };

  const handleMoveStatus = (id, newStatus) => {
    taskService.updateTaskStatus(id, newStatus);
    refreshAllData();
  };

  const handleDelete = () => {
    if (deletingId) {
      taskService.deleteTask(deletingId);
      refreshAllData();
      setDeletingId(null);
    }
  };

  const columns = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            Task Management Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Assign daily routines to farm staff and monitor completion progress.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Interactive Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((colStatus) => {
          const colTasks = tasks.filter((t) => t.status === colStatus);
          return (
            <div key={colStatus} className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-slate-800 text-sm">{colStatus}</h3>
                <span className="px-2 py-0.5 bg-white text-slate-700 font-bold text-xs rounded-full border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>
                      <button onClick={() => setDeletingId(task.id)} className="p-1 text-slate-300 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">Assigned: <strong className="text-slate-700">{task.assignedTo}</strong></p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Badge variant={task.priority === 'Urgent' ? 'rose' : task.priority === 'High' ? 'amber' : 'blue'}>
                        {task.priority}
                      </Badge>

                      <div className="flex items-center gap-1">
                        {colStatus !== 'Pending' && (
                          <button
                            onClick={() => handleMoveStatus(task.id, colStatus === 'Completed' ? 'In Progress' : 'Pending')}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                          >
                            ← Prev
                          </button>
                        )}
                        {colStatus !== 'Completed' && (
                          <button
                            onClick={() => handleMoveStatus(task.id, colStatus === 'Pending' ? 'In Progress' : 'Completed')}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-800"
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Feed Layer Batch B (Morning Feed)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned To</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.name}>{w.name} ({w.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Task
          </button>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete} title="Delete Task" message="Are you sure?" />
    </div>
  );
}

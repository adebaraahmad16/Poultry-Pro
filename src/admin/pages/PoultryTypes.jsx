import React, { useState } from 'react';
import { Bird, Plus, CheckCircle2, XCircle, Info, Sparkles } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import StatusBadge from '../components/StatusBadge';

export default function PoultryTypes() {
  const { categories, toggleCategoryStatus } = useAdmin();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    description: '',
    status: 'Active'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    alert(`Category "${form.name}" registered. In production mode this registers the poultry category.`);
    setIsAddOpen(false);
    setForm({ name: '', purpose: '', description: '', status: 'Active' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Poultry Types & Categories Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure the 9 commercial poultry categories supported on PoultryPro. Enable or disable new registrations across farms.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Grid of 9 Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                    <Bird className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                      {cat.purpose}
                    </span>
                  </div>
                </div>
                <StatusBadge variant={cat.status}>{cat.status}</StatusBadge>
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 text-center pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Farms</span>
                  <span className="text-sm font-extrabold text-slate-800">{cat.registeredFarms}</span>
                </div>
                <div className="border-x border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Flocks</span>
                  <span className="text-sm font-extrabold text-slate-800">{cat.totalFlocks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Birds</span>
                  <span className="text-sm font-extrabold text-emerald-800">
                    {(cat.totalBirds || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => toggleCategoryStatus(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    cat.status === 'Active'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {cat.status === 'Active' ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Disable Registrations
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enable Category
                    </>
                  )}
                </button>
                <span className="text-[11px] font-mono text-slate-400">ID: {cat.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Add Poultry Category</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ostrich, Partridge"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Production Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meat & Feathers Production"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description & Characteristics</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe breed characteristics and farmer monitoring modules..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#15803D] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

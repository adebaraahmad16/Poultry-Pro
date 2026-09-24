import React, { useState } from 'react';
import { Building2, MapPin, Users, Layers, Bird, Calendar, Edit3, ShieldCheck } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { farmProfileService } from '../../services/managementService';
import Modal from '../../components/common/Modal';

export default function FarmOverview() {
  const { farm, flocks, workers, metrics, refreshAllData } = useFarm();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: farm.name || '',
    location: farm.location || '',
    type: farm.type || '',
    size: farm.size || '',
    currency: farm.currency || '₦'
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    farmProfileService.updateFarm(formData);
    refreshAllData();
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-2xl border border-emerald-200 shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{farm.name}</h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                Active Farm
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {farm.location}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: farm.name,
              location: farm.location,
              type: farm.type,
              size: farm.size,
              currency: farm.currency
            });
            setIsEditOpen(true);
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Farm Profile
        </button>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold uppercase">Total Flocks</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{flocks.length}</p>
          <p className="text-xs text-slate-500 mt-1">Layer & Broiler Batches</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Bird className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold uppercase">Live Bird Population</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{metrics.totalBirds.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Housed across 5 Pens</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold uppercase">Farm Workers</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{workers.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active staff on duty</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-semibold uppercase">Established</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{farm.createdAt || '2024-01-15'}</p>
          <p className="text-xs text-slate-500 mt-1">Fully Registered</p>
        </div>
      </div>

      {/* Farm Details Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-lg mb-4 border-b border-slate-100 pb-3">Farm Operational Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Farm Name</span>
            <p className="text-slate-800 font-semibold mt-0.5">{farm.name}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Physical Address</span>
            <p className="text-slate-800 font-semibold mt-0.5">{farm.location}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Production Type</span>
            <p className="text-slate-800 font-semibold mt-0.5">{farm.type}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Farm Land Size</span>
            <p className="text-slate-800 font-semibold mt-0.5">{farm.size}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Primary Currency</span>
            <p className="text-slate-800 font-semibold mt-0.5">Nigerian Naira (₦)</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Health Compliance</span>
            <p className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Fully Vaccinated & Compliant
            </p>
          </div>
        </div>
      </div>

      {/* Edit Farm Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Farm Profile">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location / Address</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Changes
          </button>
        </form>
      </Modal>
    </div>
  );
}

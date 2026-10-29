import AdminDialog from '../components/AdminDialog';
import React, { useState } from 'react';
import { Building2, Eye, MapPin, Bird, Layers } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

export default function Farms() {
  const { farms } = useAdmin();
  const [selectedFarm, setSelectedFarm] = useState(null);

  const columns = [
    {
      header: 'Farm ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-xs text-slate-700">{r.id}</span>
    },
    {
      header: 'Farm Name & Size',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{r.name}</span>
            <span className="text-[11px] text-slate-400">{r.size || '5,000 sqm'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Owner',
      accessor: 'ownerName',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">{r.ownerName}</span>
          <span className="text-[11px] font-mono text-slate-400">{r.ownerId}</span>
        </div>
      )
    },
    {
      header: 'Location',
      render: (r) => (
        <span className="text-xs text-slate-600 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {r.location}
        </span>
      )
    },
    {
      header: 'Poultry Categories',
      render: (r) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {r.poultryTypes.map((pt) => (
            <span
              key={pt}
              className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold"
            >
              {pt}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Total Flocks',
      render: (r) => <span className="font-bold text-slate-800">{r.totalFlocks} batches</span>
    },
    {
      header: 'Total Bird Population',
      render: (r) => (
        <span className="font-extrabold text-slate-900">
          {(r.totalBirds || 0).toLocaleString()} <span className="text-slate-400 font-normal text-xs">birds</span>
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge variant={r.status}>{r.status}</StatusBadge>
    },
    {
      header: 'Actions',
      render: (r) => (
        <button
          onClick={() => setSelectedFarm(r)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          title="View Multi-Poultry Breakdown"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Farms & Multi-Poultry Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore registered poultry farms, poultry species attribution, and live bird capacity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <span>Total Farms: {farms.length}</span>
          <span>•</span>
          <span className="text-emerald-700">
            Total Live Birds: {farms.reduce((s, f) => s + (f.totalBirds || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Farms Table */}
      <AdminDataTable
        columns={columns}
        data={farms}
        searchPlaceholder="Search farm name, owner, or location..."
        filterKey="status"
        filterLabel="Status"
        filterOptions={['Active', 'Suspended']}
        emptyTitle="No farms found"
      />

      {/* Farm Details & Multi-Poultry Breakdown Modal (README Section 5C) */}
      {selectedFarm && (
        <AdminDialog onClose={()=>setSelectedFarm(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold flex items-center justify-center text-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedFarm.name}</h3>
                  <span className="text-xs font-mono text-slate-400">{selectedFarm.id} • Owner: {selectedFarm.ownerName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFarm(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                &times;
              </button>
            </div>

            {/* Farm Overview Stats */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Flocks</span>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedFarm.totalFlocks}</p>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Birds</span>
                <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{(selectedFarm.totalBirds || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedFarm.location}</p>
              </div>
            </div>

            {/* MULTI-POULTRY BREAKDOWN (README Section 5C Specification) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Multi-Poultry Category Breakdown
                </h4>
              </div>

              <div className="space-y-3">
                {(selectedFarm.breakdown || []).map((b, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <Bird className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 block">{b.type}</span>
                        <span className="text-xs text-slate-500">{b.activeFlocks} Active Flocks</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-emerald-800 block">
                        {(b.totalBirds || 0).toLocaleString()} Birds
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {((b.totalBirds / (selectedFarm.totalBirds || 1)) * 100).toFixed(0)}% of Farm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFarm(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close Farm View
              </button>
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}

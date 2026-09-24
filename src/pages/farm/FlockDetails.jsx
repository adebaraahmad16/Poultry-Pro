import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bird, Layers, Egg, ShieldCheck, HeartPulse, Activity, DollarSign } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';

export default function FlockDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flocks, eggs, mortality, vaccinations, sales, expenses } = useFarm();

  const flock = flocks.find((f) => f.id === id) || flocks[0];

  if (!flock) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Flock not found.</p>
        <button onClick={() => navigate('/farm/flocks')} className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl">
          Back to Flocks
        </button>
      </div>
    );
  }

  const flockEggs = eggs.filter((e) => e.flockId === flock.id);
  const flockMortality = mortality.filter((m) => m.flockId === flock.id);
  const flockVaccines = vaccinations.filter((v) => v.flockId === flock.id);
  const flockSales = sales.filter((s) => s.flockId === flock.id);
  const flockExpenses = expenses.filter((e) => e.flockId === flock.id);

  const totalMortalityCount = flockMortality.reduce((sum, m) => sum + (m.count || 0), 0);
  const mortalityRate = (((flock.initialBirds - flock.currentBirds) / flock.initialBirds) * 100).toFixed(2);

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => navigate('/farm/flocks')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Flocks
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{flock.name}</h1>
              <Badge variant={flock.type === 'Layer' ? 'green' : 'blue'}>{flock.type}</Badge>
              <Badge variant={flock.healthStatus === 'Healthy' ? 'green' : 'amber'}>{flock.healthStatus}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {flock.breed} • Pen: <strong>{flock.pen}</strong> • Acquired: {flock.dateAcquired}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">Initial Flock Investment</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">₦{(flock.totalCost || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Current Live Birds" value={flock.currentBirds.toLocaleString()} icon={Bird} subtitle={`Initial: ${flock.initialBirds.toLocaleString()}`} color="green" />
        <StatCard title="Mortality Count" value={totalMortalityCount} icon={HeartPulse} subtitle={`Rate: ${mortalityRate}%`} color="amber" />
        <StatCard title="Total Egg Yield Logs" value={flockEggs.length} icon={Egg} subtitle="Recorded collections" color="blue" />
        <StatCard title="Direct Flock Sales" value={`₦${flockSales.reduce((s, x) => s + (x.totalAmount || 0), 0).toLocaleString()}`} icon={DollarSign} subtitle={`${flockSales.length} transactions`} color="indigo" />
      </div>

      {/* Flock Activity Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Flock Activity & Health Log Timeline
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Vaccination Administered</p>
              <p className="text-xs text-slate-600">Gumboro booster administered successfully by vet manager.</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Scheduled Date: 2026-08-15</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Egg className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Peak Production Reached</p>
              <p className="text-xs text-slate-600">Lay rate hit 88% efficiency across all pen cages.</p>
              <span className="text-[10px] text-slate-400 mt-1 block">2026-08-25</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

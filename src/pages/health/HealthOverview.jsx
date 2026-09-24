import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Syringe, Pill, TrendingDown, ShieldCheck, ArrowRight } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';

export default function HealthOverview() {
  const { vaccinations, medications, mortality, flocks } = useFarm();
  const navigate = useNavigate();

  const upcomingVaccines = vaccinations.filter((v) => v.status === 'Upcoming');
  const activeMeds = medications;
  const totalMortality = mortality.reduce((sum, m) => sum + (m.count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald-600" />
            Flock Health & Bio-Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Monitor vaccination schedules, medication treatments, and mortality logs.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/health/vaccinations')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Syringe className="w-4 h-4" />
            Vaccinations
          </button>
          <button
            onClick={() => navigate('/health/mortality')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4" />
            Log Mortality
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Upcoming Vaccinations" value={upcomingVaccines.length} icon={Syringe} subtitle="Scheduled doses due" color="amber" />
        <StatCard title="Active Medication Courses" value={activeMeds.length} icon={Pill} subtitle="Currently administered" color="blue" />
        <StatCard title="Total Mortality Recorded" value={totalMortality} icon={TrendingDown} subtitle="Across all batches" color="green" />
      </div>

      {/* Upcoming Vaccinations Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Syringe className="w-5 h-5 text-emerald-600" />
              Upcoming Vaccination Schedule
            </h3>
            <button onClick={() => navigate('/health/vaccinations')} className="text-xs font-bold text-emerald-600 hover:underline">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {vaccinations.slice(0, 3).map((v) => (
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{v.vaccine}</p>
                  <p className="text-xs text-slate-500">{v.flockName} • Administered by {v.administeredBy}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Due: {v.scheduledDate}</span>
                </div>
                <Badge variant={v.status === 'Completed' ? 'green' : 'amber'}>{v.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Medication Courses Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Medication Treatments
            </h3>
            <button onClick={() => navigate('/health/medication')} className="text-xs font-bold text-blue-600 hover:underline">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">{m.medicationName}</p>
                  <span className="text-xs font-semibold text-slate-700">Cost: ₦{(m.cost || 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Reason: {m.reason} ({m.dosage})</p>
                <p className="text-[10px] text-slate-400 mt-1">{m.flockName} • {m.startDate} to {m.endDate}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

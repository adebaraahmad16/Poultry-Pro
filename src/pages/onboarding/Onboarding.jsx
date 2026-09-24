import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bird, Check, ArrowRight, Building, Layers, CheckCircle2 } from 'lucide-react';
import { farmProfileService } from '../../services/managementService';
import { flockService } from '../../services/flockService';
import PoultryTypeSelect from '../../components/common/PoultryTypeSelect';
import { POULTRY_TYPE_MAP, ALL_FLOCK_TYPE_OPTIONS } from '../../constants/poultryTypes';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [farmInfo, setFarmInfo] = useState(() => {
    const savedFarm = farmProfileService.getFarm();
    return {
      name: savedFarm?.name || '',
      location: savedFarm?.location || '',
      type: savedFarm?.type || 'Mixed Poultry',
      size: savedFarm?.size || '',
      workersCount: savedFarm?.workersCount || 1
    };
  });
  const [poultryTypes, setPoultryTypes] = useState(() => {
    // Pre-fill from registration if already selected
    const farm = farmProfileService.getFarm();
    return Array.isArray(farm?.poultryTypes) ? farm.poultryTypes : [];
  });

  // Bird type options are limited to the farmer's selected poultry types
  const flockTypeOptions = poultryTypes.length > 0
    ? poultryTypes.map((id) => POULTRY_TYPE_MAP[id]).filter(Boolean).flatMap((t) => t.flockTypes)
    : ALL_FLOCK_TYPE_OPTIONS;

  const [firstFlock, setFirstFlock] = useState({
    name: '',
    type: 'Broiler',
    breed: '',
    initialBirds: '',
    dateAcquired: new Date().toISOString().split('T')[0],
    source: '',
    costPerBird: '',
    pen: 'Pen 1'
  });

  // Keep the first flock's bird type valid for the selected poultry types
  useEffect(() => {
    if (flockTypeOptions.length > 0 && !flockTypeOptions.includes(firstFlock.type)) {
      setFirstFlock((prev) => ({ ...prev, type: flockTypeOptions[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flockTypeOptions.join(',')]);

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (poultryTypes.length === 0) {
      alert('Please select at least one poultry type you manage.');
      return;
    }
    farmProfileService.updateFarm({ ...farmInfo, poultryTypes });
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    flockService.create(firstFlock);
    setStep(3);
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-xl w-full p-8">
        {/* Step Wizard Header Indicator */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Bird className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Farm Setup Wizard</h2>
              <p className="text-xs text-slate-500">Step {step} of 3</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                    : step > s
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Farm Info */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Tell Us About Your Farm
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure basic farm identity and parameters.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Name</label>
              <input
                type="text"
                required
                value={farmInfo.name}
                onChange={(e) => setFarmInfo({ ...farmInfo, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Location</label>
                <input
                  type="text"
                  required
                  value={farmInfo.location}
                  onChange={(e) => setFarmInfo({ ...farmInfo, location: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Type</label>
              <select
                value={farmInfo.type}
                onChange={(e) => setFarmInfo({ ...farmInfo, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              >
                <option value="Mixed Poultry">Mixed Poultry</option>
                <option value="Broiler Only">Broiler Only</option>
                <option value="Layer Only">Layer Only</option>
                <option value="Breeder / Hatchery">Breeder / Hatchery</option>
              </select>
            </div>
            </div>

            <PoultryTypeSelect selected={poultryTypes} onChange={setPoultryTypes} columns="grid-cols-2 sm:grid-cols-3" />

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6"
            >
              Continue to First Flock
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: First Flock */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Add Your First Flock
              </h3>
              <p className="text-xs text-slate-500 mt-1">Record the initial batch of birds currently in your pens.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flock Name</label>
                <input
                  type="text"
                  required
                  value={firstFlock.name}
                  onChange={(e) => setFirstFlock({ ...firstFlock, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bird Type</label>
                <select
                  value={firstFlock.type}
                  onChange={(e) => setFirstFlock({ ...firstFlock, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {flockTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Breed</label>
                <input
                  type="text"
                  required
                  value={firstFlock.breed}
                  onChange={(e) => setFirstFlock({ ...firstFlock, breed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Number of Birds</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={firstFlock.initialBirds}
                  onChange={(e) => setFirstFlock({ ...firstFlock, initialBirds: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Per Bird (₦)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={firstFlock.costPerBird}
                  onChange={(e) => setFirstFlock({ ...firstFlock, costPerBird: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-1/2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-center text-sm"
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="w-1/2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                Save Flock
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Your PoultryPro Farm is Ready!</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Your farm profile <strong>{farmInfo.name}</strong> and initial flock <strong>{firstFlock.name}</strong> have been configured successfully.
            </p>

            <button
              onClick={handleFinish}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-8"
            >
              Go to Farm Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

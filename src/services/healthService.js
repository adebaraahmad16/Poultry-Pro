/**
 * healthService — mortality, vaccinations, medications.
 * Delegates mutations to Supabase with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { flockService } from './flockService';
import { mortalityMutations, vaccinationMutations, medicationMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';

export const healthService = {
  // Mortality
  getMortalityRecords: () => getItem(KEYS.MORTALITY, []),

  recordMortality: async (data) => {
    const farmId = getSelectedFarmId();
    const record = await mortalityMutations.create(farmId, {
      ...data,
      count: Number(data.count),
      date: data.date || new Date().toISOString().split('T')[0],
    });
    // Deduct birds from target flock
    flockService.recordMortality(data.flockId, data.count);
    return record;
  },

  updateMortalityRecord: async (id, data) => {
    const farmId = getSelectedFarmId();
    return mortalityMutations.update(farmId, id, data);
  },

  deleteMortalityRecord: async (id) => {
    const farmId = getSelectedFarmId();
    return mortalityMutations.delete(farmId, id);
  },

  // Vaccinations
  getVaccinations: () => getItem(KEYS.VACCINATIONS, []),

  addVaccination: async (vac) => {
    const farmId = getSelectedFarmId();
    return vaccinationMutations.create(farmId, { ...vac, status: vac.status || 'Upcoming' });
  },

  updateVaccination: async (id, vac) => {
    const farmId = getSelectedFarmId();
    return vaccinationMutations.update(farmId, id, vac);
  },

  updateVaccinationStatus: async (id, status) => {
    const farmId = getSelectedFarmId();
    const vacs = getItem(KEYS.VACCINATIONS, []);
    const existing = vacs.find(v => v.id === id);
    if (existing) return vaccinationMutations.update(farmId, id, { ...existing, status });
  },

  deleteVaccination: async (id) => {
    const farmId = getSelectedFarmId();
    return vaccinationMutations.delete(farmId, id);
  },

  // Medications
  getMedications: () => getItem(KEYS.MEDICATIONS, []),

  addMedication: async (med) => {
    const farmId = getSelectedFarmId();
    return medicationMutations.create(farmId, { ...med, cost: Number(med.cost || 0) });
  },

  updateMedication: async (id, med) => {
    const farmId = getSelectedFarmId();
    return medicationMutations.update(farmId, id, med);
  },

  deleteMedication: async (id) => {
    const farmId = getSelectedFarmId();
    return medicationMutations.delete(farmId, id);
  },
};

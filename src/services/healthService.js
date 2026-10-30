/**
 * healthService — mortality, vaccinations, medications.
 * Delegates mutations to Supabase with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { flockService } from './flockService';
import { mortalityMutations, vaccinationMutations, medicationMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';
function resolveFarmId(customId) {
  return customId || getSelectedFarmId() || getItem(KEYS.USER, {})?.farmId;
}

export const healthService = {
  // Mortality
  getMortalityRecords: () => getItem(KEYS.MORTALITY, []),

  recordMortality: async (data) => {
    const farmId = resolveFarmId(data?.farmId);
    const record = await mortalityMutations.create(farmId, {
      ...data,
      count: Number(data.count),
      date: data.date || new Date().toISOString().split('T')[0],
    });
    // The database saves the record and adjusts the flock atomically.
    return record;
  },

  updateMortalityRecord: async (id, data) => {
    const farmId = resolveFarmId(data?.farmId);
    return mortalityMutations.update(farmId, id, data);
  },

  deleteMortalityRecord: async (id, customFarmId) => {
    const farmId = resolveFarmId(customFarmId);
    return mortalityMutations.delete(farmId, id);
  },

  // Vaccinations
  getVaccinations: () => getItem(KEYS.VACCINATIONS, []),

  addVaccination: async (vac) => {
    const farmId = resolveFarmId(vac?.farmId);
    return vaccinationMutations.create(farmId, { ...vac, status: vac.status || 'Upcoming' });
  },

  updateVaccination: async (id, vac) => {
    const farmId = resolveFarmId(vac?.farmId);
    return vaccinationMutations.update(farmId, id, vac);
  },

  updateVaccinationStatus: async (id, status, customFarmId) => {
    const farmId = resolveFarmId(customFarmId);
    return vaccinationMutations.update(farmId, id, { status });
  },

  deleteVaccination: async (id, customFarmId) => {
    const farmId = resolveFarmId(customFarmId);
    return vaccinationMutations.delete(farmId, id);
  },

  // Medications
  getMedications: () => getItem(KEYS.MEDICATIONS, []),

  addMedication: async (med) => {
    const farmId = resolveFarmId(med?.farmId);
    return medicationMutations.create(farmId, { ...med, cost: Number(med.cost || 0) });
  },

  updateMedication: async (id, med) => {
    const farmId = resolveFarmId(med?.farmId);
    return medicationMutations.update(farmId, id, med);
  },

  deleteMedication: async (id, customFarmId) => {
    const farmId = resolveFarmId(customFarmId);
    return medicationMutations.delete(farmId, id);
  },
};

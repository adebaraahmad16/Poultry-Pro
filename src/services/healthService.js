import { getItem, setItem, KEYS } from './storageService';
import { flockService } from './flockService';

export const healthService = {
  // Mortality
  getMortalityRecords: () => getItem(KEYS.MORTALITY, []),
  
  recordMortality: (data) => {
    const records = getItem(KEYS.MORTALITY, []);
    const newRecord = {
      ...data,
      id: `mort-${Date.now()}`,
      count: Number(data.count),
      date: data.date || new Date().toISOString().split('T')[0]
    };
    const updated = [newRecord, ...records];
    setItem(KEYS.MORTALITY, updated);
    
    // Deduct birds from target flock
    flockService.recordMortality(data.flockId, data.count);
    return newRecord;
  },

  deleteMortalityRecord: (id) => {
    const records = getItem(KEYS.MORTALITY, []);
    const updated = records.filter((r) => r.id !== id);
    setItem(KEYS.MORTALITY, updated);
    return true;
  },

  // Vaccinations
  getVaccinations: () => getItem(KEYS.VACCINATIONS, []),

  addVaccination: (vac) => {
    const vacs = getItem(KEYS.VACCINATIONS, []);
    const newVac = {
      ...vac,
      id: `vac-${Date.now()}`,
      status: vac.status || 'Upcoming'
    };
    const updated = [newVac, ...vacs];
    setItem(KEYS.VACCINATIONS, updated);
    return newVac;
  },

  updateVaccinationStatus: (id, status) => {
    const vacs = getItem(KEYS.VACCINATIONS, []);
    const updated = vacs.map((v) => (v.id === id ? { ...v, status } : v));
    setItem(KEYS.VACCINATIONS, updated);
  },

  deleteVaccination: (id) => {
    const vacs = getItem(KEYS.VACCINATIONS, []);
    const updated = vacs.filter((v) => v.id !== id);
    setItem(KEYS.VACCINATIONS, updated);
    return true;
  },

  // Medications
  getMedications: () => getItem(KEYS.MEDICATIONS, []),

  addMedication: (med) => {
    const meds = getItem(KEYS.MEDICATIONS, []);
    const newMed = {
      ...med,
      id: `med-${Date.now()}`,
      cost: Number(med.cost || 0)
    };
    const updated = [newMed, ...meds];
    setItem(KEYS.MEDICATIONS, updated);
    return newMed;
  },

  deleteMedication: (id) => {
    const meds = getItem(KEYS.MEDICATIONS, []);
    const updated = meds.filter((m) => m.id !== id);
    setItem(KEYS.MEDICATIONS, updated);
    return true;
  }
};

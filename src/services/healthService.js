import { getItem, setItem, KEYS } from './storageService';
import { flockService } from './flockService';
import { API_BASE_URL } from './apiConfig';

export const healthService = {
  // Mortality
  getMortalityRecords: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mortality`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.MORTALITY, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, using local mortality records:', err);
    }
    return getItem(KEYS.MORTALITY, []);
  },
  
  recordMortality: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/mortality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newRecord = await res.json();
        const records = getItem(KEYS.MORTALITY, []);
        setItem(KEYS.MORTALITY, [newRecord, ...records]);
        flockService.recordMortality(data.flockId, data.count);
        return newRecord;
      }
    } catch (err) {
      console.warn('API error, saving mortality locally:', err);
    }

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

  deleteMortalityRecord: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/mortality/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const records = getItem(KEYS.MORTALITY, []);
    const updated = records.filter((r) => r.id !== id);
    setItem(KEYS.MORTALITY, updated);
    return true;
  },

  // Vaccinations
  getVaccinations: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/vaccinations`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.VACCINATIONS, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, using local vaccinations:', err);
    }
    return getItem(KEYS.VACCINATIONS, []);
  },

  addVaccination: async (vac) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vaccinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vac)
      });
      if (res.ok) {
        const newVac = await res.json();
        const vacs = getItem(KEYS.VACCINATIONS, []);
        setItem(KEYS.VACCINATIONS, [newVac, ...vacs]);
        return newVac;
      }
    } catch (err) {
      console.warn('API error, saving vaccination locally:', err);
    }

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

  updateVaccinationStatus: async (id, status) => {
    try {
      await fetch(`${API_BASE_URL}/vaccinations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.warn('API error updating vaccination status:', err);
    }
    const vacs = getItem(KEYS.VACCINATIONS, []);
    const updated = vacs.map((v) => (v.id === id ? { ...v, status } : v));
    setItem(KEYS.VACCINATIONS, updated);
  },

  deleteVaccination: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/vaccinations/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const vacs = getItem(KEYS.VACCINATIONS, []);
    const updated = vacs.filter((v) => v.id !== id);
    setItem(KEYS.VACCINATIONS, updated);
    return true;
  },

  // Medications
  getMedications: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/medications`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.MEDICATIONS, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, using local medications:', err);
    }
    return getItem(KEYS.MEDICATIONS, []);
  },

  addMedication: async (med) => {
    try {
      const res = await fetch(`${API_BASE_URL}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(med)
      });
      if (res.ok) {
        const newMed = await res.json();
        const meds = getItem(KEYS.MEDICATIONS, []);
        setItem(KEYS.MEDICATIONS, [newMed, ...meds]);
        return newMed;
      }
    } catch (err) {
      console.warn('API error, saving medication locally:', err);
    }

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

  deleteMedication: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/medications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const meds = getItem(KEYS.MEDICATIONS, []);
    const updated = meds.filter((m) => m.id !== id);
    setItem(KEYS.MEDICATIONS, updated);
    return true;
  }
};

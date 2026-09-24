import { getItem, setItem, KEYS } from './storageService';

const API_BASE = 'http://localhost:5000/api';

export const flockService = {
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE}/flocks`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.FLOCKS, data);
        return data;
      }
    } catch (err) {
      console.warn('API unavailable, loading from local storage:', err);
    }
    return getItem(KEYS.FLOCKS, []);
  },
  
  getById: (id) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    return flocks.find((f) => f.id === id) || null;
  },
  
  create: async (flockData) => {
    try {
      const res = await fetch(`${API_BASE}/flocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flockData)
      });
      if (res.ok) {
        const newFlock = await res.json();
        const flocks = getItem(KEYS.FLOCKS, []);
        setItem(KEYS.FLOCKS, [newFlock, ...flocks]);
        return newFlock;
      }
    } catch (err) {
      console.warn('API unavailable, saving locally:', err);
    }

    const flocks = getItem(KEYS.FLOCKS, []);
    const newFlock = {
      ...flockData,
      id: `flock-${Date.now()}`,
      currentBirds: Number(flockData.initialBirds),
      initialBirds: Number(flockData.initialBirds),
      totalCost: Number(flockData.initialBirds) * Number(flockData.costPerBird || 0),
      status: flockData.status || 'Active',
      healthStatus: flockData.healthStatus || 'Healthy',
      dateAcquired: flockData.dateAcquired || new Date().toISOString().split('T')[0]
    };
    setItem(KEYS.FLOCKS, [newFlock, ...flocks]);
    return newFlock;
  },

  delete: async (id) => {
    try {
      await fetch(`${API_BASE}/flocks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const flocks = getItem(KEYS.FLOCKS, []);
    const updated = flocks.filter((f) => f.id !== id);
    setItem(KEYS.FLOCKS, updated);
    return true;
  },

  recordMortality: (flockId, count) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    const updated = flocks.map((f) => {
      if (f.id === flockId) {
        const current = Math.max(0, Number(f.currentBirds) - Number(count));
        return { ...f, currentBirds: current };
      }
      return f;
    });
    setItem(KEYS.FLOCKS, updated);
  }
};

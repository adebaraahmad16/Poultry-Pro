/**
 * flockService — now delegates to Supabase mutations with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { flockMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';

export const flockService = {
  getAll: () => getItem(KEYS.FLOCKS, []),

  getById: (id) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    return flocks.find(f => f.id === id) || null;
  },

  create: async (flockData) => {
    const farmId = getSelectedFarmId();
    return flockMutations.create(farmId, flockData);
  },

  update: async (flockId, updates) => {
    const farmId = getSelectedFarmId();
    return flockMutations.update(farmId, flockId, updates);
  },

  delete: async (id) => {
    const farmId = getSelectedFarmId();
    return flockMutations.delete(farmId, id);
  },

  recordMortality: (flockId, count) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    const updated = flocks.map(f => {
      if (f.id === flockId) {
        const current = Math.max(0, Number(f.currentBirds) - Number(count));
        return { ...f, currentBirds: current };
      }
      return f;
    });
    setItem(KEYS.FLOCKS, updated);
  }
};

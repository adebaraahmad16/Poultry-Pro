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
    let farmId = flockData?.farmId || getSelectedFarmId();
    if (!farmId) {
      const user = getItem(KEYS.USER, {});
      farmId = user?.farmId;
    }
    return flockMutations.create(farmId, flockData);
  },

  update: async (flockId, updates) => {
    let farmId = updates?.farmId || getSelectedFarmId();
    if (!farmId) {
      const user = getItem(KEYS.USER, {});
      farmId = user?.farmId;
    }
    return flockMutations.update(farmId, flockId, updates);
  },

  delete: async (id) => {
    let farmId = getSelectedFarmId();
    if (!farmId) {
      const user = getItem(KEYS.USER, {});
      farmId = user?.farmId;
    }
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

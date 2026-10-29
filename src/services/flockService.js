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

  recordMortality: async (flockId, count) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    let targetFlock = null;
    const updated = flocks.map(f => {
      if (f.id === flockId) {
        const current = Math.max(0, Number(f.currentBirds) - Number(count));
        targetFlock = { ...f, currentBirds: current };
        return targetFlock;
      }
      return f;
    });
    setItem(KEYS.FLOCKS, updated);
    if (targetFlock) {
      let farmId = targetFlock.farmId || getSelectedFarmId();
      if (!farmId) {
        const user = getItem(KEYS.USER, {});
        farmId = user?.farmId;
      }
      try {
        await flockMutations.update(farmId, flockId, { currentBirds: targetFlock.currentBirds });
      } catch (e) {
        console.warn('Could not sync flock mortality deduction to remote:', e);
      }
    }
  }
};

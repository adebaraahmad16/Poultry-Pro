/**
 * productionService — egg production and feed inventory services.
 * Now delegates mutations to Supabase with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { eggMutations, feedMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';

export const eggService = {
  getAll: () => getItem(KEYS.EGGS, []),

  createRecord: async (record) => {
    const farmId = getSelectedFarmId();
    const total = Number(record.totalEggs || 0);
    const broken = Number(record.brokenEggs || 0);
    const goodEggs = Math.max(0, total - broken);
    return eggMutations.create(farmId, { ...record, goodEggs, totalEggs: total, brokenEggs: broken });
  },

  updateRecord: async (id, record) => {
    const farmId = getSelectedFarmId();
    return eggMutations.update(farmId, id, record);
  },

  deleteRecord: async (id) => {
    const farmId = getSelectedFarmId();
    return eggMutations.delete(farmId, id);
  },
};

export const feedService = {
  getInventory: () => getItem(KEYS.FEED, []),

  addFeedItem: async (item) => {
    const farmId = getSelectedFarmId();
    return feedMutations.create(farmId, item);
  },

  updateFeedItem: async (id, item) => {
    const farmId = getSelectedFarmId();
    return feedMutations.update(farmId, id, item);
  },

  recordUsage: async (feedId, bagsUsed) => {
    const feeds = getItem(KEYS.FEED, []);
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;
    const remaining = Math.max(0, Number(feed.quantityBags) - Number(bagsUsed));
    const farmId = getSelectedFarmId();
    return feedMutations.update(farmId, feedId, { ...feed, quantityBags: remaining });
  },

  deleteFeedItem: async (id) => {
    const farmId = getSelectedFarmId();
    return feedMutations.delete(farmId, id);
  },
};

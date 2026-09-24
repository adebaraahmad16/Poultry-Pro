import { getItem, setItem, KEYS } from './storageService';

const API_BASE = 'http://localhost:5000/api';

export const eggService = {
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE}/eggs`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.EGGS, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, using local storage:', err);
    }
    return getItem(KEYS.EGGS, []);
  },
  
  createRecord: async (record) => {
    try {
      const res = await fetch(`${API_BASE}/eggs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        const newRecord = await res.json();
        const records = getItem(KEYS.EGGS, []);
        setItem(KEYS.EGGS, [newRecord, ...records]);
        return newRecord;
      }
    } catch (err) {
      console.warn('API error:', err);
    }

    const records = getItem(KEYS.EGGS, []);
    const total = Number(record.totalEggs);
    const broken = Number(record.brokenEggs || 0);
    const rejected = Number(record.rejectedEggs || 0);
    const good = Math.max(0, total - broken - rejected);
    const crates = (good / 30).toFixed(1);

    const newRecord = {
      ...record,
      id: `egg-${Date.now()}`,
      totalEggs: total,
      brokenEggs: broken,
      rejectedEggs: rejected,
      goodEggs: good,
      crates: Number(crates),
      date: record.date || new Date().toISOString().split('T')[0]
    };
    setItem(KEYS.EGGS, [newRecord, ...records]);
    return newRecord;
  },

  deleteRecord: async (id) => {
    try {
      await fetch(`${API_BASE}/eggs/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const records = getItem(KEYS.EGGS, []);
    const updated = records.filter((r) => r.id !== id);
    setItem(KEYS.EGGS, updated);
    return true;
  }
};

export const feedService = {
  getInventory: async () => {
    try {
      const res = await fetch(`${API_BASE}/feed`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.FEED, data);
        return data;
      }
    } catch (err) {
      console.warn('API error:', err);
    }
    return getItem(KEYS.FEED, []);
  },
  
  addFeedItem: async (item) => {
    try {
      const res = await fetch(`${API_BASE}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const newFeed = await res.json();
        const feeds = getItem(KEYS.FEED, []);
        setItem(KEYS.FEED, [newFeed, ...feeds]);
        return newFeed;
      }
    } catch (err) {
      console.warn('API error:', err);
    }

    const feeds = getItem(KEYS.FEED, []);
    const newFeed = {
      ...item,
      id: `feed-${Date.now()}`,
      quantityBags: Number(item.quantityBags),
      unitPrice: Number(item.unitPrice),
      bagWeightKg: Number(item.bagWeightKg || 25),
      status: Number(item.quantityBags) <= Number(item.minStockThresholdBags || 20) ? 'Low Stock' : 'In Stock'
    };
    setItem(KEYS.FEED, [newFeed, ...feeds]);
    return newFeed;
  },

  recordUsage: async (feedId, bagsUsed) => {
    try {
      await fetch(`${API_BASE}/feed/${feedId}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bagsUsed })
      });
    } catch (err) {
      console.warn('API error:', err);
    }

    const feeds = getItem(KEYS.FEED, []);
    const updated = feeds.map((f) => {
      if (f.id === feedId) {
        const remaining = Math.max(0, Number(f.quantityBags) - Number(bagsUsed));
        const status = remaining <= Number(f.minStockThresholdBags || 20) ? 'Low Stock' : 'In Stock';
        return { ...f, quantityBags: remaining, status };
      }
      return f;
    });
    setItem(KEYS.FEED, updated);
  }
};

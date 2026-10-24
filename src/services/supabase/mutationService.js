/**
 * Supabase Data Mutation Service
 * Provides create/update/delete operations for all farm data via Supabase.
 * Falls back to localStorage when Supabase is not configured.
 * After every mutation, dispatches 'storage-update' to refresh FarmContext.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { getItem, setItem, KEYS } from '../storageService.js';
import {
  createFlock, updateFlock, deleteFlock,
  createEgg, updateEgg, deleteEgg,
  createFeed, updateFeed, deleteFeed,
  createMortality, updateMortality, deleteMortality,
  createVaccination, updateVaccination, deleteVaccination,
  createMedication, updateMedication, deleteMedication,
  createCustomer, updateCustomer, deleteCustomer,
  createSale, updateSale, deleteSale,
  createExpense, updateExpense, deleteExpense,
  createWorker, updateWorker, deleteWorker,
  createDailyRecord, updateDailyRecord, deleteDailyRecord,
} from './farmDataService.js';

// Helper: notify FarmContext to re-fetch data
function notifyUpdate() {
  window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'supabase' } }));
}

// ─── Flock Mutations ────────────────────────────────────────────────────────

export const flockMutations = {
  create: async (farmId, flockData) => {
    if (isSupabaseConfigured() && farmId) {
      const flock = await createFlock(farmId, flockData);
      notifyUpdate();
      return flock;
    }
    // localStorage fallback
    const flocks = getItem(KEYS.FLOCKS, []);
    const newFlock = { ...flockData, id: `flock-${Date.now()}`, farmId };
    setItem(KEYS.FLOCKS, [newFlock, ...flocks]);
    return newFlock;
  },

  update: async (farmId, flockId, updates) => {
    if (isSupabaseConfigured() && farmId) {
      const flock = await updateFlock(flockId, updates);
      notifyUpdate();
      return flock;
    }
    const flocks = getItem(KEYS.FLOCKS, []);
    const updated = flocks.map(f => f.id === flockId ? { ...f, ...updates } : f);
    setItem(KEYS.FLOCKS, updated);
    return updated.find(f => f.id === flockId);
  },

  delete: async (farmId, flockId) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteFlock(flockId);
      notifyUpdate();
      return true;
    }
    const flocks = getItem(KEYS.FLOCKS, []);
    setItem(KEYS.FLOCKS, flocks.filter(f => f.id !== flockId));
    return true;
  },
};

// ─── Egg Mutations ─────────────────────────────────────────────────────────

export const eggMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const egg = await createEgg(farmId, record);
      notifyUpdate();
      return egg;
    }
    const records = getItem(KEYS.EGGS, []);
    const total = Number(record.totalEggs || 0);
    const broken = Number(record.brokenEggs || 0);
    const goodEggs = Math.max(0, total - broken);
    const newRecord = { ...record, id: `egg-${Date.now()}`, goodEggs, totalEggs: total, brokenEggs: broken };
    setItem(KEYS.EGGS, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const egg = await updateEgg(id, record);
      notifyUpdate();
      return egg;
    }
    const records = getItem(KEYS.EGGS, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.EGGS, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteEgg(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.EGGS, []);
    setItem(KEYS.EGGS, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Feed Mutations ────────────────────────────────────────────────────────

export const feedMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const feed = await createFeed(farmId, record);
      notifyUpdate();
      return feed;
    }
    const feeds = getItem(KEYS.FEED, []);
    const newFeed = { ...record, id: `feed-${Date.now()}`, farmId };
    setItem(KEYS.FEED, [newFeed, ...feeds]);
    return newFeed;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const feed = await updateFeed(id, record);
      notifyUpdate();
      return feed;
    }
    const feeds = getItem(KEYS.FEED, []);
    const updated = feeds.map(f => f.id === id ? { ...f, ...record } : f);
    setItem(KEYS.FEED, updated);
    return updated.find(f => f.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteFeed(id);
      notifyUpdate();
      return true;
    }
    const feeds = getItem(KEYS.FEED, []);
    setItem(KEYS.FEED, feeds.filter(f => f.id !== id));
    return true;
  },
};

// ─── Mortality Mutations ───────────────────────────────────────────────────

export const mortalityMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const mort = await createMortality(farmId, record);
      notifyUpdate();
      return mort;
    }
    const records = getItem(KEYS.MORTALITY, []);
    const newRecord = { ...record, id: `mort-${Date.now()}`, farmId };
    setItem(KEYS.MORTALITY, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const mort = await updateMortality(id, record);
      notifyUpdate();
      return mort;
    }
    const records = getItem(KEYS.MORTALITY, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.MORTALITY, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteMortality(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.MORTALITY, []);
    setItem(KEYS.MORTALITY, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Vaccination Mutations ─────────────────────────────────────────────────

export const vaccinationMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const vacc = await createVaccination(farmId, record);
      notifyUpdate();
      return vacc;
    }
    const records = getItem(KEYS.VACCINATIONS, []);
    const newRecord = { ...record, id: `vacc-${Date.now()}`, farmId };
    setItem(KEYS.VACCINATIONS, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const vacc = await updateVaccination(id, record);
      notifyUpdate();
      return vacc;
    }
    const records = getItem(KEYS.VACCINATIONS, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.VACCINATIONS, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteVaccination(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.VACCINATIONS, []);
    setItem(KEYS.VACCINATIONS, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Medication Mutations ──────────────────────────────────────────────────

export const medicationMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const med = await createMedication(farmId, record);
      notifyUpdate();
      return med;
    }
    const records = getItem(KEYS.MEDICATIONS, []);
    const newRecord = { ...record, id: `med-${Date.now()}`, farmId };
    setItem(KEYS.MEDICATIONS, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const med = await updateMedication(id, record);
      notifyUpdate();
      return med;
    }
    const records = getItem(KEYS.MEDICATIONS, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.MEDICATIONS, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteMedication(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.MEDICATIONS, []);
    setItem(KEYS.MEDICATIONS, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Customer Mutations ────────────────────────────────────────────────────

export const customerMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const customer = await createCustomer(farmId, record);
      notifyUpdate();
      return customer;
    }
    const records = getItem(KEYS.CUSTOMERS, []);
    const newRecord = { ...record, id: `cust-${Date.now()}`, farmId };
    setItem(KEYS.CUSTOMERS, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const customer = await updateCustomer(id, record);
      notifyUpdate();
      return customer;
    }
    const records = getItem(KEYS.CUSTOMERS, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.CUSTOMERS, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteCustomer(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.CUSTOMERS, []);
    setItem(KEYS.CUSTOMERS, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Sale Mutations ────────────────────────────────────────────────────────

export const saleMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const sale = await createSale(farmId, record);
      notifyUpdate();
      return sale;
    }
    const records = getItem(KEYS.SALES, []);
    const newRecord = { ...record, id: `sale-${Date.now()}`, farmId, totalAmount: Number(record.quantity) * Number(record.unitPrice) };
    setItem(KEYS.SALES, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const sale = await updateSale(id, record);
      notifyUpdate();
      return sale;
    }
    const records = getItem(KEYS.SALES, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.SALES, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteSale(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.SALES, []);
    setItem(KEYS.SALES, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Expense Mutations ─────────────────────────────────────────────────────

export const expenseMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const expense = await createExpense(farmId, record);
      notifyUpdate();
      return expense;
    }
    const records = getItem(KEYS.EXPENSES, []);
    const newRecord = { ...record, id: `exp-${Date.now()}`, farmId };
    setItem(KEYS.EXPENSES, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const expense = await updateExpense(id, record);
      notifyUpdate();
      return expense;
    }
    const records = getItem(KEYS.EXPENSES, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.EXPENSES, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteExpense(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.EXPENSES, []);
    setItem(KEYS.EXPENSES, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Worker Mutations ──────────────────────────────────────────────────────

export const workerMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const worker = await createWorker(farmId, record);
      notifyUpdate();
      return worker;
    }
    const records = getItem(KEYS.WORKERS, []);
    const newRecord = { ...record, id: `worker-${Date.now()}`, farmId };
    setItem(KEYS.WORKERS, [newRecord, ...records]);
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const worker = await updateWorker(id, record);
      notifyUpdate();
      return worker;
    }
    const records = getItem(KEYS.WORKERS, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    setItem(KEYS.WORKERS, updated);
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteWorker(id);
      notifyUpdate();
      return true;
    }
    const records = getItem(KEYS.WORKERS, []);
    setItem(KEYS.WORKERS, records.filter(r => r.id !== id));
    return true;
  },
};

// ─── Daily Record Mutations ────────────────────────────────────────────────

export const dailyRecordMutations = {
  create: async (farmId, record) => {
    if (isSupabaseConfigured() && farmId) {
      const dr = await createDailyRecord(farmId, record);
      window.dispatchEvent(new CustomEvent('daily-records-updated'));
      notifyUpdate();
      return dr;
    }
    const key = KEYS.DAILY_RECORDS || 'poultrypro_daily_records';
    const records = getItem(key, []);
    const newRecord = {
      ...record,
      id: `dr-${Date.now()}`,
      farmId,
      values: record.values || {},
      status: 'Recorded',
      editable: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setItem(key, [newRecord, ...records]);
    window.dispatchEvent(new CustomEvent('daily-records-updated'));
    notifyUpdate();
    return newRecord;
  },

  update: async (farmId, id, record) => {
    if (isSupabaseConfigured() && farmId) {
      const dr = await updateDailyRecord(id, record);
      window.dispatchEvent(new CustomEvent('daily-records-updated'));
      notifyUpdate();
      return dr;
    }
    const key = KEYS.DAILY_RECORDS || 'poultrypro_daily_records';
    const records = getItem(key, []);
    const updated = records.map(r => r.id === id ? { ...r, ...record, updatedAt: new Date().toISOString() } : r);
    setItem(key, updated);
    window.dispatchEvent(new CustomEvent('daily-records-updated'));
    notifyUpdate();
    return updated.find(r => r.id === id);
  },

  delete: async (farmId, id) => {
    if (isSupabaseConfigured() && farmId) {
      await deleteDailyRecord(id);
      window.dispatchEvent(new CustomEvent('daily-records-updated'));
      notifyUpdate();
      return true;
    }
    const key = KEYS.DAILY_RECORDS || 'poultrypro_daily_records';
    const records = getItem(key, []);
    setItem(key, records.filter(r => r.id !== id));
    window.dispatchEvent(new CustomEvent('daily-records-updated'));
    notifyUpdate();
    return true;
  },
};

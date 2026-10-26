/**
 * dailyRecordService — daily farm activity logs.
 * Loads records via Supabase or localStorage fallback.
 * Generates CSV export client-side without requiring a backend server.
 */
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { getItem, KEYS } from './storageService.js';
import { getFlocks, getFeeds, getDailyRecords } from './supabase/farmDataService.js';
import { dailyRecordMutations } from './supabase/mutationService.js';

export const dailyRecordService = {
  farms: async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.from('farms').select('*');
        if (data && data.length > 0) {
          return data.map(f => ({ id: f.id, name: f.name, currency: f.currency }));
        }
      } catch (e) {
        console.warn('Error fetching farms for daily records:', e);
      }
    }
    const farm = getItem(KEYS.FARM, {});
    return [{ id: farm.id || 'default-farm', name: farm.name || 'My Farm', currency: farm.currency || '₦' }];
  },

  load: async (farmId) => {
    if (isSupabaseConfigured() && farmId) {
      try {
        const [flocks, feeds, records] = await Promise.all([
          getFlocks(farmId).catch(() => []),
          getFeeds(farmId).catch(() => []),
          getDailyRecords(farmId).catch(() => []),
        ]);
        const farm = getItem(KEYS.FARM, {});
        return {
          farms: [{ id: farmId, name: farm.name || 'My Farm', currency: farm.currency || '₦' }],
          flocks,
          feeds,
          records,
          capabilities: { dataExport: true, reportsAnalytics: true },
          upcomingHealth: [],
        };
      } catch (e) {
        console.warn('Error loading daily records from Supabase:', e);
      }
    }
    // Fallback
    const farm = getItem(KEYS.FARM, {});
    return {
      farms: [{ id: farm.id || farmId || 'default-farm', name: farm.name || 'My Farm', currency: farm.currency || '₦' }],
      flocks: getItem(KEYS.FLOCKS, []),
      feeds: getItem(KEYS.FEED, []),
      records: getItem(KEYS.DAILY_RECORDS || 'poultrypro_daily_records', []),
      capabilities: { dataExport: true, reportsAnalytics: true },
      upcomingHealth: [],
    };
  },

  save: async (record) => {
    if (record.id) {
      return dailyRecordMutations.update(record.farmId, record.id, record);
    }
    return dailyRecordMutations.create(record.farmId, record);
  },

  remove: async (record) => {
    return dailyRecordMutations.delete(record.farmId, record.id);
  },

  audit: async () => [],

  export: async (filters = {}) => {
    // Client-side CSV export
    const { farmId, flockId, poultryType, category, from, to, search } = filters;
    let records = [];
    if (isSupabaseConfigured() && farmId) {
      try {
        records = await getDailyRecords(farmId);
      } catch (e) {
        records = getItem(KEYS.DAILY_RECORDS || 'poultrypro_daily_records', []);
      }
    } else {
      records = getItem(KEYS.DAILY_RECORDS || 'poultrypro_daily_records', []);
    }

    // Filter
    let filtered = records;
    if (flockId) filtered = filtered.filter(r => r.flockId === flockId);
    if (poultryType && poultryType !== 'all') filtered = filtered.filter(r => r.poultryType === poultryType);
    if (category) filtered = filtered.filter(r => r.category === category);
    if (from) filtered = filtered.filter(r => r.date >= from);
    if (to) filtered = filtered.filter(r => r.date <= to);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    }

    // Generate CSV
    const headers = ['Date', 'Farm ID', 'Flock ID', 'Category', 'Status', 'Values', 'Created At'];
    const rows = filtered.map(r => [
      r.date || '',
      r.farmId || '',
      r.flockId || '',
      r.category || '',
      r.status || 'Recorded',
      `"${JSON.stringify(r.values || {}).replace(/"/g, '""')}"`,
      r.createdAt || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `daily-farm-records-${new Date().toISOString().split('T')[0]}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

import { getItem, setItem, KEYS } from './storageService';

export const weightService = {
  getWeightRecords: () => getItem(KEYS.WEIGHTS, []),

  addWeightRecord: (record) => {
    const records = getItem(KEYS.WEIGHTS, []);
    const newRecord = {
      ...record,
      id: `wt-${Date.now()}`,
      averageWeightKg: Number(record.averageWeightKg),
      sampleSize: Number(record.sampleSize || 0),
      date: record.date || new Date().toISOString().split('T')[0]
    };
    const updated = [newRecord, ...records];
    setItem(KEYS.WEIGHTS, updated);
    return newRecord;
  },

  deleteWeightRecord: (id) => {
    const records = getItem(KEYS.WEIGHTS, []);
    const updated = records.filter((r) => r.id !== id);
    setItem(KEYS.WEIGHTS, updated);
    return true;
  }
};

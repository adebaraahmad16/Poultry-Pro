import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import * as records from './farmDataService.js';

const pending = new Map();
function mutations(name, create, update, remove, daily = false) {
  const run = (action, farmId, id, values) => {
    if (!isSupabaseConfigured() || !supabase || !farmId) return Promise.reject(new Error('Select a farm and reconnect to Supabase before saving records.'));
    const key = JSON.stringify([name,action,farmId,id,values]);
    if (pending.has(key)) return pending.get(key);
    const promise = (async () => {
      const result = action === 'create' ? await create(farmId, values) : action === 'update' ? await update(id, { ...values, farmId }) : await remove(id, farmId);
      if (action !== 'delete' && !result?.id) throw new Error('The database did not confirm this change. Please retry.');
      if (daily) window.dispatchEvent(new CustomEvent('daily-records-updated'));
      window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'supabase' } }));
      return action === 'delete' ? true : result;
    })().finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
  return { create: (farmId, values) => run('create', farmId, null, values), update: (farmId, id, values) => run('update', farmId, id, values), delete: (farmId, id) => run('delete', farmId, id) };
}
export const flockMutations = mutations('flocks', records.createFlock, records.updateFlock, records.deleteFlock);
export const eggMutations = mutations('eggs', records.createEgg, records.updateEgg, records.deleteEgg);
export const feedMutations = mutations('feed', records.createFeed, records.updateFeed, records.deleteFeed);
export const mortalityMutations = mutations('mortality', records.createMortality, records.updateMortality, records.deleteMortality);
export const vaccinationMutations = mutations('vaccinations', records.createVaccination, records.updateVaccination, records.deleteVaccination);
export const medicationMutations = mutations('medications', records.createMedication, records.updateMedication, records.deleteMedication);
export const customerMutations = mutations('customers', records.createCustomer, records.updateCustomer, records.deleteCustomer);
export const saleMutations = mutations('sales', records.createSale, records.updateSale, records.deleteSale);
export const expenseMutations = mutations('expenses', records.createExpense, records.updateExpense, records.deleteExpense);
export const workerMutations = mutations('workers', records.createWorker, records.updateWorker, records.deleteWorker);
export const dailyRecordMutations = mutations('daily-records', records.createDailyRecord, records.updateDailyRecord, records.deleteDailyRecord, true);

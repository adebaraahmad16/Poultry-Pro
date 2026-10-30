import { createTask, updateTaskStatus, deleteOperation } from './supabase/operationsService';
/**
 * managementService — workers, tasks, notifications, farm & user profile.
 * Delegates mutations to Supabase with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { workerMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';
import { updateFarm, getFarm } from './supabase/farmDataService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

export const workerService = {
  getWorkers: () => getItem(KEYS.WORKERS, []),

  addWorker: async (worker) => {
    const farmId = getSelectedFarmId();
    return workerMutations.create(farmId, worker);
  },

  deleteWorker: async (id) => {
    const farmId = getSelectedFarmId();
    return workerMutations.delete(farmId, id);
  }
};

export const taskService = {
  getTasks: () => getItem(KEYS.TASKS, []), // Display cache only.
  addTask: createTask,
  updateTaskStatus,
  deleteTask: id => deleteOperation('tasks', id),
};

export const notificationService = {
  getNotifications: () => getItem(KEYS.NOTIFICATIONS, []),

  markAsRead: (id) => {
    const notifs = getItem(KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    setItem(KEYS.NOTIFICATIONS, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.NOTIFICATIONS } }));
  },

  markAllAsRead: () => {
    const notifs = getItem(KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    setItem(KEYS.NOTIFICATIONS, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.NOTIFICATIONS } }));
  },

  clearAll: () => {
    setItem(KEYS.NOTIFICATIONS, []);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.NOTIFICATIONS } }));
  }
};

export const farmProfileService = {
  getFarm: () => getItem(KEYS.FARM, {}),

  fetchFarm: async () => {
    const farmId = getSelectedFarmId();
    if (isSupabaseConfigured() && farmId) {
      try {
        const farm = await getFarm(farmId);
        if (farm) {
          const current = getItem(KEYS.FARM, {});
          const updated = { ...current, ...farm };
          setItem(KEYS.FARM, updated);
          return updated;
        }
      } catch (err) {
        console.warn('Supabase getFarm error, using local farm profile:', err);
      }
    }
    return getItem(KEYS.FARM, {});
  },

  getUser: () => getItem(KEYS.USER, {}),

  updateFarm: async data => {
    const farmId = getSelectedFarmId();
    if (!isSupabaseConfigured() || !farmId) throw new Error('Select your farm and reconnect to Supabase before saving.');
    const saved = await updateFarm(farmId, data);
    setItem(KEYS.FARM, saved);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.FARM } }));
    return saved;
  },
  updateUser: async data => {
    const { saveProfile } = await import('./profileService.js');
    const saved = await saveProfile(data);
    setItem(KEYS.USER, saved);
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: saved }));
    return saved;
  }
};

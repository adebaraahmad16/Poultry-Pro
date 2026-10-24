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
  getTasks: () => getItem(KEYS.TASKS, []),

  addTask: (task) => {
    const tasks = getItem(KEYS.TASKS, []);
    const newTask = {
      ...task,
      id: `task-${Date.now()}`,
      status: task.status || 'Pending',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0]
    };
    const updated = [newTask, ...tasks];
    setItem(KEYS.TASKS, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.TASKS } }));
    return newTask;
  },

  updateTaskStatus: (id, status) => {
    const tasks = getItem(KEYS.TASKS, []);
    const updated = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    setItem(KEYS.TASKS, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.TASKS } }));
  },

  deleteTask: (id) => {
    const tasks = getItem(KEYS.TASKS, []);
    const updated = tasks.filter((t) => t.id !== id);
    setItem(KEYS.TASKS, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.TASKS } }));
    return true;
  }
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

  updateFarm: async (data) => {
    const farmId = getSelectedFarmId();
    if (isSupabaseConfigured() && farmId) {
      try {
        await updateFarm(farmId, data);
      } catch (err) {
        console.warn('Supabase updateFarm error, saving locally:', err);
      }
    }
    const current = getItem(KEYS.FARM, {});
    const updated = { ...current, ...data };
    setItem(KEYS.FARM, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.FARM } }));
    return updated;
  },

  updateUser: async (data) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const patch = {};
          if (data.fullName !== undefined) patch.full_name = data.fullName;
          if (data.phone !== undefined) patch.phone = data.phone;
          await supabase.from('profiles').update(patch).eq('id', user.id);
        }
      } catch (err) {
        console.warn('Supabase updateUser error, saving locally:', err);
      }
    }
    const current = getItem(KEYS.USER, {});
    const updated = { ...current, ...data };
    setItem(KEYS.USER, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.USER } }));
    return updated;
  }
};

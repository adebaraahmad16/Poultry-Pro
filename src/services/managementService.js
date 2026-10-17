import { request, authHeaders, checkedFetch } from './planCatalog';
import { getItem, setItem, KEYS } from './storageService';
import { API_BASE_URL } from './apiConfig';

export const workerService = {
 getWorkers: async () => {
  try {const workers = await request('/workers'); setItem(KEYS.WORKERS,workers); return workers;}
  catch(e) { console.warn(e.message); return getItem(KEYS.WORKERS,[]); }
 },
 addWorker: async worker => { const saved = await request('/workers',{method:'POST',body:JSON.stringify(worker)}); setItem(KEYS.WORKERS,[saved,...getItem(KEYS.WORKERS,[])]); return saved; },
 deleteWorker: async id => { await request(`/workers/${id}`,{method:'DELETE'}); setItem(KEYS.WORKERS,getItem(KEYS.WORKERS,[]).filter(w => w.id !== id)); }
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
    return newTask;
  },

  updateTaskStatus: (id, status) => {
    const tasks = getItem(KEYS.TASKS, []);
    const updated = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    setItem(KEYS.TASKS, updated);
  },

  deleteTask: (id) => {
    const tasks = getItem(KEYS.TASKS, []);
    const updated = tasks.filter((t) => t.id !== id);
    setItem(KEYS.TASKS, updated);
    return true;
  }
};

export const notificationService = {
  getNotifications: () => getItem(KEYS.NOTIFICATIONS, []),

  markAsRead: (id) => {
    const notifs = getItem(KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    setItem(KEYS.NOTIFICATIONS, updated);
  },

  markAllAsRead: () => {
    const notifs = getItem(KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    setItem(KEYS.NOTIFICATIONS, updated);
  },

  clearAll: () => {
    setItem(KEYS.NOTIFICATIONS, []);
  }
};

export const farmProfileService = {
  getFarm: () => getItem(KEYS.FARM, {}),
  fetchFarm: async () => {
    try {
      const res = await checkedFetch(`${API_BASE_URL}/farm`,{headers:authHeaders()});
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          const current = getItem(KEYS.FARM, {});
          const updated = { ...current, ...data };
          setItem(KEYS.FARM, updated);
          return updated;
        }
      }
    } catch (err) {
      console.warn('API error, using local farm profile:', err);
    }
    return getItem(KEYS.FARM, {});
  },
  getUser: () => getItem(KEYS.USER, {}),

  updateFarm: async (data) => {
    await request('/farm',{method:'PUT',body:JSON.stringify({...getItem(KEYS.FARM,{}),...data})});
    const current = getItem(KEYS.FARM, {});
    const updated = { ...current, ...data };
    setItem(KEYS.FARM, updated);
    return updated;
  },

  updateUser: (data) => {
    const current = getItem(KEYS.USER, {});
    const updated = { ...current, ...data };
    setItem(KEYS.USER, updated);
    return updated;
  }
};

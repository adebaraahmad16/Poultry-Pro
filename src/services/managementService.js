import { getItem, setItem, KEYS } from './storageService';

export const workerService = {
  getWorkers: () => getItem(KEYS.WORKERS, []),

  addWorker: (worker) => {
    const workers = getItem(KEYS.WORKERS, []);
    const newWorker = {
      ...worker,
      id: `wrk-${Date.now()}`,
      status: 'Active',
      startDate: worker.startDate || new Date().toISOString().split('T')[0]
    };
    const updated = [newWorker, ...workers];
    setItem(KEYS.WORKERS, updated);
    return newWorker;
  },

  deleteWorker: (id) => {
    const workers = getItem(KEYS.WORKERS, []);
    const updated = workers.filter((w) => w.id !== id);
    setItem(KEYS.WORKERS, updated);
    return true;
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
  getUser: () => getItem(KEYS.USER, {}),

  updateFarm: (data) => {
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

import {
  initialFarmData,
  initialUserData,
  initialFlocks,
  initialFeedInventory,
  initialEggProduction,
  initialMortalityRecords,
  initialVaccinations,
  initialMedications,
  initialCustomers,
  initialSales,
  initialExpenses,
  initialInventoryItems,
  initialWorkers,
  initialTasks,
  initialWeightRecords,
  initialNotifications
} from './mockData';

const KEYS = {
  FARM: 'poultrypro_farm',
  USER: 'poultrypro_user',
  FLOCKS: 'poultrypro_flocks',
  FEED: 'poultrypro_feed',
  EGGS: 'poultrypro_eggs',
  MORTALITY: 'poultrypro_mortality',
  VACCINATIONS: 'poultrypro_vaccinations',
  MEDICATIONS: 'poultrypro_medications',
  CUSTOMERS: 'poultrypro_customers',
  SALES: 'poultrypro_sales',
  EXPENSES: 'poultrypro_expenses',
  INVENTORY: 'poultrypro_inventory',
  WORKERS: 'poultrypro_workers',
  TASKS: 'poultrypro_tasks',
  WEIGHTS: 'poultrypro_weights',
  NOTIFICATIONS: 'poultrypro_notifications',
  IS_LOGGED_IN: 'poultrypro_is_logged_in'
};

// Version flag to ensure existing browser storage is wiped clean of demo data
const STORAGE_VERSION = 'poultrypro_v3_fresh';

// Initialize clean empty localStorage
export const initializeStorage = () => {
  // If the storage version is outdated or demo data exists, wipe clean
  if (localStorage.getItem('poultrypro_version') !== STORAGE_VERSION) {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('poultrypro_current_plan');
    localStorage.setItem('poultrypro_version', STORAGE_VERSION);
  }

  if (localStorage.getItem(KEYS.FARM) === null) {
    localStorage.setItem(KEYS.FARM, JSON.stringify({
      name: '',
      location: '',
      type: 'Poultry Farm',
      size: '',
      poultryTypes: [],
      currency: '$',
      weightUnit: 'kg'
    }));
  }
  if (localStorage.getItem(KEYS.USER) === null) {
    localStorage.setItem(KEYS.USER, JSON.stringify(null));
  }
  if (localStorage.getItem(KEYS.FLOCKS) === null) {
    localStorage.setItem(KEYS.FLOCKS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.FEED) === null) {
    localStorage.setItem(KEYS.FEED, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.EGGS) === null) {
    localStorage.setItem(KEYS.EGGS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.MORTALITY) === null) {
    localStorage.setItem(KEYS.MORTALITY, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.VACCINATIONS) === null) {
    localStorage.setItem(KEYS.VACCINATIONS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.MEDICATIONS) === null) {
    localStorage.setItem(KEYS.MEDICATIONS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.CUSTOMERS) === null) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.SALES) === null) {
    localStorage.setItem(KEYS.SALES, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.EXPENSES) === null) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.INVENTORY) === null) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.WORKERS) === null) {
    localStorage.setItem(KEYS.WORKERS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.TASKS) === null) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.WEIGHTS) === null) {
    localStorage.setItem(KEYS.WEIGHTS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.NOTIFICATIONS) === null) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  if (localStorage.getItem(KEYS.IS_LOGGED_IN) === null) {
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
  }
};

export const resetAllData = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.setItem('poultrypro_version', STORAGE_VERSION);
  initializeStorage();
  window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'all' } }));
};

// Generic Getter & Setter
export const getItem = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

export const setItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
};

export { KEYS };

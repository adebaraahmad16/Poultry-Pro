/**
 * businessService — sales, customers, expenses, inventory.
 * Delegates mutations to Supabase with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { saleMutations, customerMutations, expenseMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';

export const salesService = {
  getSales: () => getItem(KEYS.SALES, []),

  createSale: async (sale) => {
    const farmId = getSelectedFarmId();
    return saleMutations.create(farmId, sale);
  },

  updateSaleStatus: async (id, paymentStatus) => {
    const farmId = getSelectedFarmId();
    return saleMutations.update(farmId, id, { paymentStatus });
  },

  deleteSale: async (id) => {
    const farmId = getSelectedFarmId();
    return saleMutations.delete(farmId, id);
  }
};

export const customerService = {
  getCustomers: () => getItem(KEYS.CUSTOMERS, []),

  createCustomer: async (customer) => {
    const farmId = getSelectedFarmId();
    return customerMutations.create(farmId, customer);
  },

  updateCustomer: async (id, customer) => {
    const farmId = getSelectedFarmId();
    return customerMutations.update(farmId, id, customer);
  },

  deleteCustomer: async (id) => {
    const farmId = getSelectedFarmId();
    return customerMutations.delete(farmId, id);
  }
};

export const expenseService = {
  getExpenses: () => getItem(KEYS.EXPENSES, []),

  createExpense: async (exp) => {
    const farmId = getSelectedFarmId();
    return expenseMutations.create(farmId, exp);
  },

  updateExpense: async (id, exp) => {
    const farmId = getSelectedFarmId();
    return expenseMutations.update(farmId, id, exp);
  },

  deleteExpense: async (id) => {
    const farmId = getSelectedFarmId();
    return expenseMutations.delete(farmId, id);
  }
};

export const inventoryService = {
  getInventory: () => getItem(KEYS.INVENTORY, []),

  addItem: (item) => {
    const inventory = getItem(KEYS.INVENTORY, []);
    const newItem = {
      ...item,
      id: `inv-${Date.now()}`,
      quantity: Number(item.quantity),
      cost: Number(item.cost || 0),
      status: Number(item.quantity) <= Number(item.minStock || 5) ? 'Low Stock' : 'In Stock',
      dateAdded: item.dateAdded || new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...inventory];
    setItem(KEYS.INVENTORY, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.INVENTORY } }));
    return newItem;
  },

  deleteItem: (id) => {
    const inventory = getItem(KEYS.INVENTORY, []);
    const updated = inventory.filter((i) => i.id !== id);
    setItem(KEYS.INVENTORY, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.INVENTORY } }));
    return true;
  }
};

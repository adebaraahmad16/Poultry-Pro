/**
 * businessService — sales, customers, expenses, inventory.
 * Delegates mutations to Supabase with localStorage fallback.
 */
import { getItem, setItem, KEYS } from './storageService';
import { saleMutations, customerMutations, expenseMutations } from './supabase/mutationService.js';
import { getSelectedFarmId } from './farmScope.js';

function resolveFarmId(customId) {
  return customId || getSelectedFarmId() || getItem(KEYS.USER, {})?.farmId;
}

export const salesService = {
  getSales: () => getItem(KEYS.SALES, []),

  createSale: async (sale) => {
    const farmId = resolveFarmId(sale?.farmId);
    return saleMutations.create(farmId, sale);
  },

  updateSale: async (id, sale) => {
    const farmId = resolveFarmId(sale?.farmId);
    return saleMutations.update(farmId, id, sale);
  },

  updateSaleStatus: async (id, paymentStatus) => {
    const farmId = resolveFarmId();
    return saleMutations.update(farmId, id, { paymentStatus });
  },

  deleteSale: async (id) => {
    const farmId = resolveFarmId();
    return saleMutations.delete(farmId, id);
  }
};

export const customerService = {
  getCustomers: () => getItem(KEYS.CUSTOMERS, []),

  createCustomer: async (customer) => {
    const farmId = resolveFarmId(customer?.farmId);
    return customerMutations.create(farmId, customer);
  },

  updateCustomer: async (id, customer) => {
    const farmId = resolveFarmId(customer?.farmId);
    return customerMutations.update(farmId, id, customer);
  },

  deleteCustomer: async (id) => {
    const farmId = resolveFarmId();
    return customerMutations.delete(farmId, id);
  }
};

export const expenseService = {
  getExpenses: () => getItem(KEYS.EXPENSES, []),

  createExpense: async (exp) => {
    const farmId = resolveFarmId(exp?.farmId);
    return expenseMutations.create(farmId, exp);
  },

  updateExpense: async (id, exp) => {
    const farmId = resolveFarmId(exp?.farmId);
    return expenseMutations.update(farmId, id, exp);
  },

  deleteExpense: async (id) => {
    const farmId = resolveFarmId();
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
      quantity: Number(item.quantity) || 0,
      cost: Number(item.cost || 0),
      minStock: Number(item.minStock || 5),
      status: Number(item.quantity) <= Number(item.minStock || 5) ? 'Low Stock' : 'In Stock',
      dateAdded: item.dateAdded || new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...inventory];
    setItem(KEYS.INVENTORY, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.INVENTORY } }));
    return newItem;
  },

  updateItem: (id, updates) => {
    const inventory = getItem(KEYS.INVENTORY, []);
    const updated = inventory.map(item => {
      if (item.id === id) {
        const next = { ...item, ...updates };
        next.quantity = Number(next.quantity) || 0;
        next.minStock = Number(next.minStock || 5);
        next.status = next.quantity <= next.minStock ? 'Low Stock' : 'In Stock';
        return next;
      }
      return item;
    });
    setItem(KEYS.INVENTORY, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.INVENTORY } }));
    return updated.find(i => i.id === id);
  },

  recordMovement: (id, changeQty, type = 'usage', notes = '') => {
    const inventory = getItem(KEYS.INVENTORY, []);
    const updated = inventory.map(item => {
      if (item.id === id) {
        const delta = Number(changeQty) || 0;
        const newQty = type === 'addition' ? Number(item.quantity) + delta : Math.max(0, Number(item.quantity) - delta);
        const minStock = Number(item.minStock || 5);
        return {
          ...item,
          quantity: newQty,
          status: newQty <= minStock ? (newQty === 0 ? 'Out of Stock' : 'Low Stock') : 'In Stock',
          lastMovement: {
            type,
            quantity: delta,
            date: new Date().toISOString().split('T')[0],
            notes
          }
        };
      }
      return item;
    });
    setItem(KEYS.INVENTORY, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.INVENTORY } }));
    return updated.find(i => i.id === id);
  },

  deleteItem: (id) => {
    const inventory = getItem(KEYS.INVENTORY, []);
    const updated = inventory.filter((i) => i.id !== id);
    setItem(KEYS.INVENTORY, updated);
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: KEYS.INVENTORY } }));
    return true;
  }
};

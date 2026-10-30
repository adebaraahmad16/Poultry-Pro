import { createInventory, updateInventory, moveInventory, deleteOperation } from './supabase/operationsService';
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
  getInventory: () => getItem(KEYS.INVENTORY, []), // Display cache only; writes always use Supabase.
  addItem: createInventory,
  updateItem: updateInventory,
  recordMovement: moveInventory,
  deleteItem: id => deleteOperation('inventory', id),
};

import { getItem, setItem, KEYS } from './storageService';

export const salesService = {
  getSales: () => getItem(KEYS.SALES, []),

  createSale: (sale) => {
    const sales = getItem(KEYS.SALES, []);
    const qty = Number(sale.quantity);
    const unitPrice = Number(sale.unitPrice);
    const totalAmount = qty * unitPrice;

    const newSale = {
      ...sale,
      id: `sale-${Date.now()}`,
      quantity: qty,
      unitPrice: unitPrice,
      totalAmount,
      date: sale.date || new Date().toISOString().split('T')[0]
    };
    const updated = [newSale, ...sales];
    setItem(KEYS.SALES, updated);
    return newSale;
  },

  updateSaleStatus: (id, paymentStatus) => {
    const sales = getItem(KEYS.SALES, []);
    const updated = sales.map((s) => (s.id === id ? { ...s, paymentStatus } : s));
    setItem(KEYS.SALES, updated);
  },

  deleteSale: (id) => {
    const sales = getItem(KEYS.SALES, []);
    const updated = sales.filter((s) => s.id !== id);
    setItem(KEYS.SALES, updated);
    return true;
  }
};

export const customerService = {
  getCustomers: () => getItem(KEYS.CUSTOMERS, []),

  createCustomer: (customer) => {
    const customers = getItem(KEYS.CUSTOMERS, []);
    const newCustomer = {
      ...customer,
      id: `cust-${Date.now()}`,
      totalPurchases: Number(customer.totalPurchases || 0),
      outstandingBalance: Number(customer.outstandingBalance || 0)
    };
    const updated = [newCustomer, ...customers];
    setItem(KEYS.CUSTOMERS, updated);
    return newCustomer;
  },

  deleteCustomer: (id) => {
    const customers = getItem(KEYS.CUSTOMERS, []);
    const updated = customers.filter((c) => c.id !== id);
    setItem(KEYS.CUSTOMERS, updated);
    return true;
  }
};

export const expenseService = {
  getExpenses: () => getItem(KEYS.EXPENSES, []),

  createExpense: (exp) => {
    const expenses = getItem(KEYS.EXPENSES, []);
    const newExp = {
      ...exp,
      id: `exp-${Date.now()}`,
      amount: Number(exp.amount),
      date: exp.date || new Date().toISOString().split('T')[0]
    };
    const updated = [newExp, ...expenses];
    setItem(KEYS.EXPENSES, updated);
    return newExp;
  },

  deleteExpense: (id) => {
    const expenses = getItem(KEYS.EXPENSES, []);
    const updated = expenses.filter((e) => e.id !== id);
    setItem(KEYS.EXPENSES, updated);
    return true;
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
    return newItem;
  },

  deleteItem: (id) => {
    const inventory = getItem(KEYS.INVENTORY, []);
    const updated = inventory.filter((i) => i.id !== id);
    setItem(KEYS.INVENTORY, updated);
    return true;
  }
};

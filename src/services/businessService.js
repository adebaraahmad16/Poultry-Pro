import { getItem, setItem, KEYS } from './storageService';
import { API_BASE_URL } from './apiConfig';

export const salesService = {
  getSales: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sales`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.SALES, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, loading sales locally:', err);
    }
    return getItem(KEYS.SALES, []);
  },

  createSale: async (sale) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (res.ok) {
        const newSale = await res.json();
        const sales = getItem(KEYS.SALES, []);
        setItem(KEYS.SALES, [newSale, ...sales]);
        return newSale;
      }
    } catch (err) {
      console.warn('API error, saving sale locally:', err);
    }

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

  updateSaleStatus: async (id, paymentStatus) => {
    try {
      await fetch(`${API_BASE_URL}/sales/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus })
      });
    } catch (err) {
      console.warn('API error updating sale status:', err);
    }
    const sales = getItem(KEYS.SALES, []);
    const updated = sales.map((s) => (s.id === id ? { ...s, paymentStatus } : s));
    setItem(KEYS.SALES, updated);
  },

  deleteSale: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/sales/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const sales = getItem(KEYS.SALES, []);
    const updated = sales.filter((s) => s.id !== id);
    setItem(KEYS.SALES, updated);
    return true;
  }
};

export const customerService = {
  getCustomers: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.CUSTOMERS, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, loading customers locally:', err);
    }
    return getItem(KEYS.CUSTOMERS, []);
  },

  createCustomer: async (customer) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      if (res.ok) {
        const newCustomer = await res.json();
        const customers = getItem(KEYS.CUSTOMERS, []);
        setItem(KEYS.CUSTOMERS, [newCustomer, ...customers]);
        return newCustomer;
      }
    } catch (err) {
      console.warn('API error, saving customer locally:', err);
    }

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

  deleteCustomer: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
    const customers = getItem(KEYS.CUSTOMERS, []);
    const updated = customers.filter((c) => c.id !== id);
    setItem(KEYS.CUSTOMERS, updated);
    return true;
  }
};

export const expenseService = {
  getExpenses: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`);
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.EXPENSES, data);
        return data;
      }
    } catch (err) {
      console.warn('API error, loading expenses locally:', err);
    }
    return getItem(KEYS.EXPENSES, []);
  },

  createExpense: async (exp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exp)
      });
      if (res.ok) {
        const newExp = await res.json();
        const expenses = getItem(KEYS.EXPENSES, []);
        setItem(KEYS.EXPENSES, [newExp, ...expenses]);
        return newExp;
      }
    } catch (err) {
      console.warn('API error, saving expense locally:', err);
    }

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

  deleteExpense: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error:', err);
    }
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

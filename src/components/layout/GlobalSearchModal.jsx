import React, { useState } from 'react';
import { Search, X, Layers, Users, DollarSign, Receipt, Package, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { flocks, customers, sales, expenses, inventory, workers } = useFarm();

  if (!isOpen) return null;

  const results = [];
  if (query.trim().length > 1) {
    const q = query.toLowerCase();

    flocks.forEach((f) => {
      if (f.name.toLowerCase().includes(q) || f.breed.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)) {
        results.push({ type: 'Flock', title: f.name, sub: `${f.type} • ${f.currentBirds} birds`, path: `/farm/flocks/${f.id}`, icon: Layers });
      }
    });

    customers.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.type.toLowerCase().includes(q)) {
        results.push({ type: 'Customer', title: c.name, sub: `${c.type} • ${c.phone}`, path: '/business/customers', icon: Users });
      }
    });

    sales.forEach((s) => {
      if (s.customerName.toLowerCase().includes(q) || s.product.toLowerCase().includes(q)) {
        results.push({ type: 'Sale', title: `${s.product} - ${s.customerName}`, sub: `₦${s.totalAmount?.toLocaleString()} • ${s.paymentStatus}`, path: '/business/sales', icon: DollarSign });
      }
    });

    expenses.forEach((e) => {
      if (e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)) {
        results.push({ type: 'Expense', title: e.description, sub: `₦${e.amount?.toLocaleString()} • ${e.category}`, path: '/business/expenses', icon: Receipt });
      }
    });

    inventory.forEach((i) => {
      if (i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) {
        results.push({ type: 'Inventory', title: i.name, sub: `${i.quantity} ${i.unit} • ${i.status}`, path: '/business/inventory', icon: Package });
      }
    });

    workers.forEach((w) => {
      if (w.name.toLowerCase().includes(q) || w.role.toLowerCase().includes(q)) {
        results.push({ type: 'Worker', title: w.name, sub: `${w.role} • ${w.assignedPen}`, path: '/management/workers', icon: UserCheck });
      }
    });
  }

  const handleSelect = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flocks, customers, sales, expenses, inventory, workers..."
            className="w-full bg-transparent text-slate-800 text-base placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length <= 1 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Type at least 2 characters to search across your farm data...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((res, idx) => {
                const Icon = res.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(res.path)}
                    className="p-3 rounded-xl hover:bg-emerald-50 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900">{res.title}</p>
                        <p className="text-xs text-slate-500">{res.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-emerald-200/60 group-hover:text-emerald-800">
                      {res.type}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">No matching farm records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bird,
  Layers,
  Egg,
  Wheat,
  HeartPulse,
  Syringe,
  Pill,
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
  Package,
  UserCheck,
  CheckSquare,
  FileText,
  PieChart,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ className = "" }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "Farm Management",
      items: [
        { name: "Farm Overview", path: "/farm", icon: Bird },
        { name: "Flocks & Birds", path: "/farm/flocks", icon: Layers }
      ]
    },
    {
      title: "Production",
      items: [
        { name: "Egg Production", path: "/production/eggs", icon: Egg },
        { name: "Feed Management", path: "/production/feed", icon: Wheat }
      ]
    },
    {
      title: "Health & Mortality",
      items: [
        { name: "Health Overview", path: "/health", icon: HeartPulse },
        { name: "Vaccinations", path: "/health/vaccinations", icon: Syringe },
        { name: "Medication", path: "/health/medication", icon: Pill },
        { name: "Mortality Tracking", path: "/health/mortality", icon: TrendingDown }
      ]
    },
    {
      title: "Business & Sales",
      items: [
        { name: "Sales", path: "/business/sales", icon: DollarSign },
        { name: "Customers", path: "/business/customers", icon: Users },
        { name: "Expenses", path: "/business/expenses", icon: Receipt },
        { name: "Inventory", path: "/business/inventory", icon: Package }
      ]
    },
    {
      title: "Operations",
      items: [
        { name: "Workers", path: "/management/workers", icon: UserCheck },
        { name: "Tasks", path: "/management/tasks", icon: CheckSquare }
      ]
    },
    {
      title: "Analytics",
      items: [
        { name: "Reports", path: "/reports", icon: FileText },
        { name: "Profit & Loss", path: "/reports/profit-loss", icon: PieChart }
      ]
    },
    {
      title: "Account",
      items: [
        { name: "Settings", path: "/settings", icon: Settings }
      ]
    }
  ];

  return (
    <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 ${className}`}>
      {/* Brand Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <img 
          src="/favicon.svg" 
          alt="PoultryPro Logo" 
          className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-900/40 object-contain hover:scale-105 transition-transform" 
        />
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            Poultry<span className="text-emerald-400">Pro</span>
          </h1>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/90">Smart Farm OS</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    end={item.path === '/dashboard' || item.path === '/farm' || item.path === '/health' || item.path === '/reports' || item.path === '/settings'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50" />
        </button>
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import { Search, Bell, Menu, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearchModal from './GlobalSearchModal';

export default function Navbar({ onOpenMobileMenu }) {
  const { user } = useAuth();
  const { farm, notifications } = useFarm();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Mobile Menu Button & Farm Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/favicon.svg" alt="PoultryPro Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-bold text-sm text-slate-900 tracking-tight hidden sm:inline">
            Poultry<span className="text-emerald-600">Pro</span>
          </span>
        </div>

        {/* Farm Selector Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/80">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px] sm:max-w-[200px]">
            {farm.name || 'My Poultry Farm'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Center Search Input Trigger */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100/70 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 w-64 lg:w-96 transition-all"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span className="flex-1 text-left">Search flocks, sales, expenses, workers...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white rounded border border-slate-200 text-slate-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Search button for mobile */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        {/* User Profile Avatar */}
        <a
          href="/settings/profile"
          className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/20">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Farm Owner'}</p>
            <p className="text-[10px] font-medium text-emerald-600">{user?.role || 'Owner'}</p>
          </div>
        </a>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

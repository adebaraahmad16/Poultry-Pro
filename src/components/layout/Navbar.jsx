import { useProfile } from '../../context/ProfileContext';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, ChevronDown, Building2 } from '../common/Icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearchModal from './GlobalSearchModal';
import ProfileAvatar from '../common/ProfileAvatar';

export default function Navbar({ onOpenMobileMenu }) {
  const { logout } = useAuth();
  const { fullName, avatarUrl } = useProfile();
  const name = fullName.trim() || 'Farmer';
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    const close = event => { if (event.type === 'keydown' ? event.key === 'Escape' : !profileRef.current?.contains(event.target)) setProfileOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  const { farm, notifications } = useFarm();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = (notifications || []).filter((n) => !n.isRead && !n.read).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  return (
    <header className="min-w-0 shrink-0 gap-2 bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-3 flex items-center justify-between">
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
        <div className="hidden sm:flex min-w-0 items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/80">
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
        className="hidden xl:flex min-w-0 items-center gap-3 px-4 py-2 bg-slate-100/70 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 w-64 transition-all"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span className="flex-1 text-left">Search flocks, sales, expenses, workers...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white rounded border border-slate-200 text-slate-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Search button for mobile */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Search farm records"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-all active:scale-95"
          >
            <Bell className="w-5 h-5 stroke-[1.9]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-emerald-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        {/* User Profile Avatar */}
        <div className="relative min-w-0" ref={profileRef}>
          <button type="button" aria-label={`Account menu for ${name}`} aria-expanded={profileOpen} onClick={() => setProfileOpen(open => !open)} className="flex min-h-11 min-w-11 max-w-full items-center gap-2 rounded-xl px-1 text-left focus-visible:outline-emerald-600">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ring-2 ring-emerald-500/20">
              <ProfileAvatar src={avatarUrl} name={name} alt={`${name} profile picture`} className="h-full w-full" />
            </span>
            <span className="hidden max-w-[140px] min-[425px]:block sm:max-w-[180px] text-xs font-semibold text-slate-800 truncate"><span className="sm:hidden">{name.split(/\s+/)[0]}</span><span className="hidden sm:inline">{name}</span></span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          </button>
          {profileOpen && <div className="absolute right-0 z-40 mt-2 w-56 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <p className="break-words border-b p-3 text-sm font-semibold text-slate-800">{name}</p>
            <Link to="/settings/profile" onClick={() => setProfileOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-slate-50">My Profile</Link>
            <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-slate-50">Account Settings</Link>
            <button type="button" onClick={async () => { setProfileOpen(false); await logout(); navigate('/login', { replace: true }); }} className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-red-700 hover:bg-red-50">Logout</button>
          </div>}
        </div>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

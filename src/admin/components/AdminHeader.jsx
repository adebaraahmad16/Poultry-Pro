import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, Search, ExternalLink, User, Settings, LogOut, Bird } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';

export default function AdminHeader({
  setMobileOpen,
  isCollapsed,
  setIsCollapsed
}) {
  const { currentAdmin, logoutAdmin, notifications, tickets } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Page Title from pathname
  const path = location.pathname.replace('/admin', '');
  const getPageTitle = () => {
    if (!path || path === '' || path === '/' || path === '/dashboard') return 'Platform Dashboard Overview';
    if (path.startsWith('/farmers')) return 'Farmers & Farm Owners Management';
    if (path.startsWith('/farms')) return 'Farms & Multi-Poultry Directory';
    if (path.startsWith('/poultry-types')) return 'Poultry Types & Modules';
    if (path.startsWith('/subscriptions')) return 'Subscription Plans & Tiers';
    if (path.startsWith('/payments')) return 'Payments & Revenue Transactions';
    if (path.startsWith('/notifications')) return 'Broadcast Notifications & Alerts';
    if (path.startsWith('/support')) return 'Customer Support Center';
    if (path.startsWith('/reports')) return 'Reports, Analytics & Exports';
    if (path.startsWith('/website-content')) return 'Landing Page Website CMS';
    if (path.startsWith('/administrators')) return 'Admin Management & Role RBAC';
    if (path.startsWith('/audit-logs')) return 'Security Audit Trail Logs';
    if (path.startsWith('/settings')) return 'Platform Global Settings';
    if (path.startsWith('/health')) return 'System Health & Service Monitor';
    if (path.startsWith('/profile')) return 'Administrator Profile';
    return 'PoultryPro Super Admin';
  };

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/admin/farmers?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const pendingTicketsCount = tickets.filter((t) => t.status === 'Open').length;

  return (
    <header className="min-w-0 h-16 gap-2 bg-white border-b border-slate-200 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle, Landing Page Logo & Page Title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo in Title Bar (Same as Landing Page) */}
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 mr-1" aria-label="PoultryPro Admin">
          <span className="w-9 h-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-sm shrink-0">
            <Bird className="w-5 h-5 stroke-[2.5]" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 hidden sm:inline-block">
            Poultry<span className="text-emerald-600">Pro</span>
          </span>
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span>Admin</span>
            <span>/</span>
            <span className="text-emerald-700 capitalize">
              {location.pathname.split('/')[2] || 'Dashboard'}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none mt-0.5 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications & Admin Menu */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearchSubmit} className="hidden xl:block relative w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search farmer or farm..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
          />
        </form>

        {/* View Farmer Portal Button */}
        <Link
          to="/dashboard"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          title="Open Farmer Dashboard"
        >
          <span>Farmer OS</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition relative"
            title="Notifications & Alerts"
          >
            <Bell className="w-5 h-5" />
            {pendingTicketsCount > 0 && (
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto mt-2 sm:w-96 max-h-[75dvh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Platform Alerts & Tickets
                </span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                  {pendingTicketsCount} Open Tickets
                </span>
              </div>

              <div className="py-2 divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {tickets.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    to="/admin/support"
                    onClick={() => setNotifOpen(false)}
                    className="py-2.5 block hover:bg-slate-50 rounded-lg px-2 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{t.farmerName}</span>
                      <span className="text-[10px] font-semibold text-rose-600 uppercase">{t.priority}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{t.subject}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{t.dateCreated}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/admin/support"
                  onClick={() => setNotifOpen(false)}
                  className="w-full text-center block text-xs font-bold text-emerald-700 hover:underline py-1"
                >
                  View All Support Tickets &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Popover */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-50 border border-slate-200 rounded-2xl transition"
          >
            {currentAdmin?.avatar ? (
              <img
                src={currentAdmin.avatar}
                alt={currentAdmin?.name || 'Admin'}
                className="w-8 h-8 rounded-xl object-cover shrink-0 border border-emerald-600/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentAdmin?.name?.[0] || 'A'}
              </div>
            )}
            <div className="hidden lg:block text-left pr-2">
              <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[100px]">
                {currentAdmin?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {currentAdmin?.role || 'Super Admin'}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{currentAdmin?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentAdmin?.email}</p>
                <span className="mt-1.5 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold uppercase">
                  {currentAdmin?.role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Platform Settings
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  Farmer OS Portal
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

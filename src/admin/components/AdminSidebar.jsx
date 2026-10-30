import useAdminDialog from './useAdminDialog';
import { MessageSquare } from 'lucide-react';
import { useContacts } from '../context/ContactContext';
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Bird, CreditCard, DollarSign, Bell, Headphones, BarChart3, Globe, UserCheck, ShieldAlert, Settings, Activity, User, LogOut, ChevronLeft, ChevronRight, X } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import useSidebarScroll from '../../components/layout/useSidebarScroll';

const NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Farmers', path: '/admin/farmers', icon: Users },
      { name: 'Farms', path: '/admin/farms', icon: Building2 },
      { name: 'Poultry Types', path: '/admin/poultry-types', icon: Bird }
    ]
  },
  {
    title: 'BUSINESS',
    items: [
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
      { name: 'Payments & Transactions', path: '/admin/payments', icon: DollarSign },
      { name: 'Revenue Analytics', path: '/admin/revenue', icon: BarChart3 },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { name: 'Contact Messages', path: '/admin/contact-messages', icon: MessageSquare },
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Support Center', path: '/admin/support', icon: Headphones }
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 }
    ]
  },
  {
    title: 'PLATFORM',
    items: [
      { name: 'Website Content', path: '/admin/website-content', icon: Globe },
      { name: 'Admin Management', path: '/admin/administrators', icon: UserCheck },
      { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      { name: 'Platform Health', path: '/admin/health', icon: Activity }
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { name: 'My Profile', path: '/admin/profile', icon: User }
    ]
  }
];

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { currentAdmin, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const { stats } = useContacts();
  const desktopScroll = useSidebarScroll(`admin:${currentAdmin?.id || 'signed-out'}:desktop`);
  const mobileScroll = useSidebarScroll(`admin:${currentAdmin?.id || 'signed-out'}:mobile:${mobileOpen}`);
  const drawer = useRef(null);
  useAdminDialog(mobileOpen, () => setMobileOpen(false), drawer);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const resize = () => { if (media.matches) setMobileOpen(false); };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, [setMobileOpen]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const sidebarContent = (collapsed, mobile = false) => (
    <div className="h-full min-h-0 flex flex-col justify-between bg-[#123524] text-white select-none">
      {/* Brand Header */}
      <div className="min-h-0 flex flex-1 flex-col">
        <div className="h-16 shrink-0 px-4 flex items-center justify-between border-b border-emerald-900/60">
          <NavLink to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden" aria-label="PoultryPro home">
            <span className="w-10 h-10 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-md shrink-0">
              <Bird className="w-6 h-6 stroke-[2.5]" />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-xl font-extrabold tracking-tight text-white block leading-none">
                  Poultry<span className="text-emerald-400">Pro</span>
                </span>
                <span className="text-[10px] tracking-widest font-bold uppercase text-emerald-400/80 block mt-1">
                  Super Admin
                </span>
              </div>
            )}
          </NavLink>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden h-11 w-11 flex items-center justify-center text-emerald-300 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Badge Banner */}
        {!collapsed && (
          <div className="px-4 py-3 bg-[#0d261a] border-b border-emerald-900/40 flex items-center gap-2.5">
            {currentAdmin?.avatar ? (
              <img
                src={currentAdmin.avatar}
                alt={currentAdmin?.name || 'Admin'}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-emerald-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentAdmin?.name?.[0] || 'A'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {currentAdmin?.name || 'Adebara Ahmad'}
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                {currentAdmin?.role || 'Super Admin'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Link Groups */}
        <div ref={mobile ? mobileScroll : desktopScroll} data-sidebar-scroll={mobile ? 'admin-mobile' : 'admin-desktop'} className="min-h-0 flex-1 py-4 px-2 space-y-5 overflow-y-auto overscroll-contain custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `relative flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-[#15803D] text-white shadow-xs'
                          : 'text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white'
                      } ${collapsed ? 'justify-center px-2' : ''}`
                    }
                    aria-label={collapsed ? item.name : undefined}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {item.path === '/admin/contact-messages' && stats?.unread > 0 && <span aria-label={`${stats.unread} unread contact messages`} className={`${collapsed ? 'absolute top-0 right-0' : 'ml-auto'} shrink-0 rounded-full bg-blue-600 text-white text-[10px] px-1.5 py-0.5`}>{stats.unread > 99 ? '99+' : stats.unread}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Logout Action */}
          <div className="pt-2 border-t border-emerald-900/40">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors ${
                collapsed ? 'justify-center px-2' : ''
              }`}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Collapse Toggle Footer for Desktop */}
      <div className={`${mobile ? 'hidden' : 'hidden lg:flex'} shrink-0 p-3 border-t border-emerald-900/60 items-center justify-between`}>
        {!collapsed && (
          <span className="text-[11px] text-emerald-300/80 font-medium">v1.2 Commercial Admin</span>
        )}
        <button
          onClick={() => setIsCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white transition ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-30 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div ref={drawer} id="admin-mobile-navigation" tabIndex={-1} role="dialog" aria-modal="true" aria-label="Admin navigation" className="relative w-[85vw] max-w-80 h-dvh min-h-0 shadow-2xl z-10 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#123524]" onClick={e=>{if(e.target.closest('a'))setMobileOpen(false);}}>
            {sidebarContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
}

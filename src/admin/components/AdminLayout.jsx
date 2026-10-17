import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAdmin } from '../context/AdminContext';

export default function AdminLayout() {
  const { dataError, refreshAllAdminData } = useAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-workspace min-h-dvh min-w-0 bg-[#F8FAF9] flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Workspace Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <AdminHeader
          setMobileOpen={setMobileOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {dataError && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p>{dataError}</p>
            <button onClick={refreshAllAdminData} className="mt-2 rounded-lg border border-amber-400 px-4 py-2 font-semibold">Retry loading data</button>
          </div>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

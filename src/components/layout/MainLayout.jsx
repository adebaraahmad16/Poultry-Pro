import React, { useState, useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileSidebar from './MobileSidebar';
import TrialBanner from '../common/TrialBanner';
import PoultrySelector from './PoultrySelector';
import { useRawFarm } from '../../context/FarmContext';

export default function MainLayout() {
  const main = useRef(null);
  const { pathname } = useLocation();
  useLayoutEffect(() => { if (main.current) main.current.scrollTop = 0; }, [pathname]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const {activeTypeId,selectedFarmId,dataLoading,dataError,refreshAllData}=useRawFarm();

  return (
    <div className="farmer-workspace flex h-dvh bg-[#F8FAF9] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex shrink-0" />

      {/* Mobile Drawer */}
      <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onOpenMobileMenu={() => setIsMobileOpen(true)} />
        <PoultrySelector compact />
        <TrialBanner />

        <main ref={main} className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="min-w-0 max-w-7xl mx-auto">
            {dataError && <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">{dataError}<button className="ml-3 underline" onClick={refreshAllData}>Retry</button></div>}
            {dataLoading?<p role="status" className="p-6 text-sm text-slate-500">Loading selected farm records…</p>:<Outlet key={`${selectedFarmId}:${activeTypeId}`} />}
          </div>
        </main>
      </div>
    </div>
  );
}

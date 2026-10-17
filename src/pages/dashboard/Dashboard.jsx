import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoultryData } from '../../context/FarmContext';
import { usePoultry } from '../../context/PoultryContext';
import PoultrySelector from '../../components/layout/PoultrySelector';
import AllPoultryDashboard from '../../components/dashboard/AllPoultryDashboard';
import PoultryDashboard from '../../components/dashboard/PoultryDashboard';
import QuickActionModals from '../../components/dashboard/QuickActionModals';

/**
 * Dashboard dispatcher — POULTRY TYPE PERSONALIZATION:
 * - One poultry type managed  → that type's dashboard opens automatically.
 * - Multiple types managed    → poultry selector + "All Poultry" overview.
 * - Every type gets its own metrics, charts, actions and records.
 */
export default function Dashboard() {
  const { selectedTypeIds } = usePoultryData();
  const { activeTypeId, activeType, showSelector } = usePoultry();
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();
  const openAction = action => {
    if (action === 'flock') return setActiveModal(action);
    navigate(`/daily-records?category=${({egg:'eggs',expense:'expenses',sale:'sales'})[action] || action}`);
  };

  // No poultry types yet (fresh account that skipped onboarding) → fallback
  if (selectedTypeIds.length === 0) {
    return <AllPoultryDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Poultry Selector — only when managing multiple types */}
      {showSelector && <div className="hidden md:block"><PoultrySelector /></div>}

      {activeTypeId === 'all' || !activeType ? (
        <AllPoultryDashboard />
      ) : (
        <PoultryDashboard key={`dashboard-${activeTypeId}`} poultryType={activeType} onQuickAction={openAction} />
      )}

      {/* Quick Action Modals — scoped to the active poultry type (remounted per type to reset forms) */}
      <QuickActionModals
        key={`quick-actions-${activeTypeId}`}
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        poultryType={activeTypeId === 'all' ? null : activeType}
      />
    </div>
  );
}

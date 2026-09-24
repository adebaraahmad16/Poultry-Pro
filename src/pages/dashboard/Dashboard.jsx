import React, { useState } from 'react';
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

  // No poultry types yet (fresh account that skipped onboarding) → fallback
  if (selectedTypeIds.length === 0) {
    return <AllPoultryDashboard />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Poultry Selector — only when managing multiple types */}
      {showSelector && <PoultrySelector />}

      {activeTypeId === 'all' || !activeType ? (
        <AllPoultryDashboard />
      ) : (
        <PoultryDashboard key={activeTypeId} poultryType={activeType} onQuickAction={setActiveModal} />
      )}

      {/* Quick Action Modals — scoped to the active poultry type (remounted per type to reset forms) */}
      <QuickActionModals
        key={activeTypeId}
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        poultryType={activeTypeId === 'all' ? null : activeType}
      />
    </div>
  );
}

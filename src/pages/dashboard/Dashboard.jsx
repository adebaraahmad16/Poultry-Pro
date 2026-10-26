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
  const openAction = (action, flockId = null) => {
    const flockQuery = flockId ? `&flockId=${flockId}` : '';
    switch (action) {
      case 'egg':
      case 'eggs':
        navigate(`/production/eggs?action=record${flockQuery}`);
        break;
      case 'feed':
        navigate(`/production/feed?action=feed${flockQuery}`);
        break;
      case 'mortality':
        navigate(`/health/mortality?action=record${flockQuery}`);
        break;
      case 'vaccination':
      case 'vaccine':
        navigate(`/health/vaccinations?action=record${flockQuery}`);
        break;
      case 'medication':
        navigate(`/health/medication?action=record${flockQuery}`);
        break;
      case 'expense':
      case 'expenses':
        navigate(`/business/expenses?action=record${flockQuery}`);
        break;
      case 'sale':
      case 'sales':
        navigate(`/business/sales?action=record${flockQuery}`);
        break;
      case 'flock':
        navigate(`/farm/flocks?action=record`);
        break;
      default:
        navigate(`/farm/flocks`);
    }
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

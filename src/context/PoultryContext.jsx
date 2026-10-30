import React, { createContext, useContext, useMemo } from 'react';

import { useRawFarm } from './FarmContext';

import { POULTRY_TYPE_MAP } from '../constants/poultryTypes';

const PoultryContext = createContext(null);

export function PoultryProvider({ children }) {
  const farm = useRawFarm();

  const { availableTypeIds, activeTypeId, selectPoultryType } = farm;

  const selectedTypes = useMemo(() => {
    return availableTypeIds
      .map((id) => POULTRY_TYPE_MAP[id])
      .filter(Boolean);
  }, [availableTypeIds]);

  const value = useMemo(() => ({
    activeTypeId,

    activeType: POULTRY_TYPE_MAP[activeTypeId] ?? null,

    selectedTypes,

    isAllView: activeTypeId === 'all',

    showSelector: selectedTypes.length > 0,

    selectPoultryType,
  }), [activeTypeId, selectedTypes, selectPoultryType]);

  return (
    <PoultryContext.Provider value={value}>
      {children}
    </PoultryContext.Provider>
  );
}

export function usePoultry() {
  const context = useContext(PoultryContext);

  if (!context) {
    throw new Error(
      'usePoultry must be used inside PoultryProvider.'
    );
  }

  return context;
}

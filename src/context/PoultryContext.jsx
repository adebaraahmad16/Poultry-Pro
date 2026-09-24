import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePoultryData } from './FarmContext';

const PoultryContext = createContext();

/**
 * Holds the farmer's currently selected poultry type for the dashboard.
 * 'all' shows the farm-wide overview; otherwise a poultry type id
 * (e.g. 'broilers', 'layers'). When the farmer manages only one poultry type,
 * that type is locked in automatically — no selector is shown.
 */
export const PoultryProvider = ({ children }) => {
  const { selectedTypeIds, selectedTypes } = usePoultryData();

  const [activeTypeId, setActiveTypeId] = useState(() => {
    const saved = localStorage.getItem('poultrypro_active_poultry_type');
    if (saved && (saved === 'all' || selectedTypeIds.includes(saved))) return saved;
    // Rule: if only one poultry type is managed, open that type directly
    return selectedTypeIds.length === 1 ? selectedTypeIds[0] : 'all';
  });

  // Keep the active selection valid when the farmer changes their poultry types
  useEffect(() => {
    setActiveTypeId((current) => {
      if (current !== 'all' && !selectedTypeIds.includes(current)) {
        const next = selectedTypeIds.length === 1 ? selectedTypeIds[0] : 'all';
        localStorage.setItem('poultrypro_active_poultry_type', next);
        return next;
      }
      return current;
    });
  }, [selectedTypeIds]);

  const selectPoultryType = (typeId) => {
    setActiveTypeId(typeId);
    localStorage.setItem('poultrypro_active_poultry_type', typeId);
  };

  const activeType = selectedTypes.find((t) => t.id === activeTypeId) || null;

  return (
    <PoultryContext.Provider
      value={{
        activeTypeId,
        activeType,
        selectedTypes,
        isAllView: activeTypeId === 'all',
        showSelector: selectedTypeIds.length > 1,
        selectPoultryType
      }}
    >
      {children}
    </PoultryContext.Provider>
  );
};

export const usePoultry = () => useContext(PoultryContext);

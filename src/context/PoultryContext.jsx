import React, { createContext, useContext } from 'react';
import { useRawFarm } from './FarmContext';
import { POULTRY_TYPE_MAP } from '../constants/poultryTypes';
const PoultryContext=createContext();
export function PoultryProvider({children}) {
  const farm=useRawFarm();
  const selectedTypes=farm.availableTypeIds.map(id=>POULTRY_TYPE_MAP[id]).filter(Boolean);
  return <PoultryContext.Provider value={{activeTypeId:farm.activeTypeId,activeType:POULTRY_TYPE_MAP[farm.activeTypeId]||null,selectedTypes,isAllView:farm.activeTypeId==='all',showSelector:selectedTypes.length>0,selectPoultryType:farm.selectPoultryType}}>{children}</PoultryContext.Provider>;
}
export const usePoultry=()=>useContext(PoultryContext);
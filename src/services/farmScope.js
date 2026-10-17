let selectedFarmId='';
let selectedPoultryType='all';
export const getSelectedFarmId=()=>selectedFarmId;
export const setSelectedFarmId=id=>{selectedFarmId=id||'';};
export const getSelectedPoultryType=()=>selectedPoultryType;
export const setSelectedPoultryType=id=>{selectedPoultryType=id||'all';};

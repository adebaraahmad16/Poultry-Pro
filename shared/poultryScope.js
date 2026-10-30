export const POULTRY_SCOPES = {
  broilers: ['Broiler'], layers: ['Layer'], turkeys: ['Turkey'], cockerels: ['Cockerel'],
  chicks: ['Chick','Chicken','Pullet'], ducks: ['Duck'], geese: ['Goose'],
  'guinea-fowl': ['Guinea Fowl'], quails: ['Quail'], other: ['Other'],
};
export function poultryTypeId(value) {
  const text=String(value||'').trim().toLowerCase();
  if(text==='all') return 'all';
  if(POULTRY_SCOPES[text]) return text;
  return Object.keys(POULTRY_SCOPES).find(id=>POULTRY_SCOPES[id].some(t=>t.toLowerCase()===text))||null;
}
export function availableTypeIds(profile,flocks=[]) {
  return [...new Set([...(Array.isArray(profile?.poultryTypes)?profile.poultryTypes:Array.isArray(profile?.poultry_types)?profile.poultry_types:[]),...(Array.isArray(flocks)?flocks:[]).map(f=>f?.type)].map(poultryTypeId).filter(id=>id&&id!=='all'))];
}
export function scopeFarmData(data,typeId='all') {
  if(typeId==='all') return data;
  const flocks=data.flocks.filter(f=>poultryTypeId(f.type)===typeId),ids=new Set(flocks.map(f=>f.id));
  const belongs=r=>r.flockId?ids.has(r.flockId):poultryTypeId(r.poultryType)===typeId;
  const result={...data,flocks};
  for(const key of ['eggs','mortality','vaccinations','medications','sales','expenses','weightRecords','dailyRecords']) result[key]=(data[key]||[]).filter(belongs);
  return result;
}
export function selectionKey(userId,farmId) { return `poultrypro:poultry:${userId}:${farmId}`; }
export function restoreSelection(saved,available) {
  const id=poultryTypeId(saved);
  return id==='all'||available.includes(id)?id:available.length===1?available[0]:'all';
}

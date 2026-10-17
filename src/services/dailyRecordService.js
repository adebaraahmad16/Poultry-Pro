import { request, authHeaders } from './planCatalog';
import { API_BASE_URL } from './apiConfig';
export const dailyRecordService = {
  farms: () => request('/daily-records/farms'),
  load: farmId => request(`/daily-records?farmId=${encodeURIComponent(farmId)}`),
  save: record => request(`/daily-records${record.id ? '/'+encodeURIComponent(record.id) : ''}`,{method:record.id?'PUT':'POST',body:JSON.stringify(record)}),
  remove: record => request(`/daily-records/${encodeURIComponent(record.id)}`,{method:'DELETE',body:JSON.stringify({updatedAt:record.updatedAt,farmId:record.farmId})}),
  audit: record => request(`/daily-records/${encodeURIComponent(record.id)}/audit?farmId=${encodeURIComponent(record.farmId)}`),
  export: async filters => {
    const res=await fetch(`${API_BASE_URL}/daily-records/export?${new URLSearchParams(filters)}`,{headers:authHeaders()});
    if(!res.ok) throw new Error((await res.json()).error || 'Export failed.');
    const url=URL.createObjectURL(await res.blob());
    const anchor=document.createElement('a');anchor.href=url;anchor.download='daily-farm-records.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
};

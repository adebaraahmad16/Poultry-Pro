import { useEffect, useState } from 'react';
import { getCatalog, refreshCatalog } from '../../services/planCatalog';
export function usePlanCatalog() {
 const [plans,setPlans] = useState(getCatalog);
 const [loading,setLoading] = useState(!getCatalog().length);
 const [error,setError] = useState('');
 const refresh = async () => { try { await refreshCatalog(); setError(''); } catch(e) { setError(e.message); } finally { setLoading(false); } };
 useEffect(() => {
  const changed = e => setPlans(e.detail);
  window.addEventListener('admin_plans_updated',changed);
  refresh();
  const interval = setInterval(refresh,30000);
  window.addEventListener('focus',refresh);
  return () => { clearInterval(interval); window.removeEventListener('focus',refresh); window.removeEventListener('admin_plans_updated',changed); };
 },[]);
 return {plans,loading,error,retry:refresh};
}

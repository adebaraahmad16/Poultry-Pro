import { request, authHeaders, checkedFetch } from './planCatalog';
import { getItem, setItem, KEYS } from './storageService';
import { API_BASE_URL } from './apiConfig';

export const flockService = {
  getAll: async () => {
    try {
      const res = await checkedFetch(`${API_BASE_URL}/flocks`, {headers:authHeaders()});
      if (res.ok) {
        const data = await res.json();
        setItem(KEYS.FLOCKS, data);
        return data;
      }
    } catch (err) {
      console.warn('API unavailable, loading from local storage:', err);
    }
    return getItem(KEYS.FLOCKS, []);
  },
  
  getById: (id) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    return flocks.find((f) => f.id === id) || null;
  },
  
  create: async (flockData) => {
    const newFlock = await request('/flocks',{method:'POST',body:JSON.stringify(flockData)});
    const flocks = getItem(KEYS.FLOCKS, []);
    setItem(KEYS.FLOCKS,[newFlock,...flocks]);
    return newFlock;
  },

  delete: async (id) => {
    await request(`/flocks/${id}`,{method:'DELETE'});
    const flocks = getItem(KEYS.FLOCKS, []);
    const updated = flocks.filter((f) => f.id !== id);
    setItem(KEYS.FLOCKS, updated);
    return true;
  },

  recordMortality: (flockId, count) => {
    const flocks = getItem(KEYS.FLOCKS, []);
    const updated = flocks.map((f) => {
      if (f.id === flockId) {
        const current = Math.max(0, Number(f.currentBirds) - Number(count));
        return { ...f, currentBirds: current };
      }
      return f;
    });
    setItem(KEYS.FLOCKS, updated);
  }
};

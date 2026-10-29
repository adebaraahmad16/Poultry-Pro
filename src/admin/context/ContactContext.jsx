import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAdmin } from './AdminContext';
import { getContactStats } from '../../services/contactService';
const Context = createContext();
export function ContactProvider({ children }) {
  const { isAdminLoggedIn } = useAdmin();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!isAdminLoggedIn) return;
    const request = ++generation.current;
    try {
      const next = await getContactStats();
      if (request === generation.current) { setStats(next); setError(''); }
    }
    catch { if (request === generation.current) { setStats(null); setError('Contact messages could not be loaded. Please retry.'); } }
  }, [isAdminLoggedIn]);
  useEffect(() => {
    if (!isAdminLoggedIn) { generation.current++; setStats(null); setError(''); return; }
    refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('contact-messages-changed', refresh);
    return () => { generation.current++; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('contact-messages-changed', refresh); };
  }, [isAdminLoggedIn, refresh]);
  return <Context.Provider value={{ stats, error, refresh }}>{children}</Context.Provider>;
}
export const useContacts = () => useContext(Context);

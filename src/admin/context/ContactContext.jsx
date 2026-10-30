import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAdmin } from './AdminContext';
import { getContactStats } from '../../services/contactService';
import { adminRequestMessage, isAdminAccessError } from '../../services/adminAccess';
const Context = createContext();
export function ContactProvider({ children }) {
  const { supabaseAdminReady, currentAdmin } = useAdmin();
  const ready = Boolean(supabaseAdminReady);
  const owner = ready ? currentAdmin?.id : null;
  const [result, setResult] = useState({ owner: null, stats: null, error: '' });
  const active = useRef(null); active.current = owner;
  const pending = useRef(null);
  const blocked = useRef(false);
  const refresh = useCallback(({ manual = true } = {}) => {
    if (!ready || !owner || (!manual && blocked.current)) return Promise.resolve();
    if (pending.current?.owner === owner) return pending.current.promise;
    const request = (async () => {
      try {
        const stats = await getContactStats();
        if (active.current === owner) { blocked.current = false; setResult({ owner, stats, error: '' }); }
      } catch (error) {
        if (active.current === owner) {
          blocked.current = isAdminAccessError(error);
          setResult({ owner, stats: null, error: adminRequestMessage(error) });
        }
      }
    })().finally(() => { if (pending.current?.promise === request) pending.current = null; });
    pending.current = { owner, promise: request };
    return request;
  }, [ready, owner]);
  useEffect(() => {
    blocked.current = false;
    if (!ready || !owner) return;
    const automatic = () => { if (document.visibilityState !== 'hidden') refresh({ manual: false }); };
    automatic();
    const timer = setInterval(automatic, 15000);
    window.addEventListener('focus', automatic);
    window.addEventListener('contact-messages-changed', automatic);
    return () => { clearInterval(timer); window.removeEventListener('focus', automatic); window.removeEventListener('contact-messages-changed', automatic); };
  }, [ready, owner, refresh]);
  const current = ready && result.owner === owner;
  return <Context.Provider value={{ ready, stats: current ? result.stats : null, error: current ? result.error : '', refresh }}>{children}</Context.Provider>;
}
export const useContacts = () => useContext(Context);

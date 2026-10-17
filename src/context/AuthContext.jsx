import { getSessionToken } from '../services/sessionService.js';
import { request } from '../services/planCatalog';
import { subscriptionService } from '../services/subscriptionService';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeStorage, getItem, setItem, KEYS } from '../services/storageService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sessionMessage,setSessionMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    initializeStorage();
    const expired = event => {
      setUser(null); setIsLoggedIn(false); setSessionMessage(event.detail); setLoading(false);
    };
    window.addEventListener('farmer_session_expired',expired);
    const token = getSessionToken();
    if (!token) {
      if(localStorage.getItem(KEYS.IS_LOGGED_IN) === 'true') setSessionMessage('Please sign in again to reconnect your saved account. Your saved records have been retained.');
      localStorage.setItem(KEYS.IS_LOGGED_IN,'false');
      setLoading(false);
    } else {
      request('/auth/session').then(result => {
        if(cancelled || getSessionToken() !== token) return;
        setItem(KEYS.USER,result.user); setUser(result.user); setIsLoggedIn(true);
        localStorage.setItem(KEYS.IS_LOGGED_IN,'true');
      }).catch(error => {
        if(!cancelled) {setIsLoggedIn(false);setUser(null);setSessionMessage(error.status === 401 ? 'Your session has expired. Please sign in again.' : 'Unable to restore your session. Check the backend connection and try signing in again.');}
      }).finally(() => {if(!cancelled) setLoading(false);});
    }
    return () => {cancelled = true;window.removeEventListener('farmer_session_expired',expired);};
  }, []);

  const login = async (email, password) => {
    const result = await request('/auth/login', { method:'POST', body:JSON.stringify({email,password}) });
    setSessionMessage('');
    localStorage.setItem('poultrypro_token',result.token);
    const sub = await request('/subscription/current');
    subscriptionService.saveSubscription(sub);
    setItem(KEYS.USER,result.user);
    localStorage.setItem(KEYS.IS_LOGGED_IN,'true'); setUser(result.user); setIsLoggedIn(true);
    return true;
  };

  const register = async (formData) => {
    const result = await request('/auth/register',{method:'POST',body:JSON.stringify(formData)});
    setSessionMessage('');
    localStorage.setItem('poultrypro_token',result.token);
    subscriptionService.saveSubscription(await request('/subscription/current'));
    const newUser = result.user;
    setItem(KEYS.USER, newUser);

    // Update farm profile: name + selected poultry types
    const currentFarm = getItem(KEYS.FARM, {});
    const updatedFarm = {
      ...currentFarm,
      name: formData.farmName || 'My Farm',
      poultryTypes: Array.isArray(formData.poultryTypes) ? formData.poultryTypes : []
    };
    setItem(KEYS.FARM, updatedFarm);

    localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    setUser(newUser);
    setIsLoggedIn(true);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('poultrypro_token');
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, register, logout, sessionMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

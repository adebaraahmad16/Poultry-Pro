import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeStorage, getItem, setItem, KEYS } from '../services/storageService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const storedUser = getItem(KEYS.USER);
    const loggedInState = localStorage.getItem(KEYS.IS_LOGGED_IN) === 'true';
    setUser(storedUser);
    setIsLoggedIn(loggedInState);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    let currentUser = getItem(KEYS.USER);
    if (!currentUser || !currentUser.email) {
      currentUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        phone: '',
        role: 'Farm Owner'
      };
      setItem(KEYS.USER, currentUser);
    }
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    setUser(currentUser);
    setIsLoggedIn(true);
    return true;
  };

  const register = (formData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone || '',
      role: 'Farm Owner'
    };
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
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

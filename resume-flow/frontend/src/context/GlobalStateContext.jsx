import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        setUser({ id: userId, name: '用户' });
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const actions = {
    login: (userData) => {
      setUser(userData);
      localStorage.setItem('userId', userData.id);
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem('userId');
    },
    updateUser: (userData) => {
      setUser(prev => ({ ...prev, ...userData }));
    }
  };

  const value = {
    user,
    loading,
    actions,
    isAuthenticated: !!user
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

export default GlobalStateContext;

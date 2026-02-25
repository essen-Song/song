import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);

  const updateThemeByTime = () => {
    if (autoSwitch && !manualOverride) {
      const hour = new Date().getHours();
      const isNightTime = hour >= 18 || hour < 6;
      setIsDark(isNightTime);
    }
  };

  useEffect(() => {
    updateThemeByTime();
    const interval = setInterval(updateThemeByTime, 60000);
    return () => clearInterval(interval);
  }, [autoSwitch, manualOverride]);

  useEffect(() => {
    document.body.className = isDark ? 'dark-mode' : 'minimal-mode';
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    setManualOverride(true);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const value = {
    isDark,
    autoSwitch,
    manualOverride,
    toggleTheme,
    getCurrentTime,
    themeMode: isDark ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

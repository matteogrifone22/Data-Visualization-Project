import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('isDark');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [isMonochromacy, setIsMonochromacy] = useState(() => {
    const stored = localStorage.getItem('isMonochromacy');
    return stored !== null ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('isDark', JSON.stringify(isDark));
    localStorage.setItem('isMonochromacy', JSON.stringify(isMonochromacy));
  }, [isDark, isMonochromacy]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, isMonochromacy, setIsMonochromacy }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

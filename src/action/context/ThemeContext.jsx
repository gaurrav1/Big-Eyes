import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

const getSystemPreference = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => 
    localStorage.getItem('themePreference') || THEMES.SYSTEM
  );
  
  const [systemTheme, setSystemTheme] = useState(getSystemPreference());

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = themePreference === THEMES.SYSTEM 
      ? systemTheme 
      : themePreference;
      
    root.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('themePreference', themePreference);
  }, [themePreference, systemTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e) => {
      setSystemTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      themePreference, 
      setThemePreference
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
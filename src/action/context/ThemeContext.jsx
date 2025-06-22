import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system', // Added system option
};

const getSystemPreference = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;

export const ThemeProvider = ({ children }) => {
  // Initialize with stored preference or system
  const [themePreference, setThemePreference] = useState(() => 
    localStorage.getItem('themePreference') || THEMES.SYSTEM
  );
  
  // Track system theme separately
  const [systemTheme, setSystemTheme] = useState(getSystemPreference());

  // Apply theme to document and localStorage
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = themePreference === THEMES.SYSTEM 
      ? systemTheme 
      : themePreference;
      
    root.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('themePreference', themePreference);
  }, [themePreference, systemTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e) => {
      setSystemTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  // Cycle through all three options
  const toggleTheme = () => {
    setThemePreference(prev => {
      if (prev === THEMES.LIGHT) return THEMES.DARK;
      if (prev === THEMES.DARK) return THEMES.SYSTEM;
      return THEMES.LIGHT;
    });
  };

  return (
    <ThemeContext.Provider value={{ 
      themePreference, 
      setThemePreference, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
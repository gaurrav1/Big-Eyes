import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const getSystemPreference = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
  ? THEMES.DARK 
  : THEMES.LIGHT;

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || getSystemPreference());

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

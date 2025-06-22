export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
  ? THEMES.DARK 
  : THEMES.LIGHT;

export const defaultTheme = systemTheme || THEMES.LIGHT;

export const themeColors = {
  light: {
    '--bg': '#ffffff',
    '--fg': '#000000',
    '--accent': '#0a84ff',
    '--border': '#e0e0e0',
    '--hover': '#f5f5f7',
    '--muted': '#8e8e93',
    '--toggle-bg': '#f2f2f7',
  },
  dark: {
    '--bg': '#121212',
    '--fg': '#ffffff',
    '--accent': '#0a84ff',
    '--border': '#2c2c2e',
    '--hover': '#1c1c1e',
    '--muted': '#8e8e93',
    '--toggle-bg': '#2c2c2e',
  },
};
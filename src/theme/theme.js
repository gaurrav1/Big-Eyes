// src/theme/theme.js
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}
const systemTheme =
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
export const defaultTheme = systemTheme || THEMES.LIGHT;

export const themeColors = {
  light: {
    '--bg': '#ffffff',
    '--fg': '#000000',
    '--accent': '#6200ee',
  },
  dark: {
    '--bg': '#121212',
    '--fg': '#ffffff',
    '--accent': '#bb86fc',
  },
}

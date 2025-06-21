// src/action/App.jsx
import React from 'react'
import { ThemeProvider, useTheme } from '../theme/ThemeContext'
import styles from './App.module.css'

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () =>
    setTheme(theme === 'light' ? 'dark' : 'light')

  return (
    <button onClick={toggleTheme} className={styles.button}>
      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  )
}

export const App = () => {
  return (
    <ThemeProvider>
      <div className={styles.container}>
        <h1 className={styles.title}>React Extension</h1>
        <ThemeSwitcher />
      </div>
    </ThemeProvider>
  )
}

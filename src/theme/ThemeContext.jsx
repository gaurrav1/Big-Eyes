import React, { createContext, useContext, useEffect, useState } from 'react'
import { THEMES, defaultTheme, themeColors } from './theme'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['theme'], (result) => {
        setTheme(result.theme || defaultTheme)
      })
    } else {
      console.warn('chrome.storage.local is not available')
    }
  }, [])

  useEffect(() => {
    if (chrome?.storage?.local && theme) {
      chrome.storage.local.set({ theme })
      const root = document.documentElement
      const palette = themeColors[theme]
      for (const key in palette) {
        root.style.setProperty(key, palette[key])
      }
    }
  }, [theme])


  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

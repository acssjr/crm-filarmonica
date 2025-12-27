import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('theme') as Theme) || 'light'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches)

      if (isDark) {
        root.classList.add('dark')
        setResolvedTheme('dark')
      } else {
        root.classList.remove('dark')
        setResolvedTheme('light')
      }
    }

    applyTheme()

    // Listen for system theme changes when in 'system' mode
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    if (theme === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  }
}

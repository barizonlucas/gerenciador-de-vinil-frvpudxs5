import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { useAuth } from './AuthContext'
import { updateProfile } from '@/services/profile'

type Theme = 'dark' | 'light'

interface ThemeProviderProps {
  children: ReactNode
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  isThemeLoading: boolean
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
)

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { profile, loading: authLoading } = useAuth()
  const [theme, setTheme] = useState<Theme>('dark') // Default to dark
  const [isThemeLoading, setIsThemeLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      const userTheme = profile?.theme_preference || 'dark'
      setTheme(userTheme as Theme)
      setIsThemeLoading(false)
    }
  }, [profile, authLoading])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  const handleSetTheme = useCallback(
    async (newTheme: Theme) => {
      setTheme(newTheme)
      if (profile) {
        try {
          await updateProfile({ theme_preference: newTheme })
        } catch (error) {
          console.error('Failed to update theme preference in DB', error)
        }
      }
    },
    [profile],
  )

  const value = {
    theme,
    setTheme: handleSetTheme,
    isThemeLoading,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

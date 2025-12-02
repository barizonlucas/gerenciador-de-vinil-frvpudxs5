import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '@/services/profile'
import { Profile } from '@/types/profile'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  sendPasswordResetEmail: (
    email: string,
  ) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const refreshProfile = useCallback(async () => {
    try {
      const profileData = await getProfile()
      setProfile(profileData)
    } catch (error) {
      console.error('Failed to fetch profile', error)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await refreshProfile()
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // We call refreshProfile but don't await it to avoid blocking updates
          refreshProfile()
        } else {
          setProfile(null)
        }

        if (event === 'PASSWORD_RECOVERY') {
          navigate('/update-password')
        } else if (event === 'SIGNED_OUT') {
          // Optional: explicit redirect, though ProtectedRoute handles it usually
          setProfile(null)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate, refreshProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setProfile(null)
      navigate('/login')
    }
    return { error }
  }

  const sendPasswordResetEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

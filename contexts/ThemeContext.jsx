import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark') // Padrão dark
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  // Obtém userId do Supabase diretamente (sem depender de AuthContext)
  useEffect(() => {
    const getUserId = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id || null)
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        setUserId(null)
      }
    }

    getUserId()

    // Escuta mudanças de autenticação
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user?.id || null)
      })

      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [])

  // Carrega tema do banco ao fazer login ou preferência do navegador
  useEffect(() => {
    const loadTheme = async () => {
      // Se não estiver logado, usa dark como padrão
      if (!userId || !isSupabaseConfigured || !supabase) {
        setTheme('dark') // Sempre dark como padrão
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', userId)
          .single()

        if (!error && data?.theme_preference) {
          setTheme(data.theme_preference)
        } else {
          // Fallback: dark como padrão
          setTheme('dark')
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error)
        // Fallback para dark
        setTheme('dark')
      } finally {
        setLoading(false)
      }
    }

    loadTheme()
  }, [userId])

  useEffect(() => {
    if (loading) return

    // Aplica o tema ao documento
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }

    // Salva no banco quando mudar (apenas se usuário estiver logado)
    if (userId && isSupabaseConfigured && supabase && !loading) {
      supabase
        .from('profiles')
        .update({ theme_preference: theme })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao salvar tema:', error)
          }
        })
    }
  }, [theme, userId, loading])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Enquanto carrega, retorna com tema dark
  if (loading) {
    // Aplica dark imediatamente para evitar flash
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
    return <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, isDark: true }}>{children}</ThemeContext.Provider>
  }

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}

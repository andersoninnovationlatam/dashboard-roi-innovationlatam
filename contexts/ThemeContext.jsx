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
        // CORREÇÃO: Usa getSession() em vez de getUser() para validar sessão
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('⚠️ Erro ao obter sessão no ThemeContext:', error.message)
          setUserId(null)
          return
        }

        setUserId(session?.user?.id || null)
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        setUserId(null)
      }
    }

    getUserId()

    // Escuta mudanças de autenticação
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // CORREÇÃO: Não reage a eventos intermediários para evitar loop
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUserId(session?.user?.id || null)
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUserId(null)
        }
      })

      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [])

  // Carrega tema do banco ao fazer login ou preferência do navegador
  useEffect(() => {
    let isMounted = true // Evita race conditions

    const loadTheme = async () => {
      // Se não estiver logado, usa dark como padrão
      if (!userId || !isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setTheme('dark') // Sempre dark como padrão
          setLoading(false)
        }
        return
      }

      try {
        // CORREÇÃO: Valida sessão antes de buscar tema
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          console.warn('⚠️ Sessão inválida ao carregar tema, usando padrão')
          if (isMounted) {
            setTheme('dark')
            setLoading(false)
          }
          return
        }

        // CRÍTICO: Aguarda um momento para RLS sincronizar
        await new Promise(resolve => setTimeout(resolve, 100))

        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', userId)
          .single()

        if (!isMounted) return // Component foi desmontado

        // CORREÇÃO: Tratamento específico para erro 406 (usuário deletado ou RLS)
        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('406') || error.code === 'PGRST301') {
            console.warn('⚠️ Perfil não acessível (RLS ou não encontrado), usando tema padrão')
          } else if (error.code !== '42P01') { // Ignora erro de tabela não existir
            console.warn('⚠️ Erro ao carregar tema:', error.message, error.code)
          }
          setTheme('dark')
        } else if (data?.theme_preference) {
          setTheme(data.theme_preference)
        } else {
          // Fallback: dark como padrão
          setTheme('dark')
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error)
        if (isMounted) {
          // Fallback para dark
          setTheme('dark')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTheme()

    return () => {
      isMounted = false // Cleanup
    }
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
      const saveTheme = async () => {
        try {
          // Valida sessão antes de salvar
          const { data: { session } } = await supabase.auth.getSession()

          if (!session?.user) {
            console.warn('⚠️ Sessão inválida, não é possível salvar tema')
            return
          }

          const { error } = await supabase
            .from('profiles')
            .update({ theme_preference: theme })
            .eq('id', userId)

          if (error) {
            // Silencia erros de RLS/406 para não poluir console
            if (error.code !== 'PGRST116' && error.code !== 'PGRST301' && !error.message?.includes('406')) {
              console.warn('⚠️ Não foi possível salvar tema:', error.message)
            }
          }
        } catch (error) {
          // Silencia erros ao salvar tema (não crítico)
          console.debug('Erro ao salvar tema (ignorado):', error)
        }
      }

      saveTheme()
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

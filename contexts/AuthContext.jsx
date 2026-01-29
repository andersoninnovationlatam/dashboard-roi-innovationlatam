import React, { createContext, useContext, useState, useEffect } from 'react'
import { authServiceSupabase } from '../services/authServiceSupabase'
import { supabase } from '../src/lib/supabase'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let intervalId = null
    
    // Verifica se há usuário logado no Supabase
    const checkUser = async () => {
      try {
        const currentUser = await authServiceSupabase.getCurrentUser()
        
        // Se tinha usuário mas getCurrentUser retornou null = sessão inválida
        if (!currentUser && user) {
          console.warn('🔒 Sessão inválida detectada, fazendo logout')
          setUser(null)
        } else if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Primeira verificação
    checkUser()

    // Revalida sessão a cada 5 minutos
    intervalId = setInterval(() => {
      if (user) {
        console.log('🔄 Revalidando sessão do usuário...')
        checkUser()
      }
    }, 5 * 60 * 1000) // 5 minutos

    // Escuta mudanças na autenticação
    let subscription = null
    try {
      const result = authServiceSupabase.onAuthStateChange((newUser, event) => {
        try {
          console.log('🔐 Auth event:', event)
          
          // CORREÇÃO: Ignora INITIAL_SESSION para evitar logs desnecessários
          if (event === 'INITIAL_SESSION') {
            // Apenas atualiza o usuário sem log adicional
            if (newUser) {
              setUser(newUser)
            }
            return
          }
          
          if (event === 'SIGNED_OUT') {
            console.log('🚪 Usuário deslogado')
            setUser(null)
          } else if (event === 'SIGNED_IN') {
            console.log('✅ Usuário logado')
            setUser(newUser)
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token renovado')
            setUser(newUser)
          } else if (event === 'USER_UPDATED') {
            console.log('📝 Usuário atualizado')
            setUser(newUser)
          } else if (event === 'USER_DELETED') {
            // CRÍTICO: Usuário foi deletado do Supabase
            console.error('🗑️ USUÁRIO DELETADO - Fazendo logout imediato e limpando sessão')
            setUser(null)
            // Força logout e limpa tudo
            authServiceSupabase.logout().then(() => {
              // Force redirect para login
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            }).catch(err => {
              console.error('Erro ao fazer logout após USER_DELETED:', err)
              // Mesmo com erro, redireciona
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            })
          } else if (!newUser) {
            // Qualquer evento sem usuário = logout
            console.warn('🔒 Evento de auth sem usuário, limpando estado')
            setUser(null)
          } else {
            setUser(newUser)
          }
        } catch (err) {
          console.error('Erro no callback de autenticação:', err)
        }
      })
      subscription = result?.subscription
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error)
      setLoading(false)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Erro ao desinscrever listener:', error)
      }
    }
  }, [])

  const login = async (email, senha) => {
    try {
      const result = await authServiceSupabase.login(email, senha)
      if (result.success) {
        setUser(result.user)
        return { success: true }
      }
      return result
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao fazer login' }
    }
  }

  const register = async (nome, email, senha) => {
    try {
      const result = await authServiceSupabase.register(nome, email, senha)
      if (result.success) {
        // Após registro, o usuário já está logado (Supabase faz isso automaticamente)
        setUser(result.user)
        return { success: true }
      }
      return result
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao registrar usuário' }
    }
  }

  const logout = async () => {
    try {
      await authServiceSupabase.logout()
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpa o estado local por segurança
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authServiceSupabase } from '../services/authServiceSupabase'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se há usuário logado no Supabase
    const checkUser = async () => {
      try {
        const currentUser = await authServiceSupabase.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escuta mudanças na autenticação
    let subscription = null
    try {
      const result = authServiceSupabase.onAuthStateChange((user, event) => {
        try {
          setUser(user)
          if (event === 'SIGNED_OUT') {
            setUser(null)
          }
        } catch (err) {
          console.error('Erro no callback de autenticação:', err)
        }
      })
      subscription = result?.subscription
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error)
      // Continua mesmo com erro para não quebrar a aplicação
      setLoading(false)
    }

    return () => {
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

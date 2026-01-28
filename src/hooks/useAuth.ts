import { useContext } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>
  register: (nome: string, email: string, senha: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

/**
 * Hook para acessar o contexto de autenticação
 * Retorna o usuário logado e funções de autenticação
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  
  return context as AuthContextType
}

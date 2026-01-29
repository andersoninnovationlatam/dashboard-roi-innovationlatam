/**
 * Serviço de Autenticação com Supabase
 * Gerencia login, registro e sessão do usuário usando Supabase Auth
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const authServiceSupabase = {
  /**
   * Registra um novo usuário no Supabase
   */
  async register(nome, email, senha) {
    if (!isSupabaseConfigured) {
      return { 
        success: false, 
        error: 'Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env' 
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome: nome
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Retorna dados do usuário (sem senha)
        const userData = {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome || nome,
          created_at: data.user.created_at
        }

        return { success: true, user: userData }
      }

      return { success: false, error: 'Erro ao criar usuário' }
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao registrar usuário' }
    }
  },

  /**
   * Faz login do usuário no Supabase
   */
  async login(email, senha) {
    if (!isSupabaseConfigured) {
      return { 
        success: false, 
        error: 'Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env' 
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

      if (error) {
        // Tratamento específico para email não confirmado
        if (error.message === 'Email not confirmed' || error.message.includes('email_not_confirmed')) {
          return { 
            success: false, 
            error: 'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação enviado por email. Se não recebeu, verifique a pasta de spam ou entre em contato com o suporte.',
            requiresConfirmation: true
          }
        }
        
        // Tratamento para credenciais inválidas
        if (error.message === 'Invalid login credentials' || error.message.includes('invalid')) {
          return {
            success: false,
            error: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          }
        }
        
        // Tratamento para usuário não encontrado
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          return {
            success: false,
            error: 'Usuário não encontrado. Verifique se você já se registrou.'
          }
        }
        
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Retorna dados do usuário
        const userData = {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome || email.split('@')[0],
          created_at: data.user.created_at
        }

        return { success: true, user: userData }
      }

      return { success: false, error: 'Erro ao fazer login' }
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao fazer login' }
    }
  },

  /**
   * Faz logout do usuário
   */
  async logout() {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase não está configurado' }
    }

    try {
      const { error } = await supabase.auth.signOut()
      
      // Limpeza adicional de cache local
      if (typeof window !== 'undefined') {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            console.warn('Erro ao remover chave:', key, e)
          }
        })
        
        try {
          sessionStorage.clear()
        } catch (e) {
          console.warn('Erro ao limpar sessionStorage:', e)
        }
      }
      
      if (error) {
        console.error('Erro ao fazer logout:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Verifica se há usuário logado
   */
  async isLoggedIn() {
    if (!isSupabaseConfigured) {
      return false
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      return false
    }
  },

  /**
   * Retorna o usuário atual com validação no servidor
   */
  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return null
    }

    try {
      // Passo 1: Verifica se existe sessão local
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return null
      }

      // Passo 2: CRÍTICO - Força refresh para validar com servidor
      // Isso garante que usuários deletados sejam deslogados
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.warn('Sessão inválida detectada:', refreshError.message)
        // Limpa sessão corrompida
        await supabase.auth.signOut()
        return null
      }

      const user = refreshData?.user
      if (!user) {
        console.warn('Usuário não existe mais no servidor')
        await supabase.auth.signOut()
        return null
      }

      // Passo 3: Retorna dados validados
      return {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
        created_at: user.created_at
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error)
      // Em caso de erro, limpa a sessão por segurança
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.error('Erro ao fazer logout de segurança:', e)
      }
      return null
    }
  },

  /**
   * Retorna a sessão atual
   */
  async getSession() {
    if (!isSupabaseConfigured) {
      return null
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Erro ao obter sessão:', error)
        return null
      }
      return session
    } catch (error) {
      console.error('Erro ao obter sessão:', error)
      return null
    }
  },

  /**
   * Escuta mudanças na autenticação
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
      return { subscription: { unsubscribe: () => {} } }
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
            created_at: session.user.created_at
          }
          callback(userData, event)
        } else {
          callback(null, event)
        }
      })
      return { subscription }
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error)
      return { subscription: { unsubscribe: () => {} } }
    }
  }
}

/**
 * Serviço de Autenticação com Supabase
 * Gerencia login, registro e sessão do usuário usando Supabase Auth
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'
import { userServiceSupabase } from './userServiceSupabase'

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
        // Buscar dados completos do usuário na tabela users
        const userRecord = await userServiceSupabase.getById(data.user.id)
        
        const userData = {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome || nome,
          organization_id: userRecord?.organization_id || null,
          role: userRecord?.role || 'viewer',
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
      
      let signInResult = null
      let signInError = null
      
      try {
        // Timeout explícito de 10 segundos para signInWithPassword
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password: senha
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: signInWithPassword demorou mais de 10 segundos')), 10000)
        )
        
        signInResult = await Promise.race([signInPromise, timeoutPromise])
        signInError = signInResult.error
      } catch (catchError) {
        signInError = catchError
      }
      
      const { data, error } = signInResult || { data: null, error: signInError }

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
        
        // CORREÇÃO CRÍTICA: Retorna sucesso imediatamente após autenticação
        // getById() será buscado assincronamente pelo AuthContext via onAuthStateChange
        const userData = {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome || email.split('@')[0],
          organization_id: null, // Será preenchido pelo AuthContext
          role: 'viewer', // Será preenchido pelo AuthContext
          created_at: data.user.created_at
        }
        
        // Buscar dados do usuário em background (não bloqueia login)
        userServiceSupabase.getById(data.user.id)
          .then(userRecord => {
            if (userRecord) {
              // Atualizar último login apenas se conseguiu buscar
              userServiceSupabase.updateLastLogin(data.user.id).catch(() => {})
            }
          })
          .catch(error => {
            // Não é crítico - login já foi bem-sucedido
            console.warn('Não foi possível buscar dados completos do usuário em background:', error.message)
          })

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
   * OTIMIZADO: Não força refresh desnecessário, timeout melhorado
   */
  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return null
    }

    try {
      // Passo 1: getSession() é rápido e não precisa timeout rigoroso
      // Usa timeout maior (10s) para dar tempo após login
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao obter sessão')), 10000)
      )
      
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ])
      
      if (sessionError || !session) {
        return null
      }

      const user = session.user
      if (!user) {
        return null
      }

      // OTIMIZAÇÃO: Busca dados do usuário de forma não-bloqueante
      // Se timeout ou erro, retorna dados básicos da sessão
      let userRecord = null
      try {
        // Timeout reduzido para 2s e não bloqueia
        const userPromise = userServiceSupabase.getById(user.id)
        const userTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
        
        userRecord = await Promise.race([userPromise, userTimeout])
      } catch (userError) {
        // Não é crítico - continua sem dados da tabela users
        // Retorna dados básicos da sessão que são suficientes
      }
      
      // Retorna dados validados (com dados da tabela users se disponível)
      return {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
        organization_id: userRecord?.organization_id || null,
        role: userRecord?.role || 'viewer',
        created_at: user.created_at
      }
    } catch (error) {
      // Erro silencioso - não mostra timeout como erro crítico
      if (!error.message?.includes('Timeout')) {
        console.error('Erro ao obter usuário:', error)
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        // CORREÇÃO CRÍTICA: Não busca getById() em TOKEN_REFRESHED - causa timeout desnecessário
        if (event === 'TOKEN_REFRESHED') {
          // Token renovado - não precisa buscar dados do usuário novamente
          if (session?.user) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
              organization_id: null, // Não busca - será mantido pelo estado atual
              role: 'viewer', // Não busca - será mantido pelo estado atual
              created_at: session.user.created_at
            }
            callback(userData, event)
          } else {
            callback(null, event)
          }
          return
        }

        if (session?.user) {
          // OTIMIZAÇÃO: Buscar dados do usuário com timeout curto e não-bloqueante
          // Se timeout, retorna dados básicos da sessão (suficiente para funcionar)
          let userRecord = null
          try {
            const userPromise = userServiceSupabase.getById(session.user.id)
            const userTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 2000)
            )
            userRecord = await Promise.race([userPromise, userTimeout])
          } catch (error) {
            // Timeout ou erro - não é crítico, usa dados básicos
            userRecord = null
          }
          
          const userData = {
            id: session.user.id,
            email: session.user.email,
            nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
            organization_id: userRecord?.organization_id || null,
            role: userRecord?.role || 'viewer',
            created_at: session.user.created_at
          }
          
          // Chama callback apenas uma vez com dados disponíveis
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

/**
 * Serviço de Usuários com Supabase
 * Gerencia CRUD de usuários com roles usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

// Cache para evitar múltiplas chamadas simultâneas para o mesmo ID
const pendingQueries = new Map()

export const userServiceSupabase = {
  /**
   * Retorna todos os usuários da organização atual (limitado por RLS)
   */
  async getAll() {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar usuários:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      return []
    }
  },

  /**
   * Retorna usuários por organização
   */
  async getByOrganizationId(organizationId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar usuários da organização:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar usuários da organização:', error)
      return []
    }
  },

  /**
   * Retorna usuário por ID
   * Implementa cache para evitar múltiplas chamadas simultâneas para o mesmo ID
   */
  async getById(id) {
    // Se já há uma query pendente para este ID, retorna a mesma promise
    if (pendingQueries.has(id)) {
      return pendingQueries.get(id)
    }

    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    // Cria promise para a query
    const queryPromise = (async () => {
      try {

        let queryResult = null
        let queryError = null

        try {
          // Timeout aumentado para 10 segundos (era 5)
          const queryPromise = supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single()

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: query demorou mais de 10 segundos')), 10000)
          )

          queryResult = await Promise.race([queryPromise, timeoutPromise])
          queryError = queryResult.error
        } catch (catchError) {
          queryError = catchError
        }

        const { data, error } = queryResult || { data: null, error: queryError }

        // Remove da cache quando completa (sucesso ou erro)
        pendingQueries.delete(id)

      if (error) {
        // Não loga timeout como erro crítico - é esperado em alguns casos
        if (!error.message?.includes('Timeout')) {
          console.error('Erro ao buscar usuário:', error)
        }
        return null
      }

        return data
      } catch (error) {
        // Remove da cache em caso de erro não tratado
        pendingQueries.delete(id)
        console.error('Erro ao buscar usuário:', error)
        return null
      }
    })()

    // Adiciona à cache antes de retornar
    pendingQueries.set(id, queryPromise)
    return queryPromise
  },

  /**
   * Retorna usuário por email
   */
  async getByEmail(email) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('Erro ao buscar usuário por email:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error)
      return null
    }
  },

  /**
   * Cria um novo usuário
   * Nota: Este método cria apenas o registro na tabela users.
   * O registro no auth.users deve ser criado separadamente via authServiceSupabase
   */
  async create(userData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Obter organização do usuário atual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Buscar organização do usuário atual
      const currentUser = await this.getById(session.user.id)
      if (!currentUser) {
        return { success: false, error: 'Usuário atual não encontrado' }
      }

      const organizationId = userData.organization_id || currentUser.organization_id

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id, // Deve ser o mesmo ID do auth.users
          organization_id: organizationId,
          email: userData.email,
          name: userData.name,
          password_hash: userData.password_hash || '', // Hash será gerenciado pelo auth
          role: userData.role || 'viewer',
          avatar_url: userData.avatar_url || null,
          is_active: userData.is_active !== undefined ? userData.is_active : true
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar usuário:', error)
        return { success: false, error: error.message }
      }

      return { success: true, user: data }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza um usuário existente
   */
  async update(id, userData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}

      if (userData.name !== undefined) updateData.name = userData.name
      if (userData.email !== undefined) updateData.email = userData.email
      if (userData.role !== undefined) updateData.role = userData.role
      if (userData.avatar_url !== undefined) updateData.avatar_url = userData.avatar_url
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active
      if (userData.last_login_at !== undefined) updateData.last_login_at = userData.last_login_at

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        return { success: false, error: error.message }
      }

      return { success: true, user: data }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta um usuário
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar usuário:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza último login do usuário
   */
  async updateLastLogin(userId) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error('Erro ao atualizar último login:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar último login:', error)
      return { success: false, error: error.message }
    }
  }
}

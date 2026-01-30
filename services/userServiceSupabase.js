/**
 * Serviço de Usuários com Supabase
 * Gerencia CRUD de usuários com roles usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

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
   */
  async getById(id) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userServiceSupabase.js:66', message: 'getById() ENTRY', data: { userId: id, isConfigured: !!isSupabaseConfigured, hasSupabase: !!supabase }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
    // #endregion

    if (!isSupabaseConfigured || !supabase) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userServiceSupabase.js:68', message: 'getById() ERROR - Não configurado', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
      // #endregion
      return null
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userServiceSupabase.js:72', message: 'getById() BEFORE query', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
      // #endregion

      let queryResult = null
      let queryError = null

      try {
        // Timeout explícito de 5 segundos para query
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: query demorou mais de 5 segundos')), 5000)
        )

        queryResult = await Promise.race([queryPromise, timeoutPromise])
        queryError = queryResult.error
      } catch (catchError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userServiceSupabase.js:90', message: 'getById() query CATCH', data: { errorMessage: catchError?.message, errorStack: catchError?.stack?.substring(0, 200), isTimeout: catchError?.message?.includes('Timeout') }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        queryError = catchError
      }

      const { data, error } = queryResult || { data: null, error: queryError }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userServiceSupabase.js:90', message: 'getById() AFTER query', data: { hasError: !!error, errorMessage: error?.message, errorCode: error?.code, errorStatus: error?.status, hasData: !!data, organizationId: data?.organization_id, role: data?.role }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
      // #endregion

      if (error) {
        console.error('Erro ao buscar usuário:', error)
        return null
      }

      return data
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userServiceSupabase.js:87', message: 'getById() CATCH ERROR', data: { errorMessage: error?.message }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
      // #endregion
      console.error('Erro ao buscar usuário:', error)
      return null
    }
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

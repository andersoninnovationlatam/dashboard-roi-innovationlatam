/**
 * Serviço de Projetos com Supabase
 * Gerencia CRUD de projetos usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const projectServiceSupabase = {
  /**
   * Retorna todos os projetos do usuário autenticado
   * @param {string} userId - ID do usuário (opcional, RLS já filtra automaticamente)
   */
  async getAll(userId) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      let query = supabase
        .from('projects')
        .select('*')
      
      // Se userId fornecido, filtra explicitamente (RLS já faz isso, mas é mais seguro)
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar projetos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
      return []
    }
  },

  /**
   * Retorna projeto por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar projeto:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar projeto:', error)
      return null
    }
  },

  /**
   * Cria um novo projeto
   */
  async create(projectData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar projeto:', error)
        return { success: false, error: error.message }
      }

      return { success: true, project: data }
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza um projeto existente
   */
  async update(id, projectData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar projeto:', error)
        return { success: false, error: error.message }
      }

      return { success: true, project: data }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta um projeto
   * @param {string} id - ID do projeto
   * @param {string} userId - ID do usuário (opcional, RLS já garante segurança)
   */
  async delete(id, userId) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // RLS já garante que só deleta projetos do usuário, mas podemos adicionar filtro explícito
      let query = supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { error } = await query

      if (error) {
        console.error('Erro ao deletar projeto:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
      return { success: false, error: error.message }
    }
  }
}

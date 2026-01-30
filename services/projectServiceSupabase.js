/**
 * Serviço de Projetos com Supabase
 * Gerencia CRUD de projetos usando Supabase (estrutura normalizada)
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'
import { userServiceSupabase } from './userServiceSupabase'

export const projectServiceSupabase = {
  /**
   * Retorna todos os projetos da organização do usuário autenticado
   * RLS já filtra automaticamente por organization_id
   */
  async getAll(limit = 1000) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      // OTIMIZAÇÃO: Limita resultados e seleciona apenas campos necessários
      const { data, error } = await supabase
        .from('projects')
        .select('id, organization_id, name, description, status, development_type, start_date, go_live_date, end_date, implementation_cost, monthly_maintenance_cost, business_area, sponsor, created_by, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(limit)

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
      // Obter sessão atual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.error('Sessão não encontrada ao criar projeto')
        return { success: false, error: 'Usuário não autenticado. Por favor, faça login novamente.' }
      }

      // Buscar organização do usuário (com timeout curto)
      let user = null
      try {
        const userPromise = userServiceSupabase.getById(session.user.id)
        const userTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
        user = await Promise.race([userPromise, userTimeout])
      } catch (error) {
        // Se falhar, tenta buscar diretamente do Supabase (mais rápido)
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', session.user.id)
            .single()
          if (userData) {
            user = userData
          }
        } catch (dbError) {
          // Se ainda falhar, retorna erro
          return { success: false, error: 'Não foi possível obter organização do usuário' }
        }
      }

      if (!user || !user.organization_id) {
        return { success: false, error: 'Usuário não possui organização associada' }
      }

      // Preparar dados do projeto
      const businessAreaValue = projectData.business_area || projectData.department || null

      const insertData = {
        organization_id: user.organization_id,
        name: projectData.name,
        description: projectData.description || null,
        status: projectData.status || 'planning',
        development_type: projectData.development_type || 'other',
        start_date: projectData.start_date || null,
        go_live_date: projectData.go_live_date || null,
        end_date: projectData.end_date || null,
        implementation_cost: projectData.implementation_cost || 0,
        monthly_maintenance_cost: projectData.monthly_maintenance_cost || 0,
        business_area: businessAreaValue,
        sponsor: projectData.sponsor || null,
        created_by: session.user.id,
        // Compatibilidade: campos legados ainda podem ser obrigatórios na tabela antiga
        user_id: session.user.id,
        department: businessAreaValue || 'Geral' // Valor padrão se department for NOT NULL
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
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
   * RLS já garante segurança (apenas admins podem deletar)
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar projeto:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Retorna projeto completo com organização e contagem de indicadores
   */
  async getCompleteById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organizations (*),
          indicators_normalized (id)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar projeto completo:', error)
        return null
      }

      if (data) {
        data.indicators_count = data.indicators_normalized?.length || 0
        delete data.indicators_normalized
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar projeto completo:', error)
      return null
    }
  }
}

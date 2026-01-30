/**
 * Serviço de Tracking (Acompanhamento Mensal) com Supabase
 * Gerencia CRUD de tracking_history usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const trackingService = {
  /**
   * Retorna todo o histórico de tracking de um indicador
   */
  async getByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('tracking_history')
        .select('*')
        .eq('indicator_id', indicatorId)
        .order('tracking_month', { ascending: false })

      if (error) {
        console.error('Erro ao buscar histórico de tracking:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico de tracking:', error)
      return []
    }
  },

  /**
   * Retorna tracking por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('tracking_history')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar tracking:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar tracking:', error)
      return null
    }
  },

  /**
   * Retorna tracking por indicador e mês
   */
  async getByIndicatorAndMonth(indicatorId, trackingMonth) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      // Garantir que trackingMonth está no formato correto (primeiro dia do mês)
      const monthDate = new Date(trackingMonth)
      monthDate.setDate(1)
      const formattedMonth = monthDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('tracking_history')
        .select('*')
        .eq('indicator_id', indicatorId)
        .eq('tracking_month', formattedMonth)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado
          return null
        }
        console.error('Erro ao buscar tracking por mês:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar tracking por mês:', error)
      return null
    }
  },

  /**
   * Cria um novo registro de tracking
   */
  async create(trackingData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Obter usuário atual
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || null

      // Garantir que trackingMonth está no formato correto (primeiro dia do mês)
      const monthDate = new Date(trackingData.tracking_month)
      monthDate.setDate(1)
      const formattedMonth = monthDate.toISOString().split('T')[0]

      // Verificar se já existe registro para este mês
      const existing = await this.getByIndicatorAndMonth(trackingData.indicator_id, formattedMonth)
      if (existing) {
        return { success: false, error: 'Já existe um registro de acompanhamento para este mês' }
      }

      const { data, error } = await supabase
        .from('tracking_history')
        .insert({
          indicator_id: trackingData.indicator_id,
          tracking_month: formattedMonth,
          actual_executions: trackingData.actual_executions,
          actual_hours_saved: trackingData.actual_hours_saved,
          actual_cost_ia: trackingData.actual_cost_ia,
          notes: trackingData.notes || null,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tracking:', error)
        return { success: false, error: error.message }
      }

      return { success: true, tracking: data }
    } catch (error) {
      console.error('Erro ao criar tracking:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza um registro de tracking existente
   */
  async update(id, trackingData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}
      
      if (trackingData.tracking_month !== undefined) {
        // Garantir formato correto
        const monthDate = new Date(trackingData.tracking_month)
        monthDate.setDate(1)
        updateData.tracking_month = monthDate.toISOString().split('T')[0]
      }
      if (trackingData.actual_executions !== undefined) updateData.actual_executions = trackingData.actual_executions
      if (trackingData.actual_hours_saved !== undefined) updateData.actual_hours_saved = trackingData.actual_hours_saved
      if (trackingData.actual_cost_ia !== undefined) updateData.actual_cost_ia = trackingData.actual_cost_ia
      if (trackingData.notes !== undefined) updateData.notes = trackingData.notes

      const { data, error } = await supabase
        .from('tracking_history')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar tracking:', error)
        return { success: false, error: error.message }
      }

      return { success: true, tracking: data }
    } catch (error) {
      console.error('Erro ao atualizar tracking:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta um registro de tracking
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('tracking_history')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar tracking:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar tracking:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Retorna histórico de tracking agrupado por mês para múltiplos indicadores
   */
  async getHistoryByProject(projectId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      // Buscar todos os indicadores do projeto e seus trackings
      const { data, error } = await supabase
        .from('tracking_history')
        .select(`
          *,
          indicators_normalized!inner (
            id,
            project_id
          )
        `)
        .eq('indicators_normalized.project_id', projectId)
        .order('tracking_month', { ascending: false })

      if (error) {
        console.error('Erro ao buscar histórico do projeto:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico do projeto:', error)
      return []
    }
  }
}

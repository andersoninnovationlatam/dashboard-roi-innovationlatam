/**
 * Serviço para gerenciar métricas calculadas de indicadores
 * Salva valores calculados na tabela indicator_calculated_metrics
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const indicatorCalculatedMetricsService = {
  /**
   * Salva ou atualiza métricas calculadas de um indicador
   */
  async upsertMetrics(indicatorId, metrics) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('⚠️ indicatorCalculatedMetricsService: Supabase não configurado')
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!indicatorId) {
      return { success: false, error: 'ID do indicador é obrigatório' }
    }

    try {
      const metricsToSave = {
        indicator_id: indicatorId,
        ...metrics,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('indicator_calculated_metrics')
        .upsert(metricsToSave, {
          onConflict: 'indicator_id'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar métricas calculadas:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao salvar métricas calculadas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Busca métricas calculadas de um indicador
   */
  async getByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    if (!indicatorId) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('indicator_calculated_metrics')
        .select('*')
        .eq('indicator_id', indicatorId)
        .maybeSingle()

      if (error) {
        // PGRST116 = não encontrado (ok com maybeSingle)
        if (error.code !== 'PGRST116') {
          console.error('Erro ao buscar métricas calculadas:', error)
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar métricas calculadas:', error)
      return null
    }
  },

  /**
   * Busca métricas calculadas de múltiplos indicadores
   */
  async getByIndicatorIds(indicatorIds) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    if (!indicatorIds || indicatorIds.length === 0) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('indicator_calculated_metrics')
        .select('*')
        .in('indicator_id', indicatorIds)

      if (error) {
        console.error('Erro ao buscar métricas calculadas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar métricas calculadas:', error)
      return []
    }
  },

  /**
   * Recalcula métricas usando database function (recomendado)
   * Chama a função PostgreSQL que calcula baseado nos dados do banco
   */
  async recalculateMetrics(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!indicatorId) {
      return { success: false, error: 'ID do indicador é obrigatório' }
    }

    try {
      const { data, error } = await supabase.rpc('calculate_indicator_metrics', {
        p_indicator_id: indicatorId
      })

      if (error) {
        console.error('❌ Erro ao recalcular métricas via database function:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao recalcular métricas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta métricas calculadas de um indicador
   */
  async deleteByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('indicator_calculated_metrics')
        .delete()
        .eq('indicator_id', indicatorId)

      if (error) {
        console.error('Erro ao deletar métricas calculadas:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar métricas calculadas:', error)
      return { success: false, error: error.message }
    }
  }
}

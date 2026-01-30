/**
 * Serviço de Métricas Customizadas com Supabase
 * Gerencia CRUD de custom_metrics usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const customMetricService = {
  /**
   * Retorna todas as métricas customizadas de um indicador
   */
  async getByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('custom_metrics')
        .select('*')
        .eq('indicator_id', indicatorId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar métricas customizadas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar métricas customizadas:', error)
      return []
    }
  },

  /**
   * Retorna métrica customizada por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('custom_metrics')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar métrica customizada:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar métrica customizada:', error)
      return null
    }
  },

  /**
   * Cria uma nova métrica customizada
   */
  async create(metricData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { data, error } = await supabase
        .from('custom_metrics')
        .insert({
          indicator_id: metricData.indicator_id,
          metric_name: metricData.metric_name,
          metric_unit: metricData.metric_unit,
          baseline_value: metricData.baseline_value,
          post_ia_value: metricData.post_ia_value,
          target_value: metricData.target_value || null,
          is_higher_better: metricData.is_higher_better !== undefined ? metricData.is_higher_better : true
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar métrica customizada:', error)
        return { success: false, error: error.message }
      }

      return { success: true, metric: data }
    } catch (error) {
      console.error('Erro ao criar métrica customizada:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Cria múltiplas métricas customizadas
   */
  async createMany(metricsData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!Array.isArray(metricsData) || metricsData.length === 0) {
      return { success: true, metrics: [] }
    }

    try {
      const { data, error } = await supabase
        .from('custom_metrics')
        .insert(metricsData)
        .select()

      if (error) {
        console.error('Erro ao criar métricas customizadas:', error)
        return { success: false, error: error.message }
      }

      return { success: true, metrics: data || [] }
    } catch (error) {
      console.error('Erro ao criar métricas customizadas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza uma métrica customizada
   */
  async update(id, metricData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}
      
      if (metricData.metric_name !== undefined) updateData.metric_name = metricData.metric_name
      if (metricData.metric_unit !== undefined) updateData.metric_unit = metricData.metric_unit
      if (metricData.baseline_value !== undefined) updateData.baseline_value = metricData.baseline_value
      if (metricData.post_ia_value !== undefined) updateData.post_ia_value = metricData.post_ia_value
      if (metricData.target_value !== undefined) updateData.target_value = metricData.target_value
      if (metricData.is_higher_better !== undefined) updateData.is_higher_better = metricData.is_higher_better

      const { data, error } = await supabase
        .from('custom_metrics')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar métrica customizada:', error)
        return { success: false, error: error.message }
      }

      return { success: true, metric: data }
    } catch (error) {
      console.error('Erro ao atualizar métrica customizada:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta uma métrica customizada
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('custom_metrics')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar métrica customizada:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar métrica customizada:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta todas as métricas customizadas de um indicador
   */
  async deleteByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('custom_metrics')
        .delete()
        .eq('indicator_id', indicatorId)

      if (error) {
        console.error('Erro ao deletar métricas customizadas:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar métricas customizadas:', error)
      return { success: false, error: error.message }
    }
  }
}

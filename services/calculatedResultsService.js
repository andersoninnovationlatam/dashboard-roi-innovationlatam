/**
 * Serviço de Resultados Calculados com Supabase
 * Gerencia CRUD de calculated_results usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const calculatedResultsService = {
  /**
   * Retorna resultado calculado mais recente de um indicador
   */
  async getLatestByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      // CORREÇÃO: Remover .single() e verificar se há dados antes de retornar
      const { data, error } = await supabase
        .from('calculated_results')
        .select('*')
        .eq('indicator_id', indicatorId)
        .order('calculation_date', { ascending: false })
        .limit(1)

      if (error) {
        // PGRST116 = não encontrado, 406 = Not Acceptable (pode ser RLS ou formato)
        if (error.code === 'PGRST116' || error.status === 406) {
          // Não encontrado ou acesso negado - não é crítico, retorna null silenciosamente
          return null
        }
        console.error('Erro ao buscar resultado calculado:', error)
        return null
      }

      // Retornar o primeiro resultado ou null se não houver dados
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Erro ao buscar resultado calculado:', error)
      return null
    }
  },

  /**
   * Retorna todos os resultados calculados de um indicador
   */
  async getByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('calculated_results')
        .select('*')
        .eq('indicator_id', indicatorId)
        .order('calculation_date', { ascending: false })

      if (error) {
        console.error('Erro ao buscar resultados calculados:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar resultados calculados:', error)
      return []
    }
  },

  /**
   * Retorna resultado calculado por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('calculated_results')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar resultado calculado:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar resultado calculado:', error)
      return null
    }
  },

  /**
   * Cria ou atualiza resultado calculado
   */
  async upsert(resultData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Verificar se já existe resultado para esta data e indicador
      const existing = await supabase
        .from('calculated_results')
        .select('id')
        .eq('indicator_id', resultData.indicator_id)
        .eq('calculation_date', resultData.calculation_date)
        .eq('period_type', resultData.period_type)
        .single()

      if (existing.data) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('calculated_results')
          .update({
            hours_saved: resultData.hours_saved,
            money_saved: resultData.money_saved,
            cost_baseline: resultData.cost_baseline,
            cost_post_ia: resultData.cost_post_ia,
            gross_savings: resultData.gross_savings,
            net_savings: resultData.net_savings,
            roi_percentage: resultData.roi_percentage,
            payback_months: resultData.payback_months
          })
          .eq('id', existing.data.id)
          .select()
          .single()

        if (error) {
          console.error('Erro ao atualizar resultado calculado:', error)
          return { success: false, error: error.message }
        }

        return { success: true, result: data }
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('calculated_results')
          .insert({
            indicator_id: resultData.indicator_id,
            calculation_date: resultData.calculation_date || new Date().toISOString().split('T')[0],
            period_type: resultData.period_type || 'monthly',
            hours_saved: resultData.hours_saved || 0,
            money_saved: resultData.money_saved || 0,
            cost_baseline: resultData.cost_baseline || 0,
            cost_post_ia: resultData.cost_post_ia || 0,
            gross_savings: resultData.gross_savings || 0,
            net_savings: resultData.net_savings || 0,
            roi_percentage: resultData.roi_percentage || 0,
            payback_months: resultData.payback_months || null
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar resultado calculado:', error)
          return { success: false, error: error.message }
        }

        return { success: true, result: data }
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar resultado calculado:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza resultado calculado
   */
  async update(id, resultData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}
      
      if (resultData.hours_saved !== undefined) updateData.hours_saved = resultData.hours_saved
      if (resultData.money_saved !== undefined) updateData.money_saved = resultData.money_saved
      if (resultData.cost_baseline !== undefined) updateData.cost_baseline = resultData.cost_baseline
      if (resultData.cost_post_ia !== undefined) updateData.cost_post_ia = resultData.cost_post_ia
      if (resultData.gross_savings !== undefined) updateData.gross_savings = resultData.gross_savings
      if (resultData.net_savings !== undefined) updateData.net_savings = resultData.net_savings
      if (resultData.roi_percentage !== undefined) updateData.roi_percentage = resultData.roi_percentage
      if (resultData.payback_months !== undefined) updateData.payback_months = resultData.payback_months

      // CORREÇÃO: Remover .single() pois pode retornar 0 linhas se RLS bloquear
      const { data, error } = await supabase
        .from('calculated_results')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Erro ao atualizar resultado calculado:', error)
        // Verificar se é erro de RLS ou registro não encontrado
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          return { success: false, error: 'Resultado calculado não encontrado ou sem permissão para atualizar' }
        }
        return { success: false, error: error.message || 'Erro ao atualizar resultado calculado' }
      }

      // Verificar se retornou dados (pode ser vazio se RLS bloqueou)
      if (!data || data.length === 0) {
        console.warn(`Update não retornou dados para calculated_result ${id} - possível bloqueio de RLS`)
        return { success: false, error: 'Não foi possível atualizar o resultado calculado. Verifique as permissões.' }
      }

      return { success: true, result: data[0] }
    } catch (error) {
      console.error('Erro ao atualizar resultado calculado:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta resultado calculado
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('calculated_results')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar resultado calculado:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar resultado calculado:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta todos os resultados calculados de um indicador
   */
  async deleteByIndicatorId(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('calculated_results')
        .delete()
        .eq('indicator_id', indicatorId)

      if (error) {
        console.error('Erro ao deletar resultados calculados:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar resultados calculados:', error)
      return { success: false, error: error.message }
    }
  }
}

/**
 * Serviço de Custos de Ferramentas com Supabase
 * Gerencia CRUD de tools_costs usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const toolCostService = {
  /**
   * Retorna todas as ferramentas de um indicador
   */
  async getByIndicatorId(indicatorId, scenario = null) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      let query = supabase
        .from('tools_costs')
        .select('*')
        .eq('indicator_id', indicatorId)

      if (scenario) {
        query = query.eq('scenario', scenario)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar ferramentas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar ferramentas:', error)
      return []
    }
  },

  /**
   * Retorna ferramenta por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('tools_costs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar ferramenta:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar ferramenta:', error)
      return null
    }
  },

  /**
   * Cria uma nova ferramenta
   */
  async create(toolData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { data, error } = await supabase
        .from('tools_costs')
        .insert({
          indicator_id: toolData.indicator_id,
          scenario: toolData.scenario,
          tool_name: toolData.tool_name,
          tool_category: toolData.tool_category,
          monthly_cost: toolData.monthly_cost,
          cost_per_execution: toolData.cost_per_execution || null,
          execution_time_seconds: toolData.execution_time_seconds || null,
          notes: toolData.notes || null
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar ferramenta:', error)
        return { success: false, error: error.message }
      }

      return { success: true, tool: data }
    } catch (error) {
      console.error('Erro ao criar ferramenta:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Cria múltiplas ferramentas
   */
  async createMany(toolsData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!Array.isArray(toolsData) || toolsData.length === 0) {
      return { success: true, tools: [] }
    }

    try {
      const { data, error } = await supabase
        .from('tools_costs')
        .insert(toolsData)
        .select()

      if (error) {
        console.error('Erro ao criar ferramentas:', error)
        return { success: false, error: error.message }
      }

      return { success: true, tools: data || [] }
    } catch (error) {
      console.error('Erro ao criar ferramentas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza uma ferramenta
   */
  async update(id, toolData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}
      
      if (toolData.tool_name !== undefined) updateData.tool_name = toolData.tool_name
      if (toolData.tool_category !== undefined) updateData.tool_category = toolData.tool_category
      if (toolData.monthly_cost !== undefined) updateData.monthly_cost = toolData.monthly_cost
      if (toolData.cost_per_execution !== undefined) updateData.cost_per_execution = toolData.cost_per_execution
      if (toolData.execution_time_seconds !== undefined) updateData.execution_time_seconds = toolData.execution_time_seconds
      if (toolData.notes !== undefined) updateData.notes = toolData.notes

      const { data, error } = await supabase
        .from('tools_costs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar ferramenta:', error)
        return { success: false, error: error.message }
      }

      return { success: true, tool: data }
    } catch (error) {
      console.error('Erro ao atualizar ferramenta:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta uma ferramenta
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('tools_costs')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar ferramenta:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar ferramenta:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta todas as ferramentas de um indicador e cenário
   */
  async deleteByIndicatorAndScenario(indicatorId, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('tools_costs')
        .delete()
        .eq('indicator_id', indicatorId)
        .eq('scenario', scenario)

      if (error) {
        console.error('Erro ao deletar ferramentas:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar ferramentas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Calcula custo total mensal de ferramentas para um indicador e cenário
   */
  async calculateMonthlyTotal(indicatorId, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return 0
    }

    try {
      const tools = await this.getByIndicatorId(indicatorId, scenario)
      
      return tools.reduce((total, tool) => {
        return total + (tool.monthly_cost || 0)
      }, 0)
    } catch (error) {
      console.error('Erro ao calcular custo total mensal:', error)
      return 0
    }
  }
}

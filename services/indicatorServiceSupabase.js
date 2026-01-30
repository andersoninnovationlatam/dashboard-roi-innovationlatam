/**
 * Serviço de Indicadores com Supabase
 * Gerencia CRUD de indicadores usando Supabase (estrutura normalizada)
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'
import { personInvolvedService } from './personInvolvedService'
import { toolCostService } from './toolCostService'
import { customMetricService } from './customMetricService'
import { calculatedResultsService } from './calculatedResultsService'
import { trackingService } from './trackingService'
import { auditLogService } from './auditLogService'

// Função para validar se um ID é um UUID válido
const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const indicatorServiceSupabase = {
  isValidUUID,

  /**
   * Retorna todos os indicadores da organização do usuário autenticado
   * RLS já filtra automaticamente por organization_id via project
   */
  async getAll(limit = 1000) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      // OTIMIZAÇÃO: Limita resultados e seleciona apenas campos necessários inicialmente
      const { data, error } = await supabase
        .from('indicators_normalized')
        .select('id, project_id, name, description, improvement_type, frequency_value, frequency_unit, baseline_frequency_real, post_ia_frequency, is_active, created_at, updated_at')
        .eq('is_active', true) // Apenas indicadores ativos
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar indicadores:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar indicadores:', error)
      return []
    }
  },

  /**
   * Retorna indicadores de um projeto específico
   */
  async getByProjectId(projectId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    if (projectId && !isValidUUID(projectId)) {
      console.warn(`getByProjectId: projectId inválido (não é UUID): ${projectId}`)
      return []
    }

    try {
      const { data, error } = await supabase
        .from('indicators_normalized')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar indicadores do projeto:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar indicadores do projeto:', error)
      return []
    }
  },

  /**
   * Retorna indicador por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    if (!isValidUUID(id)) {
      console.warn(`ID inválido (não é UUID): ${id}`)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('indicators_normalized')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code !== '22P02') {
          console.error('Erro ao buscar indicador:', error)
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar indicador:', error)
      return null
    }
  },

  /**
   * Retorna indicador completo com todas as tabelas relacionadas
   */
  async getCompleteById(id) {
    if (!id) {
      console.warn('getCompleteById chamado sem ID')
      return null
    }

    if (!isValidUUID(id)) {
      console.warn(`getCompleteById: ID inválido (não é UUID): ${id}`)
      return null
    }

    try {
      const indicator = await this.getById(id)
      if (!indicator) return null

      // Buscar dados relacionados em paralelo
      const [personsBaseline, personsPostIA, toolsBaseline, toolsPostIA, customMetrics, calculatedResult, trackingHistory] = await Promise.all([
        personInvolvedService.getByIndicatorId(id, 'baseline'),
        personInvolvedService.getByIndicatorId(id, 'post_ia'),
        toolCostService.getByIndicatorId(id, 'baseline'),
        toolCostService.getByIndicatorId(id, 'post_ia'),
        customMetricService.getByIndicatorId(id),
        calculatedResultsService.getLatestByIndicatorId(id),
        trackingService.getByIndicatorId(id)
      ])

      return {
        ...indicator,
        persons_baseline: personsBaseline,
        persons_post_ia: personsPostIA,
        tools_baseline: toolsBaseline,
        tools_post_ia: toolsPostIA,
        custom_metrics: customMetrics,
        calculated_result: calculatedResult,
        tracking_history: trackingHistory
      }
    } catch (error) {
      console.error('Erro ao buscar indicador completo:', error)
      return null
    }
  },

  /**
   * Cria um novo indicador com todas as tabelas relacionadas
   */
  async create(indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Validar project_id
      const projectId = indicatorData.project_id || indicatorData.projectId || indicatorData.projetoId
      if (!projectId || !isValidUUID(projectId)) {
        return { success: false, error: 'project_id inválido ou não fornecido' }
      }

      // Criar indicador principal
      const { data: indicator, error: indicatorError } = await supabase
        .from('indicators_normalized')
        .insert({
          project_id: projectId,
          name: indicatorData.name,
          description: indicatorData.description || null,
          improvement_type: indicatorData.improvement_type,
          frequency_value: indicatorData.frequency_value || 1,
          frequency_unit: indicatorData.frequency_unit || 'month',
          baseline_frequency_real: indicatorData.baseline_frequency_real || 0,
          baseline_frequency_desired: indicatorData.baseline_frequency_desired || null,
          post_ia_frequency: indicatorData.post_ia_frequency || 0,
          is_active: indicatorData.is_active !== undefined ? indicatorData.is_active : true,
          notes: indicatorData.notes || null
        })
        .select()
        .single()

      if (indicatorError) {
        console.error('Erro ao criar indicador:', indicatorError)
        return { success: false, error: indicatorError.message }
      }

      const indicatorId = indicator.id

      // Criar pessoas envolvidas (baseline)
      if (indicatorData.persons_baseline && Array.isArray(indicatorData.persons_baseline)) {
        const personsBaselineData = indicatorData.persons_baseline.map(p => ({
          indicator_id: indicatorId,
          scenario: 'baseline',
          person_name: p.person_name,
          role: p.role,
          hourly_rate: p.hourly_rate,
          time_spent_minutes: p.time_spent_minutes,
          is_validation_only: false
        }))
        await personInvolvedService.createMany(personsBaselineData)
      }

      // Criar pessoas envolvidas (pós-IA)
      if (indicatorData.persons_post_ia && Array.isArray(indicatorData.persons_post_ia)) {
        const personsPostIAData = indicatorData.persons_post_ia.map(p => ({
          indicator_id: indicatorId,
          scenario: 'post_ia',
          person_name: p.person_name,
          role: p.role,
          hourly_rate: p.hourly_rate,
          time_spent_minutes: p.time_spent_minutes,
          is_validation_only: p.is_validation_only || false
        }))
        await personInvolvedService.createMany(personsPostIAData)
      }

      // Criar ferramentas (baseline)
      if (indicatorData.tools_baseline && Array.isArray(indicatorData.tools_baseline)) {
        const toolsBaselineData = indicatorData.tools_baseline.map(t => ({
          indicator_id: indicatorId,
          scenario: 'baseline',
          tool_name: t.tool_name,
          tool_category: t.tool_category,
          monthly_cost: t.monthly_cost || 0,
          cost_per_execution: t.cost_per_execution || null,
          execution_time_seconds: t.execution_time_seconds || null,
          notes: t.notes || null
        }))
        await toolCostService.createMany(toolsBaselineData)
      }

      // Criar ferramentas (pós-IA)
      if (indicatorData.tools_post_ia && Array.isArray(indicatorData.tools_post_ia)) {
        const toolsPostIAData = indicatorData.tools_post_ia.map(t => ({
          indicator_id: indicatorId,
          scenario: 'post_ia',
          tool_name: t.tool_name,
          tool_category: t.tool_category,
          monthly_cost: t.monthly_cost || 0,
          cost_per_execution: t.cost_per_execution || null,
          execution_time_seconds: t.execution_time_seconds || null,
          notes: t.notes || null
        }))
        await toolCostService.createMany(toolsPostIAData)
      }

      // Criar métricas customizadas
      if (indicatorData.custom_metrics && Array.isArray(indicatorData.custom_metrics)) {
        const customMetricsData = indicatorData.custom_metrics.map(m => ({
          indicator_id: indicatorId,
          metric_name: m.metric_name,
          metric_unit: m.metric_unit,
          baseline_value: m.baseline_value,
          post_ia_value: m.post_ia_value,
          target_value: m.target_value || null,
          is_higher_better: m.is_higher_better !== undefined ? m.is_higher_better : true
        }))
        await customMetricService.createMany(customMetricsData)
      }

      // Log de auditoria
      await auditLogService.log('CREATE', 'indicator', indicatorId, null, indicator)

      return { success: true, indicator }
    } catch (error) {
      console.error('Erro ao criar indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza um indicador existente
   */
  async update(id, indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!isValidUUID(id)) {
      console.warn(`update: ID inválido (não é UUID): ${id}`)
      return { success: false, error: 'ID inválido' }
    }

    try {
      // Buscar indicador atual para log de auditoria
      const oldIndicator = await this.getById(id)
      if (!oldIndicator) {
        return { success: false, error: 'Indicador não encontrado' }
      }

      const updateData = {}
      
      if (indicatorData.name !== undefined) updateData.name = indicatorData.name
      if (indicatorData.description !== undefined) updateData.description = indicatorData.description
      if (indicatorData.improvement_type !== undefined) updateData.improvement_type = indicatorData.improvement_type
      if (indicatorData.frequency_value !== undefined) updateData.frequency_value = indicatorData.frequency_value
      if (indicatorData.frequency_unit !== undefined) updateData.frequency_unit = indicatorData.frequency_unit
      if (indicatorData.baseline_frequency_real !== undefined) updateData.baseline_frequency_real = indicatorData.baseline_frequency_real
      if (indicatorData.baseline_frequency_desired !== undefined) updateData.baseline_frequency_desired = indicatorData.baseline_frequency_desired
      if (indicatorData.post_ia_frequency !== undefined) updateData.post_ia_frequency = indicatorData.post_ia_frequency
      if (indicatorData.is_active !== undefined) updateData.is_active = indicatorData.is_active
      if (indicatorData.notes !== undefined) updateData.notes = indicatorData.notes

      const { data, error } = await supabase
        .from('indicators_normalized')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar indicador:', error)
        return { success: false, error: error.message }
      }

      // Atualizar tabelas relacionadas se fornecidas
      if (indicatorData.persons_baseline !== undefined) {
        await personInvolvedService.deleteByIndicatorAndScenario(id, 'baseline')
        if (Array.isArray(indicatorData.persons_baseline) && indicatorData.persons_baseline.length > 0) {
          const personsData = indicatorData.persons_baseline.map(p => ({
            indicator_id: id,
            scenario: 'baseline',
            ...p
          }))
          await personInvolvedService.createMany(personsData)
        }
      }

      if (indicatorData.persons_post_ia !== undefined) {
        await personInvolvedService.deleteByIndicatorAndScenario(id, 'post_ia')
        if (Array.isArray(indicatorData.persons_post_ia) && indicatorData.persons_post_ia.length > 0) {
          const personsData = indicatorData.persons_post_ia.map(p => ({
            indicator_id: id,
            scenario: 'post_ia',
            ...p
          }))
          await personInvolvedService.createMany(personsData)
        }
      }

      if (indicatorData.tools_baseline !== undefined) {
        await toolCostService.deleteByIndicatorAndScenario(id, 'baseline')
        if (Array.isArray(indicatorData.tools_baseline) && indicatorData.tools_baseline.length > 0) {
          const toolsData = indicatorData.tools_baseline.map(t => ({
            indicator_id: id,
            scenario: 'baseline',
            ...t
          }))
          await toolCostService.createMany(toolsData)
        }
      }

      if (indicatorData.tools_post_ia !== undefined) {
        await toolCostService.deleteByIndicatorAndScenario(id, 'post_ia')
        if (Array.isArray(indicatorData.tools_post_ia) && indicatorData.tools_post_ia.length > 0) {
          const toolsData = indicatorData.tools_post_ia.map(t => ({
            indicator_id: id,
            scenario: 'post_ia',
            ...t
          }))
          await toolCostService.createMany(toolsData)
        }
      }

      if (indicatorData.custom_metrics !== undefined) {
        await customMetricService.deleteByIndicatorId(id)
        if (Array.isArray(indicatorData.custom_metrics) && indicatorData.custom_metrics.length > 0) {
          await customMetricService.createMany(indicatorData.custom_metrics.map(m => ({
            indicator_id: id,
            ...m
          })))
        }
      }

      // Log de auditoria
      await auditLogService.log('UPDATE', 'indicator', id, oldIndicator, data)

      return { success: true, indicator: data }
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta um indicador
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!isValidUUID(id)) {
      console.warn(`delete: ID inválido (não é UUID): ${id}`)
      return { success: false, error: 'ID inválido' }
    }

    try {
      // Buscar indicador antes de deletar para log
      const indicator = await this.getById(id)

      const { error } = await supabase
        .from('indicators_normalized')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar indicador:', error)
        return { success: false, error: error.message }
      }

      // Log de auditoria
      if (indicator) {
        await auditLogService.log('DELETE', 'indicator', id, indicator, null)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar indicador:', error)
      return { success: false, error: error.message }
    }
  }
}

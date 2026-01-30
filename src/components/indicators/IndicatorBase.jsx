/**
 * Componente Base para Indicadores
 * Fornece lógica comum para todos os componentes de indicadores
 */

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { personInvolvedService } from '../../../services/personInvolvedService'
import { toolCostService } from '../../../services/toolCostService'

export const IndicatorBase = {
  /**
   * Valida dados básicos do indicador
   */
  validateBasicData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Dados inválidos' }
    }
    return { valid: true }
  },

  /**
   * Salva pessoas envolvidas no Supabase
   */
  async savePersons(indicatorId, persons, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!indicatorId || !persons || !Array.isArray(persons)) {
      return { success: false, error: 'Dados inválidos' }
    }

    try {
      // Deletar pessoas existentes do cenário
      const existingPersons = await personInvolvedService.getByIndicatorId(indicatorId, scenario)
      for (const person of existingPersons) {
        await personInvolvedService.delete(person.id)
      }

      // Criar novas pessoas
      const results = []
      for (const person of persons) {
        const result = await personInvolvedService.create({
          indicator_id: indicatorId,
          scenario: scenario,
          person_name: person.nome || person.person_name,
          role: person.cargo || person.role,
          hourly_rate: person.valorHora || person.hourly_rate || 0,
          time_spent_minutes: person.tempoGasto || person.time_spent_minutes || 0,
          frequency_real_quantity: person.frequenciaReal?.quantidade || person.frequency_real_quantity || null,
          frequency_real_unit: person.frequenciaReal?.periodo || person.frequency_real_unit || null,
          frequency_desired_quantity: person.frequenciaDesejada?.quantidade || person.frequency_desired_quantity || null,
          frequency_desired_unit: person.frequenciaDesejada?.periodo || person.frequency_desired_unit || null
        })
        if (result.success) {
          results.push(result.person)
        }
      }

      return { success: true, persons: results }
    } catch (error) {
      console.error('Erro ao salvar pessoas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Carrega pessoas envolvidas do Supabase
   */
  async loadPersons(indicatorId, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const persons = await personInvolvedService.getByIndicatorId(indicatorId, scenario)
      return persons.map(p => ({
        id: p.id,
        nome: p.person_name,
        cargo: p.role,
        valorHora: p.hourly_rate || 0,
        tempoGasto: p.time_spent_minutes || 0,
        frequenciaReal: {
          quantidade: p.frequency_real_quantity || 0,
          periodo: p.frequency_real_unit || 'Mensal'
        },
        frequenciaDesejada: {
          quantidade: p.frequency_desired_quantity || 0,
          periodo: p.frequency_desired_unit || 'Mensal'
        }
      }))
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error)
      return []
    }
  },

  /**
   * Salva ferramentas/custos no Supabase
   */
  async saveTools(indicatorId, tools, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!indicatorId || !tools || !Array.isArray(tools)) {
      return { success: false, error: 'Dados inválidos' }
    }

    try {
      // Deletar ferramentas existentes do cenário
      const existingTools = await toolCostService.getByIndicatorId(indicatorId, scenario)
      for (const tool of existingTools) {
        await toolCostService.delete(tool.id)
      }

      // Criar novas ferramentas
      const results = []
      for (const tool of tools) {
        const result = await toolCostService.create({
          indicator_id: indicatorId,
          scenario: scenario,
          tool_name: tool.nomeFerramenta || tool.tool_name,
          monthly_cost: tool.custoMensal || tool.monthly_cost || 0,
          other_costs: tool.outrosCustos || tool.other_costs || 0,
          implementation_cost: tool.custoImplementacao || tool.implementation_cost || 0
        })
        if (result.success) {
          results.push(result.tool)
        }
      }

      return { success: true, tools: results }
    } catch (error) {
      console.error('Erro ao salvar ferramentas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Carrega ferramentas/custos do Supabase
   */
  async loadTools(indicatorId, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const tools = await toolCostService.getByIndicatorId(indicatorId, scenario)
      return tools.map(t => ({
        id: t.id,
        nomeFerramenta: t.tool_name,
        custoMensal: t.monthly_cost || 0,
        outrosCustos: t.other_costs || 0,
        custoImplementacao: t.implementation_cost || 0
      }))
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error)
      return []
    }
  },

  /**
   * Formata número para exibição
   */
  formatNumber(value) {
    if (value === null || value === undefined || value === '') return ''
    if (value === 0) return '0'
    return value.toString().replace(/^0+/, '')
  },

  /**
   * Converte período para horas por mês
   */
  convertPeriodToHoursPerMonth(quantidade, periodo) {
    if (!quantidade || quantidade === 0) return 0

    const periodMap = {
      'Diário': 30,
      'Semanal': 4.33,
      'Mensal': 1,
      'Anual': 1 / 12
    }

    const multiplier = periodMap[periodo] || 1
    return quantidade * multiplier
  }
}

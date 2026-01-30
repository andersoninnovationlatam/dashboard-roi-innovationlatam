/**
 * Serviço Base para Cálculos de Indicadores
 * Fornece funções comuns para todos os serviços de cálculo
 */

import { supabase, isSupabaseConfigured } from '../../src/lib/supabase'
import { indicatorCalculatedMetricsService } from '../indicatorCalculatedMetricsService'

export const indicatorCalculatedBase = {
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
  },

  /**
   * Calcula horas economizadas por mês
   */
  calculateHoursSavedPerMonth(baselineHours, postIAHours) {
    return Math.max(0, baselineHours - postIAHours)
  },

  /**
   * Calcula custo total mensal
   */
  calculateMonthlyCost(persons) {
    if (!persons || !Array.isArray(persons)) return 0

    return persons.reduce((total, person) => {
      const horasPorMes = this.convertPeriodToHoursPerMonth(
        person.frequenciaReal?.quantidade || person.frequency_real_quantity || 0,
        person.frequenciaReal?.periodo || person.frequency_real_unit || 'Mensal'
      )
      const horasTrabalhadas = (person.tempoGasto || person.time_spent_minutes || 0) / 60
      const valorHora = person.valorHora || person.hourly_rate || 0
      return total + (horasPorMes * horasTrabalhadas * valorHora)
    }, 0)
  },

  /**
   * Salva métricas calculadas no Supabase
   */
  async saveCalculatedMetrics(indicatorId, metrics) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!indicatorId) {
      return { success: false, error: 'ID do indicador é obrigatório' }
    }

    try {
      const result = await indicatorCalculatedMetricsService.upsertMetrics(indicatorId, {
        ...metrics,
        calculation_date: new Date().toISOString()
      })

      return result
    } catch (error) {
      console.error('Erro ao salvar métricas calculadas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Busca métricas calculadas do Supabase
   */
  async getCalculatedMetrics(indicatorId) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const metrics = await indicatorCalculatedMetricsService.getByIndicatorId(indicatorId)
      return metrics
    } catch (error) {
      console.error('Erro ao buscar métricas calculadas:', error)
      return null
    }
  },

  /**
   * Calcula ROI percentual
   */
  calculateROIPercentage(netSavings, implementationCost) {
    if (!implementationCost || implementationCost === 0) return 0
    return ((netSavings / implementationCost) * 100)
  },

  /**
   * Calcula payback em meses
   */
  calculatePaybackMonths(implementationCost, monthlySavings) {
    if (!monthlySavings || monthlySavings === 0) return null
    return implementationCost / monthlySavings
  }
}

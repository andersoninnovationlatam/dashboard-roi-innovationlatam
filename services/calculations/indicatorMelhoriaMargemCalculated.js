/**
 * Serviço de Cálculo para Indicador de Melhoria Margem
 * Calcula métricas de melhoria de margem baseado em dados de baseline e pós-IA
 */

import { indicatorCalculatedMetricsService } from '../indicatorCalculatedMetricsService'

export const indicatorMelhoriaMargemCalculated = {
  /**
   * Calcula todas as métricas de melhoria margem
   */
  calcularMetricas(baselineData, postIAData) {
    const deltaMargem = postIAData.margemBrutaEstimada - baselineData.margemBrutaAtual
    const lucroBrutoBaseline = baselineData.receitaBrutaMensal - baselineData.custoTotalMensal
    const lucroBrutoEstimado = postIAData.receitaBrutaMensalEstimada - postIAData.custoTotalMensalEstimado
    const deltaMargemReais = lucroBrutoEstimado - lucroBrutoBaseline
    const economiaMensal = deltaMargemReais
    const economiaAnual = economiaMensal * 12

    return {
      delta_margem: deltaMargem,
      delta_margem_reais: deltaMargemReais,
      economia_mensal: economiaMensal,
      economia_anual: economiaAnual
    }
  },

  /**
   * Calcula todas as métricas e salva no Supabase
   */
  async calculateAndSave(indicatorId, baselineData, postIAData) {
    if (!indicatorId) {
      return { success: false, error: 'ID do indicador é obrigatório' }
    }

    try {
      const metrics = this.calcularMetricas(baselineData, postIAData)
      const result = await indicatorCalculatedMetricsService.upsertMetrics(indicatorId, metrics)

      if (result.success) {
        return {
          success: true,
          metrics: {
            ...metrics,
            ...result.data
          }
        }
      }

      return result
    } catch (error) {
      console.error('Erro ao calcular métricas de melhoria margem:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Calcula métricas sem salvar (apenas retorna)
   */
  calculate(baselineData, postIAData) {
    return this.calcularMetricas(baselineData, postIAData)
  }
}

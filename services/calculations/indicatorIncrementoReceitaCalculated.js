/**
 * Serviço de Cálculo para Indicador de Incremento Receita
 * Calcula métricas de incremento de receita baseado em dados de baseline e pós-IA
 */

import { indicatorCalculatedMetricsService } from '../indicatorCalculatedMetricsService'

export const indicatorIncrementoReceitaCalculated = {
  /**
   * Calcula delta de receita: Receita Depois - Receita Antes
   */
  calcularDeltaReceita(baselineData, postIAData) {
    const receitaAntes = baselineData?.valorReceitaAntes || 0
    const receitaDepois = postIAData?.valorReceitaDepois || 0
    return receitaDepois - receitaAntes
  },

  /**
   * Calcula todas as métricas de incremento receita e salva no Supabase
   */
  async calculateAndSave(indicatorId, baselineData, postIAData) {
    if (!indicatorId) {
      return { success: false, error: 'ID do indicador é obrigatório' }
    }

    try {
      const deltaReceita = this.calcularDeltaReceita(baselineData, postIAData)

      const metrics = {
        delta_receita: deltaReceita
      }

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
      console.error('Erro ao calcular métricas de incremento receita:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Calcula métricas sem salvar (apenas retorna)
   */
  calculate(baselineData, postIAData) {
    const deltaReceita = this.calcularDeltaReceita(baselineData, postIAData)

    return {
      delta_receita: deltaReceita
    }
  }
}

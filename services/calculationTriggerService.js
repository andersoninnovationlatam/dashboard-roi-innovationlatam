/**
 * Serviço de Trigger de Cálculos
 * Recalcula automaticamente os resultados quando dados mudam
 */

import { calcularROIIndicador, calcularROIProjeto } from './roiCalculatorService'
import { calculatedResultsService } from './calculatedResultsService'
import { indicatorServiceSupabase } from './indicatorServiceSupabase'
import { projectServiceSupabase } from './projectServiceSupabase'

export const calculationTriggerService = {
  /**
   * Recalcula e atualiza calculated_results para um indicador
   */
  async recalculateIndicator(indicatorId) {
    try {
      // Buscar indicador completo
      const indicator = await indicatorServiceSupabase.getCompleteById(indicatorId)
      if (!indicator) {
        console.warn(`Indicador ${indicatorId} não encontrado para recálculo`)
        return { success: false, error: 'Indicador não encontrado' }
      }

      // Calcular ROI
      const metricas = calcularROIIndicador(indicator)
      if (!metricas) {
        return { success: false, error: 'Erro ao calcular métricas' }
      }

      // Atualizar calculated_results
      const result = await calculatedResultsService.upsert({
        indicator_id: indicatorId,
        calculation_date: new Date().toISOString().split('T')[0],
        period_type: 'monthly',
        hours_saved: metricas.horasEconomizadasAnual / 12, // Mensal
        money_saved: metricas.economiaLiquidaAnual / 12, // Mensal
        cost_baseline: metricas.custoTotalBaselineAnual / 12, // Mensal
        cost_post_ia: metricas.custoTotalPostIAAnual / 12, // Mensal
        gross_savings: metricas.economiaBrutaAnual / 12, // Mensal
        net_savings: metricas.economiaLiquidaAnual / 12, // Mensal
        roi_percentage: metricas.roiPercentual,
        payback_months: metricas.paybackMeses
      })

      return result
    } catch (error) {
      console.error('Erro ao recalcular indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Recalcula todos os indicadores de um projeto
   */
  async recalculateProject(projectId) {
    try {
      // Buscar indicadores do projeto
      const indicators = await indicatorServiceSupabase.getByProjectId(projectId)
      
      // Recalcular cada indicador
      const results = await Promise.all(
        indicators.map(ind => this.recalculateIndicator(ind.id))
      )

      const successCount = results.filter(r => r.success).length
      const errorCount = results.length - successCount

      return {
        success: errorCount === 0,
        recalculated: successCount,
        errors: errorCount,
        results
      }
    } catch (error) {
      console.error('Erro ao recalcular projeto:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Recalcula indicadores periodicamente (pode ser chamado por um cron job)
   */
  async recalculateAll() {
    try {
      // Buscar todos os indicadores ativos
      const indicators = await indicatorServiceSupabase.getAll()
      const activeIndicators = indicators.filter(ind => ind.is_active !== false)

      console.log(`Recalculando ${activeIndicators.length} indicadores...`)

      const results = await Promise.all(
        activeIndicators.map(ind => this.recalculateIndicator(ind.id))
      )

      const successCount = results.filter(r => r.success).length
      const errorCount = results.length - successCount

      console.log(`Recálculo concluído: ${successCount} sucessos, ${errorCount} erros`)

      return {
        success: true,
        total: activeIndicators.length,
        recalculated: successCount,
        errors: errorCount
      }
    } catch (error) {
      console.error('Erro ao recalcular todos os indicadores:', error)
      return { success: false, error: error.message }
    }
  }
}

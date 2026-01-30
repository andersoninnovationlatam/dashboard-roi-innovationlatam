/**
 * Mapeamento de serviços de cálculo de indicadores
 * Centraliza a importação e uso dos serviços de cálculo específicos
 */

import { indicatorProdutividadeCalculated } from './indicatorProdutividadeCalculated'
import { indicatorIncrementoReceitaCalculated } from './indicatorIncrementoReceitaCalculated'
import { indicatorMelhoriaMargemCalculated } from './indicatorMelhoriaMargemCalculated'

// Mapeamento de tipos de indicadores para serviços de cálculo
export const indicatorCalculations = {
  'Produtividade': indicatorProdutividadeCalculated,
  'Incremento Receita': indicatorIncrementoReceitaCalculated,
  'Melhoria Margem': indicatorMelhoriaMargemCalculated,
  // Adicionar outros conforme forem criados
  // 'Capacidade Analítica': indicatorCapacidadeAnaliticaCalculated,
  // 'Redução de Risco': indicatorReducaoRiscoCalculated,
  // 'Qualidade Decisão': indicatorQualidadeDecisaoCalculated,
  // 'Velocidade': indicatorVelocidadeCalculated,
  // 'Satisfação': indicatorSatisfacaoCalculated
}

/**
 * Retorna o serviço de cálculo específico para um tipo de indicador
 */
export const getIndicatorCalculation = (tipoIndicador) => {
  return indicatorCalculations[tipoIndicador] || null
}

/**
 * Calcula e salva métricas para um indicador
 */
export const calculateAndSaveIndicatorMetrics = async (tipoIndicador, indicatorId, baselineData, postIAData) => {
  const calculationService = getIndicatorCalculation(tipoIndicador)
  
  if (!calculationService) {
    console.warn(`Serviço de cálculo não encontrado para tipo: ${tipoIndicador}`)
    return { success: false, error: `Serviço de cálculo não encontrado para ${tipoIndicador}` }
  }

  if (!calculationService.calculateAndSave) {
    console.warn(`Método calculateAndSave não encontrado para tipo: ${tipoIndicador}`)
    return { success: false, error: `Método calculateAndSave não encontrado para ${tipoIndicador}` }
  }

  return await calculationService.calculateAndSave(indicatorId, baselineData, postIAData)
}

/**
 * Mapeamento de componentes de indicadores
 * Centraliza a importação e uso dos componentes específicos
 */

import IndicatorProdutividade from './IndicatorProdutividade'
import IndicatorIncrementoReceita from './IndicatorIncrementoReceita'
import IndicatorMelhoriaMargem from './IndicatorMelhoriaMargem'

// Mapeamento de tipos de indicadores para componentes
export const indicatorComponents = {
  'Produtividade': IndicatorProdutividade,
  'Incremento Receita': IndicatorIncrementoReceita,
  'Melhoria Margem': IndicatorMelhoriaMargem,
  // Adicionar outros conforme forem criados
  // 'Capacidade Analítica': IndicatorCapacidadeAnalitica,
  // 'Redução de Risco': IndicatorReducaoRisco,
  // 'Qualidade Decisão': IndicatorQualidadeDecisao,
  // 'Velocidade': IndicatorVelocidade,
  // 'Satisfação': IndicatorSatisfacao
}

/**
 * Retorna o componente específico para um tipo de indicador
 */
export const getIndicatorComponent = (tipoIndicador) => {
  return indicatorComponents[tipoIndicador] || null
}

/**
 * Verifica se existe componente específico para um tipo
 */
export const hasSpecificComponent = (tipoIndicador) => {
  return !!indicatorComponents[tipoIndicador]
}

/**
 * Utilitários para normalização de dados de indicadores
 * Suporta formato antigo (nome, tipoIndicador) e formato normalizado (name, improvement_type)
 */

/**
 * Normaliza o tipo do indicador - converte improvement_type (formato normalizado) para tipoIndicador (formato antigo)
 * Suporta ambos os formatos para compatibilidade
 */
export const normalizarTipoIndicador = (indicador) => {
  if (!indicador) return null
  
  const infoData = indicador.info_data || indicador.infoData || {}
  const baselineData = indicador.baselineData || indicador.baseline || indicador.baseline_data || {}
  const postIAData = indicador.postIAData || indicador.postIA || indicador.post_ia_data || {}
  
  // Primeiro tenta formato antigo (info_data.tipoIndicador)
  if (infoData.tipoIndicador) {
    return infoData.tipoIndicador
  }
  
  // Depois tenta baselineData.tipo ou postIAData.tipo
  if (baselineData.tipo) {
    return baselineData.tipo
  }
  
  if (postIAData.tipo) {
    return postIAData.tipo
  }
  
  // Se não encontrou formato antigo, tenta converter improvement_type (formato normalizado)
  if (indicador.improvement_type) {
    const tipoMap = {
      'productivity': 'Produtividade',
      'analytical_capacity': 'Capacidade Analítica',
      'revenue_increase': 'Incremento Receita',
      'cost_reduction': 'Custos Relacionados',
      'risk_reduction': 'Redução de Risco',
      'decision_quality': 'Qualidade Decisão',
      'speed': 'Velocidade',
      'satisfaction': 'Satisfação',
      'margin_improvement': 'Melhoria Margem'
    }
    return tipoMap[indicador.improvement_type] || indicador.improvement_type
  }
  
  // Fallback: tenta tipoIndicador direto no objeto (caso já esteja normalizado)
  if (indicador.tipoIndicador) {
    return indicador.tipoIndicador
  }
  
  return null
}

/**
 * Obtém o nome do indicador suportando ambos os formatos
 */
export const obterNomeIndicador = (indicador) => {
  if (!indicador) return 'Indicador sem nome'
  
  const infoData = indicador.info_data || indicador.infoData || {}
  return indicador.name || indicador.nome || infoData.nome || 'Indicador sem nome'
}

/**
 * Obtém a descrição do indicador suportando ambos os formatos
 */
export const obterDescricaoIndicador = (indicador) => {
  if (!indicador) return ''
  
  const infoData = indicador.info_data || indicador.infoData || {}
  return indicador.description || indicador.descricao || infoData.descricao || ''
}

/**
 * Serviço de Indicadores
 * Gerencia apenas metadados dos indicadores (id, projetoId, timestamps)
 * Dados completos são gerenciados por indicatorDataService
 */

import { indicatorDataService } from './indicatorDataService'

const KEYS = {
  INDICATORS: 'roi_indicators'
}

export const indicatorService = {
  /**
   * Inicializa estrutura de indicadores
   */
  initialize() {
    if (!localStorage.getItem(KEYS.INDICATORS)) {
      localStorage.setItem(KEYS.INDICATORS, JSON.stringify([]))
    }
  },

  /**
   * Retorna todos os indicadores (apenas metadados)
   */
  getAll() {
    const indicatorsStr = localStorage.getItem(KEYS.INDICATORS)
    return indicatorsStr ? JSON.parse(indicatorsStr) : []
  },

  /**
   * Retorna indicadores de um projeto
   */
  getByProjectId(projetoId) {
    const indicators = this.getAll()
    return indicators.filter(i => i.projetoId === projetoId)
  },

  /**
   * Retorna indicador por ID (apenas metadados)
   */
  getById(id) {
    const indicators = this.getAll()
    return indicators.find(i => i.id === id) || null
  },

  /**
   * Retorna indicador completo (metadados + dados de todas as abas)
   * Mantém compatibilidade com formato antigo (comIA) para cálculos
   */
  getCompleteById(id) {
    const metadata = this.getById(id)
    if (!metadata) return null

    const data = indicatorDataService.getAll(id)
    
    // Retorna no formato esperado pelos cálculos
    return {
      ...metadata,
      // Info
      nome: data.info?.nome,
      tipoIndicador: data.info?.tipoIndicador,
      descricao: data.info?.descricao,
      camposEspecificos: data.info?.camposEspecificos,
      // Baseline
      baseline: data.baseline || {},
      // IA (mantém compatibilidade com comIA)
      comIA: data.ia || {},
      ia: data.ia || {},
      // Custos (mantém compatibilidade - pode ser array direto ou objeto)
      custos: data.custos?.custos || data.custos || []
    }
  },

  /**
   * Cria um novo indicador (apenas metadados)
   */
  create(data) {
    const indicators = this.getAll()
    const novoIndicador = {
      id: this.generateId(),
      projetoId: data.projetoId,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    }
    indicators.push(novoIndicador)
    localStorage.setItem(KEYS.INDICATORS, JSON.stringify(indicators))
    return { success: true, indicator: novoIndicador }
  },

  /**
   * Atualiza metadados de um indicador
   */
  update(id, data) {
    const indicators = this.getAll()
    const index = indicators.findIndex(i => i.id === id)
    
    if (index === -1) {
      return { success: false, error: 'Indicador não encontrado' }
    }

    indicators[index] = {
      ...indicators[index],
      ...data,
      atualizadoEm: new Date().toISOString()
    }

    localStorage.setItem(KEYS.INDICATORS, JSON.stringify(indicators))
    return { success: true, indicator: indicators[index] }
  },

  /**
   * Deleta um indicador (metadados + todos os dados das abas)
   */
  delete(id) {
    const indicators = this.getAll()
    const filtered = indicators.filter(i => i.id !== id)
    localStorage.setItem(KEYS.INDICATORS, JSON.stringify(filtered))
    
    // Deleta todos os dados das abas
    indicatorDataService.deleteIndicatorData(id)
    
    return { success: true }
  },

  /**
   * Gera ID único
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

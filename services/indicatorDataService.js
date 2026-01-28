/**
 * Serviço de Dados de Indicadores
 * Gerencia os 4 arquivos JSON separados por aba para cada indicador
 */

const getKey = (indicatorId, type) => `indicator_${indicatorId}_${type}`

const TYPES = {
  INFO: 'info',
  BASELINE: 'baseline',
  IA: 'ia',
  CUSTOS: 'custos',
  POST_IA: 'post_ia'
}

export const indicatorDataService = {
  /**
   * Retorna dados da aba Info
   */
  getInfo(indicatorId) {
    const key = getKey(indicatorId, TYPES.INFO)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  /**
   * Salva dados da aba Info
   */
  saveInfo(indicatorId, data) {
    const key = getKey(indicatorId, TYPES.INFO)
    const dataToSave = {
      id: indicatorId,
      ...data,
      atualizadoEm: new Date().toISOString()
    }
    if (!dataToSave.criadoEm) {
      dataToSave.criadoEm = new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(dataToSave))
    return { success: true, data: dataToSave }
  },

  /**
   * Retorna dados da aba Baseline
   */
  getBaseline(indicatorId) {
    const key = getKey(indicatorId, TYPES.BASELINE)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  /**
   * Salva dados da aba Baseline
   */
  saveBaseline(indicatorId, data) {
    const key = getKey(indicatorId, TYPES.BASELINE)
    const dataToSave = {
      id: indicatorId,
      ...data,
      atualizadoEm: new Date().toISOString()
    }
    if (!dataToSave.criadoEm) {
      dataToSave.criadoEm = new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(dataToSave))
    return { success: true, data: dataToSave }
  },

  /**
   * Retorna dados da aba IA
   */
  getIA(indicatorId) {
    const key = getKey(indicatorId, TYPES.IA)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  /**
   * Salva dados da aba IA
   */
  saveIA(indicatorId, data) {
    const key = getKey(indicatorId, TYPES.IA)
    const dataToSave = {
      id: indicatorId,
      ...data,
      atualizadoEm: new Date().toISOString()
    }
    if (!dataToSave.criadoEm) {
      dataToSave.criadoEm = new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(dataToSave))
    return { success: true, data: dataToSave }
  },

  /**
   * Retorna dados da aba Custos
   */
  getCustos(indicatorId) {
    const key = getKey(indicatorId, TYPES.CUSTOS)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  /**
   * Salva dados da aba Custos
   */
  saveCustos(indicatorId, data) {
    const key = getKey(indicatorId, TYPES.CUSTOS)
    const dataToSave = {
      id: indicatorId,
      ...data,
      atualizadoEm: new Date().toISOString()
    }
    if (!dataToSave.criadoEm) {
      dataToSave.criadoEm = new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(dataToSave))
    return { success: true, data: dataToSave }
  },

  /**
   * Retorna dados da aba Pós-IA
   */
  getPostIA(indicatorId) {
    const key = getKey(indicatorId, TYPES.POST_IA)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  /**
   * Salva dados da aba Pós-IA
   */
  savePostIA(indicatorId, data) {
    const key = getKey(indicatorId, TYPES.POST_IA)
    const dataToSave = {
      id: indicatorId,
      ...data,
      atualizadoEm: new Date().toISOString()
    }
    if (!dataToSave.criadoEm) {
      dataToSave.criadoEm = new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(dataToSave))
    return { success: true, data: dataToSave }
  },

  /**
   * Retorna todos os dados de um indicador
   */
  getAll(indicatorId) {
    return {
      info: this.getInfo(indicatorId),
      baseline: this.getBaseline(indicatorId),
      ia: this.getIA(indicatorId),
      custos: this.getCustos(indicatorId),
      postIA: this.getPostIA(indicatorId)
    }
  },

  /**
   * Salva todos os dados de um indicador
   */
  saveAll(indicatorId, { info, baseline, ia, custos, postIA }) {
    const results = {}
    if (info) results.info = this.saveInfo(indicatorId, info)
    if (baseline) results.baseline = this.saveBaseline(indicatorId, baseline)
    if (ia) results.ia = this.saveIA(indicatorId, ia)
    if (custos) results.custos = this.saveCustos(indicatorId, custos)
    if (postIA) results.postIA = this.savePostIA(indicatorId, postIA)
    return { success: true, results }
  },

  /**
   * Deleta todos os dados de um indicador (4 arquivos)
   */
  deleteIndicatorData(indicatorId) {
    Object.values(TYPES).forEach(type => {
      const key = getKey(indicatorId, type)
      localStorage.removeItem(key)
    })
    return { success: true }
  },

  /**
   * Deleta dados de uma aba específica
   */
  deleteTabData(indicatorId, type) {
    if (!Object.values(TYPES).includes(type)) {
      return { success: false, error: 'Tipo inválido' }
    }
    const key = getKey(indicatorId, type)
    localStorage.removeItem(key)
    return { success: true }
  },

  /**
   * Verifica se um indicador tem dados salvos
   */
  hasData(indicatorId) {
    return !!(
      this.getInfo(indicatorId) ||
      this.getBaseline(indicatorId) ||
      this.getIA(indicatorId) ||
      this.getCustos(indicatorId)
    )
  }
}

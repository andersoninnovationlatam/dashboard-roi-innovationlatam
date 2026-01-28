/**
 * Serviço de Métricas Específicas por Tipo de Indicador
 * Calcula métricas específicas para cada tipo de indicador para exibição no Dashboard
 */

/**
 * Converte período para multiplicador mensal
 */
const calcularHorasPorMes = (quantidade, periodo) => {
  if (!quantidade || quantidade === 0) return 0
  
  switch (periodo) {
    case 'Diário':
      return quantidade * 30 // 30 dias no mês
    case 'Semanal':
      return quantidade * 4.33 // ~4.33 semanas no mês
    case 'Mensal':
      return quantidade
    default:
      return quantidade
  }
}

/**
 * Converte valor para número, tratando strings vazias e valores inválidos
 */
const toNumber = (value, defaultValue = 0) => {
  if (value === '' || value === null || value === undefined) return defaultValue
  if (typeof value === 'string' && value.trim() === '') return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? defaultValue : num
}

/**
 * Calcula métricas específicas para indicador do tipo PRODUTIVIDADE
 */
export const calcularMetricasProdutividade = (indicador) => {
  if (!indicador) return null

  // Tenta acessar baselineData de diferentes formas (compatibilidade com diferentes estruturas)
  const baselineData = indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.postIAData || indicador.postIA || indicador.post_ia_data || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  // Verifica se é tipo PRODUTIVIDADE
  // Pode estar em infoData.tipoIndicador ou baselineData.tipo
  const tipoIndicador = infoData.tipoIndicador || baselineData.tipo || postIAData.tipo
  
  // Mapeia tipos antigos para novos
  const tipoMapeado = tipoIndicador === 'Produtividade' ? 'PRODUTIVIDADE' : tipoIndicador
  
  if (tipoMapeado !== 'PRODUTIVIDADE' && baselineData.tipo !== 'PRODUTIVIDADE' && postIAData.tipo !== 'PRODUTIVIDADE') {
    return null
  }

  const pessoasBaseline = baselineData.pessoas || []
  const pessoasPostIA = postIAData.pessoas || []

  if (pessoasBaseline.length === 0) {
    return null
  }

  // 1. Horas Economizada para Execução da Tarefa (HH Antes x HH Depois)
  const horasEconomizadasExecucao = pessoasBaseline.map((pessoaBaseline, index) => {
    const pessoaPostIA = pessoasPostIA.find(p => p.id === pessoaBaseline.id) || pessoaBaseline
    
    // HH Antes: (tempoGasto em minutos / 60) * frequência real
    const horasPorMesAntes = calcularHorasPorMes(
      pessoaBaseline.frequenciaReal?.quantidade || 0,
      pessoaBaseline.frequenciaReal?.periodo || 'Mensal'
    )
    const hhAntes = (toNumber(pessoaBaseline.tempoGasto) / 60) * horasPorMesAntes

    // HH Depois: (tempoGasto em minutos / 60) * frequência real
    const horasPorMesDepois = calcularHorasPorMes(
      pessoaPostIA.frequenciaReal?.quantidade || pessoaBaseline.frequenciaReal?.quantidade || 0,
      pessoaPostIA.frequenciaReal?.periodo || pessoaBaseline.frequenciaReal?.periodo || 'Mensal'
    )
    const hhDepois = (toNumber(pessoaPostIA.tempoGasto) / 60) * horasPorMesDepois

    return {
      pessoa: pessoaBaseline.nome || `Pessoa ${index + 1}`,
      hhAntes,
      hhDepois,
      hhEconomizadas: Math.max(0, hhAntes - hhDepois)
    }
  })

  // 2. Custo de Horas Economizada (HH Antes x Custo HH - HH Depois x Custo da Hora)
  const custoHorasEconomizadas = horasEconomizadasExecucao.map((item, index) => {
    const pessoaBaseline = pessoasBaseline[index]
    const pessoaPostIA = pessoasPostIA.find(p => p.id === pessoaBaseline.id) || pessoaBaseline
    
    const valorHora = toNumber(pessoaPostIA.valorHora || pessoaBaseline.valorHora || 0)
    const custoAntes = item.hhAntes * valorHora
    const custoDepois = item.hhDepois * valorHora
    const custoEconomizado = custoAntes - custoDepois

    return {
      pessoa: item.pessoa,
      custoAntes,
      custoDepois,
      custoEconomizado: Math.max(0, custoEconomizado)
    }
  })

  // 3. Tempo Economizado para Realização da Atividade Considerando a Frequência que a tarefa deveria ser feita
  const tempoEconomizadoFrequenciaDesejada = pessoasBaseline.map((pessoaBaseline, index) => {
    const pessoaPostIA = pessoasPostIA.find(p => p.id === pessoaBaseline.id) || pessoaBaseline
    
    // Frequência Desejada
    const horasPorMesDesejada = calcularHorasPorMes(
      pessoaBaseline.frequenciaDesejada?.quantidade || 0,
      pessoaBaseline.frequenciaDesejada?.periodo || 'Mensal'
    )
    
    // HH Antes com frequência desejada
    const hhAntesDesejada = (toNumber(pessoaBaseline.tempoGasto) / 60) * horasPorMesDesejada
    
    // HH Depois com frequência desejada (usa frequência desejada do baseline, mas tempo do postIA)
    const hhDepoisDesejada = (toNumber(pessoaPostIA.tempoGasto) / 60) * horasPorMesDesejada

    return {
      pessoa: pessoaBaseline.nome || `Pessoa ${index + 1}`,
      hhAntesDesejada,
      hhDepoisDesejada,
      hhEconomizadasDesejada: Math.max(0, hhAntesDesejada - hhDepoisDesejada)
    }
  })

  // 4. Custo de Horas Economizada para Realização da Atividade Considerando a Frequência que a tarefa deveria ser feita
  const custoHorasEconomizadasFrequenciaDesejada = tempoEconomizadoFrequenciaDesejada.map((item, index) => {
    const pessoaBaseline = pessoasBaseline[index]
    const pessoaPostIA = pessoasPostIA.find(p => p.id === pessoaBaseline.id) || pessoaBaseline
    
    const valorHora = toNumber(pessoaPostIA.valorHora || pessoaBaseline.valorHora || 0)
    const custoAntesDesejada = item.hhAntesDesejada * valorHora
    const custoDepoisDesejada = item.hhDepoisDesejada * valorHora
    const custoEconomizadoDesejada = custoAntesDesejada - custoDepoisDesejada

    return {
      pessoa: item.pessoa,
      custoAntesDesejada,
      custoDepoisDesejada,
      custoEconomizadoDesejada: Math.max(0, custoEconomizadoDesejada)
    }
  })

  // Totais
  const totalHorasEconomizadas = horasEconomizadasExecucao.reduce((sum, item) => sum + item.hhEconomizadas, 0)
  const totalCustoEconomizado = custoHorasEconomizadas.reduce((sum, item) => sum + item.custoEconomizado, 0)
  const totalHorasEconomizadasDesejada = tempoEconomizadoFrequenciaDesejada.reduce((sum, item) => sum + item.hhEconomizadasDesejada, 0)
  const totalCustoEconomizadoDesejada = custoHorasEconomizadasFrequenciaDesejada.reduce((sum, item) => sum + item.custoEconomizadoDesejada, 0)

  return {
    tipo: 'PRODUTIVIDADE',
    indicadorNome: infoData.nome || indicador.nome || indicador.tipoIndicador || 'Indicador de Produtividade',
    // Dados detalhados por pessoa
    horasEconomizadasExecucao,
    custoHorasEconomizadas,
    tempoEconomizadoFrequenciaDesejada,
    custoHorasEconomizadasFrequenciaDesejada,
    // Totais
    totalHorasEconomizadas,
    totalCustoEconomizado,
    totalHorasEconomizadasDesejada,
    totalCustoEconomizadoDesejada
  }
}

/**
 * Calcula métricas específicas para indicador do tipo INCREMENTO RECEITA
 */
export const calcularMetricasIncrementoReceita = (indicador) => {
  if (!indicador) return null

  // Tenta acessar dados de diferentes formas (compatibilidade com diferentes estruturas)
  const baselineData = indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.postIAData || indicador.postIA || indicador.post_ia_data || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  // Verifica se é tipo INCREMENTO RECEITA
  // Pode estar em infoData.tipoIndicador ou baselineData.tipo
  const tipoIndicador = infoData.tipoIndicador || baselineData.tipo || postIAData.tipo
  
  // Mapeia tipos antigos para novos
  const tipoMapeado = tipoIndicador === 'Incremento Receita' ? 'INCREMENTO RECEITA' : tipoIndicador
  
  if (tipoMapeado !== 'INCREMENTO RECEITA' && baselineData.tipo !== 'INCREMENTO RECEITA' && postIAData.tipo !== 'INCREMENTO RECEITA') {
    return null
  }

  const valorReceitaAntes = toNumber(baselineData.valorReceitaAntes || 0)
  const valorReceitaDepois = toNumber(postIAData.valorReceitaDepois || 0)
  const deltaReceita = valorReceitaDepois - valorReceitaAntes

  return {
    tipo: 'INCREMENTO RECEITA',
    indicadorNome: infoData.nome || indicador.nome || indicador.tipoIndicador || 'Indicador de Incremento de Receita',
    valorReceitaAntes,
    valorReceitaDepois,
    deltaReceita
  }
}

/**
 * Detecta quais tipos de indicadores existem no projeto e retorna métricas específicas
 */
export const calcularMetricasPorTipo = (indicators) => {
  if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
    return {
      produtividade: [],
      incrementoReceita: [],
      outros: []
    }
  }

  const metricasProdutividade = []
  const metricasIncrementoReceita = []
  const outros = []

  indicators.forEach(indicador => {
    // Tenta calcular métricas de produtividade
    const metricasProd = calcularMetricasProdutividade(indicador)
    if (metricasProd) {
      metricasProdutividade.push(metricasProd)
      return
    }

    // Tenta calcular métricas de incremento de receita
    const metricasReceita = calcularMetricasIncrementoReceita(indicador)
    if (metricasReceita) {
      metricasIncrementoReceita.push(metricasReceita)
      return
    }

    // Outros tipos (podem ser implementados no futuro)
    outros.push({
      tipo: indicador.info_data?.tipoIndicador || indicador.tipoIndicador || 'OUTROS',
      indicadorNome: indicador.info_data?.nome || indicador.nome || 'Indicador'
    })
  })

  return {
    produtividade: metricasProdutividade,
    incrementoReceita: metricasIncrementoReceita,
    outros
  }
}

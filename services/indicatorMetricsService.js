/**
 * Serviço de Métricas Específicas por Tipo de Indicador
 * Calcula métricas específicas para cada tipo de indicador para exibição no Dashboard
 */

import { obterNomeIndicador } from '../utils/indicatorUtils'

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
 * Normaliza o tipo do indicador - converte improvement_type (formato normalizado) para tipoIndicador (formato antigo)
 * Suporta ambos os formatos para compatibilidade
 */
const normalizarTipoIndicador = (indicador) => {
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
      // Tipos adicionais que podem existir
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
 * Calcula métricas específicas para indicador do tipo PRODUTIVIDADE
 */
export const calcularMetricasProdutividade = (indicador) => {
  if (!indicador) return null

  // Tenta acessar baselineData de diferentes formas (compatibilidade com diferentes estruturas)
  const baselineData = indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.postIAData || indicador.postIA || indicador.post_ia_data || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  // Verifica se é tipo PRODUTIVIDADE
  // Usa função auxiliar para normalizar tipo (suporta formato antigo e normalizado)
  const tipoIndicador = normalizarTipoIndicador(indicador)
  
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

    // HH Depois: usa a mesma frequência do baseline para comparar o mesmo volume de trabalho
    const horasPorMesDepois = horasPorMesAntes
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
    indicadorNome: obterNomeIndicador(indicador) || indicador.tipoIndicador || 'Indicador de Produtividade',
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
  // Usa função auxiliar para normalizar tipo (suporta formato antigo e normalizado)
  const tipoIndicador = normalizarTipoIndicador(indicador)
  
  if (tipoIndicador !== 'Incremento Receita' && baselineData.tipo !== 'INCREMENTO RECEITA' && postIAData.tipo !== 'INCREMENTO RECEITA') {
    return null
  }

  const valorReceitaAntes = toNumber(baselineData.valorReceitaAntes || 0)
  const valorReceitaDepois = toNumber(postIAData.valorReceitaDepois || 0)
  const deltaReceita = valorReceitaDepois - valorReceitaAntes

  return {
    tipo: 'INCREMENTO RECEITA',
    indicadorNome: obterNomeIndicador(indicador) || indicador.tipoIndicador || 'Indicador de Incremento de Receita',
    valorReceitaAntes,
    valorReceitaDepois,
    deltaReceita
  }
}

/**
 * Calcula métricas específicas para indicador do tipo CAPACIDADE ANALÍTICA
 */
export const calcularMetricasCapacidadeAnalitica = (indicador) => {
  if (!indicador) return null

  const baselineData = indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.postIAData || indicador.postIA || indicador.post_ia_data || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  // Usa função auxiliar para normalizar tipo (suporta formato antigo e normalizado)
  const tipoIndicador = normalizarTipoIndicador(indicador)
  
  if (tipoIndicador !== 'Capacidade Analítica') {
    return null
  }

  const quantidadeAnalisesAntes = toNumber(baselineData.quantidadeAnalises || 0)
  const quantidadeAnalisesDepois = toNumber(postIAData.quantidadeAnalises || 0)
  const aumentoCapacidade = quantidadeAnalisesAntes > 0 
    ? ((quantidadeAnalisesDepois - quantidadeAnalisesAntes) / quantidadeAnalisesAntes) * 100 
    : 0

  return {
    tipo: 'CAPACIDADE ANALÍTICA',
    nome: obterNomeIndicador(indicador) || 'Capacidade Analítica',
    quantidadeAnalisesAntes,
    quantidadeAnalisesDepois,
    aumentoCapacidade: Math.round(aumentoCapacidade * 100) / 100
  }
}

/**
 * Calcula métricas específicas para indicador do tipo MELHORIA MARGEM
 */
export const calcularMetricasMelhoriaMargem = (indicador) => {
  if (!indicador) return null

  const baselineData = indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.postIAData || indicador.postIA || indicador.post_ia_data || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  // Usa função auxiliar para normalizar tipo (suporta formato antigo e normalizado)
  const tipoIndicador = normalizarTipoIndicador(indicador)
  const tipoMapeado = tipoIndicador === 'Melhoria Margem' ? 'MELHORIA MARGEM' : tipoIndicador
  
  if (tipoMapeado !== 'MELHORIA MARGEM' && baselineData.tipo !== 'MELHORIA MARGEM' && postIAData.tipo !== 'MELHORIA MARGEM') {
    return null
  }

  // BASELINE
  const receitaBrutaMensal = toNumber(baselineData.receitaBrutaMensal || 0)
  const custoTotalMensal = toNumber(baselineData.custoTotalMensal || 0)
  const margemBrutaAtual = toNumber(baselineData.margemBrutaAtual || 0)
  const volumeTransacoes = toNumber(baselineData.volumeTransacoes || 0)

  // PÓS-IA
  const receitaBrutaMensalEstimada = toNumber(postIAData.receitaBrutaMensalEstimada || 0)
  const custoTotalMensalEstimado = toNumber(postIAData.custoTotalMensalEstimado || 0)
  const margemBrutaEstimada = toNumber(postIAData.margemBrutaEstimada || 0)
  const volumeTransacoesEstimado = toNumber(postIAData.volumeTransacoesEstimado || 0)

  // CÁLCULOS

  // 1. Delta Margem (%)
  const deltaMargem = margemBrutaEstimada - margemBrutaAtual

  // 2. Lucro Bruto Baseline
  const lucroBrutoBaseline = receitaBrutaMensal - custoTotalMensal

  // 3. Lucro Bruto Estimado
  const lucroBrutoEstimado = receitaBrutaMensalEstimada - custoTotalMensalEstimado

  // 4. Delta Margem em Reais (diferença de lucro)
  const deltaMargemReais = lucroBrutoEstimado - lucroBrutoBaseline

  // 5. Economia Mensal (ganho no lucro)
  const economiaMensal = deltaMargemReais

  // 6. Economia Anual
  const economiaAnual = economiaMensal * 12

  // 7. ROI da Implementação (precisa de custoImplementacao)
  // Assumindo que o custo de implementação vem de custos_relacionados
  const custosData = indicador.custos_relacionados || indicador.custosRelacionados || {}
  const custoImplementacao = toNumber(custosData.custoTotalImplementacao || 0)
  
  const roi = custoImplementacao > 0 
    ? ((economiaAnual - custoImplementacao) / custoImplementacao) * 100 
    : 0

  // 8. Payback (em meses)
  const payback = economiaMensal > 0 && custoImplementacao > 0
    ? custoImplementacao / economiaMensal
    : 0

  // 9. Impacto no Lucro Anual
  const impactoLucroAnual = economiaAnual

  return {
    tipo: 'MELHORIA MARGEM',
    nome: obterNomeIndicador(indicador) || 'Melhoria de Margem',
    
    // Dados Baseline
    receitaBrutaMensal,
    custoTotalMensal,
    margemBrutaAtual,
    volumeTransacoes,
    lucroBrutoBaseline,
    
    // Dados Pós-IA
    receitaBrutaMensalEstimada,
    custoTotalMensalEstimado,
    margemBrutaEstimada,
    volumeTransacoesEstimado,
    lucroBrutoEstimado,
    
    // Métricas Calculadas
    deltaMargem,              // % de melhoria na margem
    deltaMargemReais,         // R$ de melhoria na margem
    economiaMensal,           // R$ economizado por mês
    economiaAnual,            // R$ economizado por ano
    roi,                      // % de ROI
    payback,                  // meses para retorno
    impactoLucroAnual,        // R$ de impacto anual no lucro
    custoImplementacao        // R$ investido
  }
}

/**
 * Calcula métricas específicas para indicador do tipo REDUÇÃO DE RISCO
 */
export const calcularMetricasReducaoRisco = (indicador) => {
  if (!indicador) return null

  const baselineData = indicador.baseline_data || indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.post_ia_data || indicador.postIAData || indicador.postIA || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  const tipoIndicador = normalizarTipoIndicador(indicador)
  const tipoMapeado = tipoIndicador === 'Redução de Risco' ? 'REDUÇÃO DE RISCO' : tipoIndicador
  
  if (tipoMapeado !== 'REDUÇÃO DE RISCO' && baselineData.tipo !== 'REDUÇÃO DE RISCO' && postIAData.tipo !== 'REDUÇÃO DE RISCO') {
    return null
  }

  // Dados de Baseline
  const probabilidadeAtual = toNumber(baselineData.probabilidadeAtual || baselineData.probabilidade || 0)
  const impactoFinanceiro = toNumber(baselineData.impactoFinanceiro || 0)
  const custoMitigacaoAtual = toNumber(baselineData.custoMitigacaoAtual || 0)

  // Dados Pós-IA
  const probabilidadeComIA = toNumber(postIAData.probabilidadeComIA || postIAData.probabilidadeDepois || 0)
  const impactoFinanceiroReduzido = toNumber(postIAData.impactoFinanceiroReduzido || postIAData.impactoFinanceiroDepois || impactoFinanceiro)
  const custoMitigacaoComIA = toNumber(postIAData.custoMitigacaoComIA || custoMitigacaoAtual)

  // Custo de Implementação (dos custos relacionados)
  const custosRelacionados = indicador.custos_relacionados || indicador.custosRelacionados || {}
  const custoImplementacao = toNumber(custosRelacionados.custoTotalImplementacao || 0)

  // 1. Redução de Probabilidade (%)
  const reducaoProbabilidade = probabilidadeAtual - probabilidadeComIA

  // 2. Valor do Risco Evitado (R$)
  // Exposição ao risco antes vs depois
  const exposicaoAntes = (probabilidadeAtual / 100) * impactoFinanceiro
  const exposicaoDepois = (probabilidadeComIA / 100) * impactoFinanceiroReduzido
  const valorRiscoEvitado = exposicaoAntes - exposicaoDepois

  // 3. Economia em Mitigação (R$/mês)
  const economiaMitigacao = custoMitigacaoAtual - custoMitigacaoComIA

  // 4. Benefício Anual (R$)
  // Benefício = Economia de mitigação anual + Valor do risco evitado (anualizado)
  const beneficioAnual = (economiaMitigacao * 12) + valorRiscoEvitado

  // 5. Custo vs Benefício
  const custoVsBeneficio = custoImplementacao > 0 
    ? beneficioAnual / custoImplementacao 
    : 0

  // 6. ROI da Redução de Risco (%)
  const roiReducaoRisco = custoImplementacao > 0
    ? ((beneficioAnual - custoImplementacao) / custoImplementacao) * 100
    : 0

  const resultado = {
    tipo: 'REDUÇÃO DE RISCO',
    nome: obterNomeIndicador(indicador) || 'Redução de Risco',
    
    // Dados Baseline
    probabilidadeAtual,
    impactoFinanceiro,
    custoMitigacaoAtual,
    exposicaoAntes,
    
    // Dados Pós-IA
    probabilidadeComIA,
    impactoFinanceiroReduzido,
    custoMitigacaoComIA,
    exposicaoDepois,
    
    // Métricas Calculadas (6 solicitadas)
    reducaoProbabilidade,       // % de redução
    valorRiscoEvitado,          // R$ de risco evitado
    economiaMitigacao,          // R$/mês economizado
    beneficioAnual,             // R$ benefício anual total
    custoVsBeneficio,           // Razão benefício/custo
    roiReducaoRisco,            // % de ROI
    custoImplementacao          // R$ investido
  }

  return resultado
}

/**
 * Calcula métricas específicas para indicador do tipo QUALIDADE DECISÃO
 */
export const calcularMetricasQualidadeDecisao = (indicador) => {
  if (!indicador) return null

  const baselineData = indicador.baseline_data || indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.post_ia_data || indicador.postIAData || indicador.postIA || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  const tipoIndicador = normalizarTipoIndicador(indicador)
  const tipoMapeado = tipoIndicador === 'Qualidade Decisão' ? 'QUALIDADE DECISÃO' : tipoIndicador
  
  if (tipoMapeado !== 'QUALIDADE DECISÃO' && baselineData.tipo !== 'QUALIDADE DECISÃO' && postIAData.tipo !== 'QUALIDADE DECISÃO') {
    return null
  }

  // Dados de Baseline
  const numeroDecisoesPeriodo = toNumber(baselineData.numeroDecisoesPeriodo || 0)
  const periodo = baselineData.periodo || 'mês'
  const taxaAcertoAtual = toNumber(baselineData.taxaAcertoAtual || 0)
  const custoMedioDecisaoErrada = toNumber(baselineData.custoMedioDecisaoErrada || 0)
  const tempoMedioDecisao = toNumber(baselineData.tempoMedioDecisao || 0)
  const pessoasEnvolvidas = toNumber(baselineData.pessoasEnvolvidas || 0)
  const valorHoraMedio = toNumber(baselineData.valorHoraMedio || 0)

  // Dados Pós-IA
  const numeroDecisoesPeriodoComIA = toNumber(postIAData.numeroDecisoesPeriodoComIA || 0)
  const periodoComIA = postIAData.periodoComIA || 'mês'
  const taxaAcertoComIA = toNumber(postIAData.taxaAcertoComIA || 0)
  const custoMedioDecisaoErradaComIA = toNumber(postIAData.custoMedioDecisaoErradaComIA || 0)
  const tempoMedioDecisaoComIA = toNumber(postIAData.tempoMedioDecisaoComIA || 0)
  const pessoasEnvolvidasComIA = toNumber(postIAData.pessoasEnvolvidasComIA || 0)

  // Custo de Implementação (dos custos relacionados)
  const custosRelacionados = indicador.custos_relacionados || indicador.custosRelacionados || {}
  const custoImplementacao = toNumber(custosRelacionados.custoTotalImplementacao || 0)

  // Normalizar decisões para mensal
  const fatorBaseline = periodo === 'dia' ? 30 : periodo === 'semana' ? 4 : 1
  const fatorComIA = periodoComIA === 'dia' ? 30 : periodoComIA === 'semana' ? 4 : 1
  
  const decisoesMensalBaseline = numeroDecisoesPeriodo * fatorBaseline
  const decisoesMensalComIA = numeroDecisoesPeriodoComIA * fatorComIA

  // 1. Melhoria na Taxa de Acerto (%)
  const melhoriaTaxaAcerto = taxaAcertoComIA - taxaAcertoAtual

  // 2. Economia com Erros Evitados (R$/mês)
  const decisoesErradasBaseline = decisoesMensalBaseline * (1 - taxaAcertoAtual / 100)
  const decisoesErradasComIA = decisoesMensalComIA * (1 - taxaAcertoComIA / 100)
  const economiaErrosEvitados = (decisoesErradasBaseline * custoMedioDecisaoErrada) - 
                                 (decisoesErradasComIA * custoMedioDecisaoErradaComIA)

  // 3. Economia de Tempo (horas/mês)
  const tempoTotalBaseline = (decisoesMensalBaseline * tempoMedioDecisao * pessoasEnvolvidas) / 60
  const tempoTotalComIA = (decisoesMensalComIA * tempoMedioDecisaoComIA * pessoasEnvolvidasComIA) / 60
  const economiaTempo = tempoTotalBaseline - tempoTotalComIA

  // 4. Valor do Tempo Economizado (R$)
  const valorTempoEconomizado = economiaTempo * valorHoraMedio

  // 5. Benefício Total Mensal (R$)
  const beneficioTotalMensal = economiaErrosEvitados + valorTempoEconomizado

  // 6. ROI da Melhoria (%)
  const beneficioAnual = beneficioTotalMensal * 12
  const roiMelhoria = custoImplementacao > 0
    ? ((beneficioAnual - custoImplementacao) / custoImplementacao) * 100
    : 0

  const resultado = {
    tipo: 'QUALIDADE DECISÃO',
    nome: obterNomeIndicador(indicador) || 'Qualidade de Decisão',
    
    // Dados Baseline
    numeroDecisoesPeriodo,
    periodo,
    taxaAcertoAtual,
    custoMedioDecisaoErrada,
    tempoMedioDecisao,
    pessoasEnvolvidas,
    valorHoraMedio,
    decisoesMensalBaseline,
    decisoesErradasBaseline,
    
    // Dados Pós-IA
    numeroDecisoesPeriodoComIA,
    periodoComIA,
    taxaAcertoComIA,
    custoMedioDecisaoErradaComIA,
    tempoMedioDecisaoComIA,
    pessoasEnvolvidasComIA,
    decisoesMensalComIA,
    decisoesErradasComIA,
    
    // Métricas Calculadas (6 solicitadas)
    melhoriaTaxaAcerto,         // % de melhoria
    economiaErrosEvitados,      // R$/mês economizado
    economiaTempo,              // horas/mês economizadas
    valorTempoEconomizado,      // R$ valor do tempo
    beneficioTotalMensal,       // R$ benefício total mensal
    roiMelhoria,                // % de ROI
    custoImplementacao          // R$ investido
  }

  return resultado
}

/**
 * Calcula métricas específicas para indicador do tipo VELOCIDADE
 */
export const calcularMetricasVelocidade = (indicador) => {
  if (!indicador) return null

  const baselineData = indicador.baseline_data || indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.post_ia_data || indicador.postIAData || indicador.postIA || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  const tipoIndicador = normalizarTipoIndicador(indicador)
  const tipoMapeado = tipoIndicador === 'Velocidade' ? 'VELOCIDADE' : tipoIndicador
  
  if (tipoMapeado !== 'VELOCIDADE' && baselineData.tipo !== 'VELOCIDADE' && postIAData.tipo !== 'VELOCIDADE') {
    return null
  }

  // BASELINE
  const tempoMedioEntregaAtual = toNumber(baselineData.tempoMedioEntregaAtual || 0)
  const unidadeTempoEntrega = baselineData.unidadeTempoEntrega || 'dias'
  const numeroEntregasPeriodo = toNumber(baselineData.numeroEntregasPeriodo || 0)
  const periodoEntregas = baselineData.periodoEntregas || 'mês'
  const custoPorAtraso = toNumber(baselineData.custoPorAtraso || 0)
  const pessoasEnvolvidas = toNumber(baselineData.pessoasEnvolvidas || 0)
  const valorHoraMedio = toNumber(baselineData.valorHoraMedio || 0)
  const tempoTrabalhoPorEntrega = toNumber(baselineData.tempoTrabalhoPorEntrega || 0)

  // PÓS-IA
  const tempoMedioEntregaComIA = toNumber(postIAData.tempoMedioEntregaComIA || 0)
  const unidadeTempoEntregaComIA = postIAData.unidadeTempoEntregaComIA || 'dias'
  const numeroEntregasPeriodoComIA = toNumber(postIAData.numeroEntregasPeriodoComIA || 0)
  const periodoEntregasComIA = postIAData.periodoEntregasComIA || 'mês'
  const custoPorAtrasoReduzido = toNumber(postIAData.custoPorAtrasoReduzido || 0)
  const pessoasEnvolvidasComIA = toNumber(postIAData.pessoasEnvolvidasComIA || 0)
  const tempoTrabalhoPorEntregaComIA = toNumber(postIAData.tempoTrabalhoPorEntregaComIA || 0)

  // Custo de Implementação
  const custosRelacionados = indicador.custos_relacionados || indicador.custosRelacionados || {}
  const custoImplementacao = toNumber(custosRelacionados.custoTotalImplementacao || 0)

  // Normalizar entregas para mensal
  const fatorBaseline = periodoEntregas === 'dia' ? 30 : periodoEntregas === 'semana' ? 4 : periodoEntregas === 'ano' ? 1/12 : 1
  const fatorComIA = periodoEntregasComIA === 'dia' ? 30 : periodoEntregasComIA === 'semana' ? 4 : periodoEntregasComIA === 'ano' ? 1/12 : 1
  
  const entregasMensalBaseline = numeroEntregasPeriodo * fatorBaseline
  const entregasMensalComIA = numeroEntregasPeriodoComIA * fatorComIA

  // Normalizar tempo de entrega para horas
  const tempoEntregaHorasBaseline = unidadeTempoEntrega === 'dias' ? tempoMedioEntregaAtual * 24 : tempoMedioEntregaAtual
  const tempoEntregaHorasComIA = unidadeTempoEntregaComIA === 'dias' ? tempoMedioEntregaComIA * 24 : tempoMedioEntregaComIA

  // 1. Redução de Tempo de Entrega (%)
  const reducaoTempoEntrega = tempoEntregaHorasBaseline > 0
    ? ((tempoEntregaHorasBaseline - tempoEntregaHorasComIA) / tempoEntregaHorasBaseline) * 100
    : 0

  // 2. Aumento de Capacidade (entregas/mês)
  const aumentoCapacidade = entregasMensalComIA - entregasMensalBaseline

  // 3. Economia com Redução de Atrasos (R$/mês)
  const economiaAtrasos = (custoPorAtraso - custoPorAtrasoReduzido) * entregasMensalComIA

  // 4. Valor do Tempo Economizado (R$)
  const horasTotaisBaseline = entregasMensalBaseline * tempoTrabalhoPorEntrega * pessoasEnvolvidas
  const horasTotaisComIA = entregasMensalComIA * tempoTrabalhoPorEntregaComIA * pessoasEnvolvidasComIA
  const horasEconomizadas = horasTotaisBaseline - horasTotaisComIA
  const valorTempoEconomizado = horasEconomizadas * valorHoraMedio

  // 5. Ganho de Produtividade (%)
  const ganhoProdutividade = entregasMensalBaseline > 0
    ? ((entregasMensalComIA - entregasMensalBaseline) / entregasMensalBaseline) * 100
    : 0

  // 6. ROI da Velocidade (%)
  const beneficioMensal = economiaAtrasos + valorTempoEconomizado
  const beneficioAnual = beneficioMensal * 12
  const roiVelocidade = custoImplementacao > 0
    ? ((beneficioAnual - custoImplementacao) / custoImplementacao) * 100
    : 0

  const resultado = {
    tipo: 'VELOCIDADE',
    nome: obterNomeIndicador(indicador) || 'Velocidade',
    
    // Baseline
    tempoMedioEntregaAtual,
    unidadeTempoEntrega,
    numeroEntregasPeriodo,
    periodoEntregas,
    entregasMensalBaseline,
    custoPorAtraso,
    pessoasEnvolvidas,
    valorHoraMedio,
    tempoTrabalhoPorEntrega,
    
    // Pós-IA
    tempoMedioEntregaComIA,
    unidadeTempoEntregaComIA,
    numeroEntregasPeriodoComIA,
    periodoEntregasComIA,
    entregasMensalComIA,
    custoPorAtrasoReduzido,
    pessoasEnvolvidasComIA,
    tempoTrabalhoPorEntregaComIA,
    
    // Métricas (6)
    reducaoTempoEntrega,
    aumentoCapacidade,
    economiaAtrasos,
    valorTempoEconomizado,
    ganhoProdutividade,
    roiVelocidade,
    custoImplementacao
  }

  return resultado
}

/**
 * Calcula métricas específicas para indicador do tipo SATISFAÇÃO
 */
export const calcularMetricasSatisfacao = (indicador) => {
  if (!indicador) return null

  const baselineData = indicador.baseline_data || indicador.baselineData || indicador.baseline || {}
  const postIAData = indicador.post_ia_data || indicador.postIAData || indicador.postIA || {}
  const infoData = indicador.info_data || indicador.infoData || {}

  const tipoIndicador = normalizarTipoIndicador(indicador)
  const tipoMapeado = tipoIndicador === 'Satisfação' ? 'SATISFAÇÃO' : tipoIndicador
  
  if (tipoMapeado !== 'SATISFAÇÃO' && baselineData.tipo !== 'SATISFAÇÃO' && postIAData.tipo !== 'SATISFAÇÃO') {
    return null
  }

  // BASELINE
  const scoreAtual = toNumber(baselineData.scoreAtual || 0)
  const tipoScore = baselineData.tipoScore || 'NPS'
  const numeroClientes = toNumber(baselineData.numeroClientes || 0)
  const valorMedioPorCliente = toNumber(baselineData.valorMedioPorCliente || 0)
  const taxaChurnAtual = toNumber(baselineData.taxaChurnAtual || 0)
  const custoAquisicaoCliente = toNumber(baselineData.custoAquisicaoCliente || 0)
  const ticketMedioSuporte = toNumber(baselineData.ticketMedioSuporte || 0)

  // PÓS-IA
  const scoreComIA = toNumber(postIAData.scoreComIA || 0)
  const numeroClientesEsperado = toNumber(postIAData.numeroClientesEsperado || 0)
  const valorMedioPorClienteComIA = toNumber(postIAData.valorMedioPorClienteComIA || 0)
  const taxaChurnComIA = toNumber(postIAData.taxaChurnComIA || 0)
  const ticketMedioSuporteComIA = toNumber(postIAData.ticketMedioSuporteComIA || 0)

  // Custo de Implementação
  const custosRelacionados = indicador.custos_relacionados || indicador.custosRelacionados || {}
  const custoImplementacao = toNumber(custosRelacionados.custoTotalImplementacao || 0)

  // 1. Delta de Satisfação (pontos)
  const deltaSatisfacao = scoreComIA - scoreAtual

  // 2. Redução de Churn (%)
  const reducaoChurn = taxaChurnAtual - taxaChurnComIA

  // 3. Valor de Retenção (R$/ano)
  const clientesRetidos = numeroClientes * (reducaoChurn / 100)
  const valorRetencao = clientesRetidos * valorMedioPorCliente * 12

  // 4. Economia com Suporte (R$/mês)
  const ticketsEvitados = ticketMedioSuporte - ticketMedioSuporteComIA
  const custoMedioTicket = 50  // R$ (placeholder - pode ser parametrizado)
  const economiaSuporte = ticketsEvitados * custoMedioTicket

  // 5. Aumento de Revenue (R$/ano)
  const revenueAnualBaseline = numeroClientes * valorMedioPorCliente * 12
  const revenueAnualComIA = numeroClientesEsperado * valorMedioPorClienteComIA * 12
  const aumentoRevenue = revenueAnualComIA - revenueAnualBaseline

  // 6. LTV (Lifetime Value) Incrementado
  const ltvAntes = taxaChurnAtual > 0 
    ? valorMedioPorCliente / (taxaChurnAtual / 100)
    : 0
  const ltvDepois = taxaChurnComIA > 0
    ? valorMedioPorClienteComIA / (taxaChurnComIA / 100)
    : 0
  const ltvIncrementado = ltvDepois - ltvAntes

  // 7. ROI da Satisfação (%)
  const beneficioAnual = valorRetencao + (economiaSuporte * 12) + aumentoRevenue
  const roiSatisfacao = custoImplementacao > 0
    ? ((beneficioAnual - custoImplementacao) / custoImplementacao) * 100
    : 0

  const resultado = {
    tipo: 'SATISFAÇÃO',
    nome: obterNomeIndicador(indicador) || 'Satisfação',
    
    // Baseline
    scoreAtual,
    tipoScore,
    numeroClientes,
    valorMedioPorCliente,
    taxaChurnAtual,
    custoAquisicaoCliente,
    ticketMedioSuporte,
    
    // Pós-IA
    scoreComIA,
    numeroClientesEsperado,
    valorMedioPorClienteComIA,
    taxaChurnComIA,
    ticketMedioSuporteComIA,
    
    // Métricas (7)
    deltaSatisfacao,
    reducaoChurn,
    valorRetencao,
    economiaSuporte,
    aumentoRevenue,
    roiSatisfacao,
    ltvIncrementado,
    custoImplementacao
  }

  return resultado
}

/**
 * Detecta quais tipos de indicadores existem no projeto e retorna métricas específicas
 */
export const calcularMetricasPorTipo = (indicators) => {
  if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
    return {
      produtividade: [],
      capacidadeAnalitica: [],
      incrementoReceita: [],
      melhoriaMargem: [],
      reducaoRisco: [],
      qualidadeDecisao: [],
      velocidade: [],
      satisfacao: []
    }
  }

  const metricasProdutividade = []
  const metricasCapacidadeAnalitica = []
  const metricasIncrementoReceita = []
  const metricasMelhoriaMargem = []
  const metricasReducaoRisco = []
  const metricasQualidadeDecisao = []
  const metricasVelocidade = []
  const metricasSatisfacao = []

  indicators.forEach(indicador => {
    // Tenta calcular métricas de produtividade
    const metricasProd = calcularMetricasProdutividade(indicador)
    if (metricasProd) {
      metricasProdutividade.push(metricasProd)
      return
    }

    // Tenta calcular métricas de capacidade analítica
    const metricasCapacidade = calcularMetricasCapacidadeAnalitica(indicador)
    if (metricasCapacidade) {
      metricasCapacidadeAnalitica.push(metricasCapacidade)
      return
    }

    // Tenta calcular métricas de incremento de receita
    const metricasReceita = calcularMetricasIncrementoReceita(indicador)
    if (metricasReceita) {
      metricasIncrementoReceita.push(metricasReceita)
      return
    }

    // Tenta calcular métricas de melhoria de margem
    const metricasMargem = calcularMetricasMelhoriaMargem(indicador)
    if (metricasMargem) {
      metricasMelhoriaMargem.push(metricasMargem)
      return
    }

    // Tenta calcular métricas de redução de risco
    const metricasRisco = calcularMetricasReducaoRisco(indicador)
    if (metricasRisco) {
      metricasReducaoRisco.push(metricasRisco)
      return
    }

    // Tenta calcular métricas de qualidade de decisão
    const metricasQualidade = calcularMetricasQualidadeDecisao(indicador)
    if (metricasQualidade) {
      metricasQualidadeDecisao.push(metricasQualidade)
      return
    }

    // Tenta calcular métricas de velocidade
    const metricasVel = calcularMetricasVelocidade(indicador)
    if (metricasVel) {
      metricasVelocidade.push(metricasVel)
      return
    }

    // Tenta calcular métricas de satisfação
    const metricasSat = calcularMetricasSatisfacao(indicador)
    if (metricasSat) {
      metricasSatisfacao.push(metricasSat)
      return
    }
  })

  return {
    produtividade: metricasProdutividade,
    capacidadeAnalitica: metricasCapacidadeAnalitica,
    incrementoReceita: metricasIncrementoReceita,
    melhoriaMargem: metricasMelhoriaMargem,
    reducaoRisco: metricasReducaoRisco,
    qualidadeDecisao: metricasQualidadeDecisao,
    velocidade: metricasVelocidade,
    satisfacao: metricasSatisfacao
  }
}

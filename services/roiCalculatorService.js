/**
 * Serviço de Cálculo de ROI
 * Implementa todas as fórmulas de cálculo de ROI conforme documentação
 */

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
 * Converte período para multiplicador mensal
 */
const periodoParaMultiplicador = (periodo, quantidade) => {
  const qtd = toNumber(quantidade)
  if (qtd === 0) return 0
  
  switch (periodo) {
    case 'dias':
      return qtd * 30 // Assumindo 30 dias por mês
    case 'semanas':
      return qtd * 4.33 // Média de semanas por mês
    case 'meses':
      return qtd
    default:
      return qtd
  }
}

/**
 * Calcula o custo hora médio das pessoas
 */
const calcularCustoHoraMedio = (pessoas) => {
  if (!pessoas || pessoas.length === 0) return 0
  
  const pessoasComValor = pessoas.filter(p => toNumber(p.valorHora) > 0)
  if (pessoasComValor.length === 0) return 0
  
  const soma = pessoasComValor.reduce((acc, p) => acc + toNumber(p.valorHora), 0)
  return soma / pessoasComValor.length
}

/**
 * Calcula tempo total em minutos considerando pessoas
 */
const calcularTempoTotalPessoas = (pessoas) => {
  if (!pessoas || pessoas.length === 0) return 0
  
  return pessoas.reduce((total, pessoa) => {
    const tempo = toNumber(pessoa.tempoOperacao)
    const qtdOperacoes = toNumber(pessoa.quantidadeOperacoesTotal)
    const periodo = pessoa.periodoOperacoesTotal || 'dias'
    const multiplicador = periodoParaMultiplicador(periodo, qtdOperacoes)
    return total + (tempo * multiplicador)
  }, 0)
}

/**
 * Calcula ROI de um indicador individual
 */
export const calcularROIIndicador = (indicador) => {
  if (!indicador) {
    return null
  }

  // Suporta tanto formato antigo (comIA) quanto novo (ia)
  // A nova estrutura retorna { info, baseline, ia, custos } do indicatorDataService
  const baseline = indicador.baseline || {}
  const comIA = indicador.comIA || indicador.ia || {}
  
  // Ajusta estrutura de pessoas se vier do formato novo
  if (indicador.ia && !baseline.pessoas && baseline.pessoas === undefined) {
    // baseline já vem com pessoas do indicatorDataService
  }
  
  // Verifica se usa novo cálculo (campos de volume preenchidos)
  const usarNovoCalculo = 
    toNumber(baseline.volumeOperacoesBase) > 0 &&
    toNumber(baseline.qtdPessoasBase) > 0 &&
    toNumber(baseline.tempoOperacaoBase) > 0 &&
    toNumber(comIA.volumeIA) > 0 &&
    toNumber(comIA.tempoIA) > 0

  let tempoBaselineMinutos = 0
  let tempoComIAMinutos = 0
  let volumeBaseline = 0
  let volumeIA = 0

  if (usarNovoCalculo) {
    // NOVO CÁLCULO - Usando campos de volume
    const volumeOperacoesBase = toNumber(baseline.volumeOperacoesBase)
    const qtdPessoasBase = toNumber(baseline.qtdPessoasBase)
    const tempoOperacaoBase = toNumber(baseline.tempoOperacaoBase)
    const volumeIAValue = toNumber(comIA.volumeIA)
    const tempoIAValue = toNumber(comIA.tempoIA)

    // Tempo total baseline (minutos/mês)
    tempoBaselineMinutos = volumeOperacoesBase * qtdPessoasBase * tempoOperacaoBase
    
    // Tempo total com IA (minutos/mês)
    tempoComIAMinutos = volumeIAValue * tempoIAValue
    
    volumeBaseline = volumeOperacoesBase * qtdPessoasBase
    volumeIA = volumeIAValue
  } else {
    // CÁLCULO ANTIGO - Usando pessoas detalhadas
    const pessoasBaseline = baseline.pessoas || []
    const pessoasIA = comIA.pessoas || []
    
    tempoBaselineMinutos = calcularTempoTotalPessoas(pessoasBaseline)
    tempoComIAMinutos = calcularTempoTotalPessoas(pessoasIA)
    
    // Calcula volume baseado nas operações das pessoas
    pessoasBaseline.forEach(p => {
      const qtd = toNumber(p.quantidadeOperacoesTotal)
      const periodo = p.periodoOperacoesTotal || 'dias'
      volumeBaseline += periodoParaMultiplicador(periodo, qtd)
    })
    
    pessoasIA.forEach(p => {
      const qtd = toNumber(p.quantidadeOperacoesTotal)
      const periodo = p.periodoOperacoesTotal || 'dias'
      volumeIA += periodoParaMultiplicador(periodo, qtd)
    })
  }

  // Economia de tempo
  const tempoEconomizadoMinutos = Math.max(0, tempoBaselineMinutos - tempoComIAMinutos)
  const tempoEconomizadoHoras = tempoEconomizadoMinutos / 60
  const tempoEconomizadoAnualHoras = tempoEconomizadoHoras * 12

  // Custo hora médio (baseline)
  const pessoasBaseline = baseline.pessoas || []
  const custoHoraMedio = calcularCustoHoraMedio(pessoasBaseline) || 80 // Default R$ 80/hora

  // Economia financeira
  const economiaBrutaAnual = tempoEconomizadoAnualHoras * custoHoraMedio

  // Custos da IA
  const custoImplementacao = toNumber(comIA.custoImplementacao)
  
  // Calcula custos de ferramentas (suporta formato antigo e novo)
  let custosArray = []
  if (Array.isArray(indicador.custos)) {
    custosArray = indicador.custos
  } else if (indicador.custos && Array.isArray(indicador.custos.custos)) {
    custosArray = indicador.custos.custos
  }
  const custoMensalFerramentas = custosArray.reduce((total, custo) => {
    const valor = toNumber(custo.valor)
    if (custo.tipo === 'anual') {
      return total + (valor / 12)
    }
    return total + valor
  }, 0)
  
  const custoMensalManutencao = toNumber(comIA.custoMensalManutencao)
  const custoMensalTotal = custoMensalFerramentas + custoMensalManutencao
  const custoAnualRecorrenteIA = custoMensalTotal * 12

  // Economia líquida
  const economiaAnual = economiaBrutaAnual - custoAnualRecorrenteIA

  // Ganho de Capacidade (%)
  const ganhoCapacidade = volumeBaseline > 0 
    ? ((volumeIA / volumeBaseline) - 1) * 100 
    : 0

  // Eficiência do Processo (%)
  const tempoOperacaoBase = toNumber(baseline.tempoOperacaoBase)
  const tempoIA = toNumber(comIA.tempoIA)
  const eficiencia = tempoOperacaoBase > 0 
    ? (1 - (tempoIA / tempoOperacaoBase)) * 100 
    : 0

  // Ganho de Produtividade (%)
  const ganhoProdutividade = tempoBaselineMinutos > 0
    ? ((tempoBaselineMinutos - tempoComIAMinutos) / tempoBaselineMinutos) * 100
    : 0

  // Execuções Equivalentes
  const execucoesEquivalentes = tempoIA > 0 
    ? tempoOperacaoBase / tempoIA 
    : 0

  // ROI Percentual (1º Ano)
  const investimentoTotalAno1 = custoImplementacao + custoAnualRecorrenteIA
  const roiPercentual = investimentoTotalAno1 > 0
    ? ((economiaBrutaAnual - investimentoTotalAno1) / investimentoTotalAno1) * 100
    : economiaBrutaAnual > 0 ? Infinity : 0

  // ROI Anos Seguintes (%)
  const roiAno2Mais = custoAnualRecorrenteIA > 0
    ? ((economiaBrutaAnual - custoAnualRecorrenteIA) / custoAnualRecorrenteIA) * 100
    : economiaBrutaAnual > 0 ? Infinity : 0

  // Payback (Meses)
  const economiaLiquidaMensal = economiaAnual / 12
  let paybackMeses = Infinity
  if (economiaLiquidaMensal > 0 && custoImplementacao > 0) {
    paybackMeses = custoImplementacao / economiaLiquidaMensal
  } else if (custoImplementacao === 0 && economiaAnual > 0) {
    paybackMeses = 0 // Imediato
  }

  // Custo por execução
  const custoPorExecucaoBaseline = tempoBaselineMinutos > 0
    ? (tempoBaselineMinutos * custoHoraMedio) / 60 / volumeBaseline
    : 0

  const custoPorExecucaoComIA = volumeIA > 0
    ? (tempoComIAMinutos * custoHoraMedio) / 60 / volumeIA + (custoMensalTotal / volumeIA)
    : 0

  const economiaExecucao = custoPorExecucaoBaseline - custoPorExecucaoComIA

  return {
    // Por execução
    tempoBaselineMinutos,
    tempoComIAMinutos,
    tempoEconomizadoMinutos,
    custoPorExecucaoBaseline,
    custoPorExecucaoComIA,
    economiaExecucao,
    
    // Anualizado
    tempoEconomizadoAnualHoras,
    economiaBrutaAnual,
    custoAnualRecorrenteIA,
    economiaAnual,
    
    // Custos detalhados
    custoImplementacao,
    custoMensalFerramentas,
    custoMensalManutencao,
    custoMensalTotal,
    
    // ROI
    roiPercentual,
    roiAno2Mais,
    paybackMeses,
    
    // Produtividade
    ganhoProdutividade,
    ganhoCapacidade,
    eficiencia,
    execucoesEquivalentes,
    
    // Dados de referência
    volumeBaseline,
    volumeIA,
    usarNovoCalculo,
    custoHoraMedio
  }
}

/**
 * Calcula ROI consolidado de um projeto
 */
export const calcularROIProjeto = (projetoId, indicators) => {
  if (!indicators || indicators.length === 0) {
    return {
      totalIndicadores: 0,
      economiaAnualTotal: 0,
      economiaBrutaAnualTotal: 0,
      tempoEconomizadoAnualHoras: 0,
      roiGeral: 0,
      custoImplementacaoTotal: 0,
      custoAnualRecorrenteTotal: 0,
      paybackMedioMeses: Infinity,
      ganhoProdutividadeMedio: 0,
      ganhoCapacidadeMedio: 0,
      indicadoresDetalhados: []
    }
  }

  const indicadoresDoProjeto = indicators.filter(i => i && i.projetoId === projetoId)
  
  if (indicadoresDoProjeto.length === 0) {
    return {
      totalIndicadores: 0,
      economiaAnualTotal: 0,
      economiaBrutaAnualTotal: 0,
      tempoEconomizadoAnualHoras: 0,
      roiGeral: 0,
      custoImplementacaoTotal: 0,
      custoAnualRecorrenteTotal: 0,
      paybackMedioMeses: Infinity,
      ganhoProdutividadeMedio: 0,
      ganhoCapacidadeMedio: 0,
      indicadoresDetalhados: []
    }
  }

  const indicadoresDetalhados = indicadoresDoProjeto.map(ind => ({
    indicador: ind,
    metricas: calcularROIIndicador(ind)
  }))

  // Consolidação
  const economiaAnualTotal = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.economiaAnual || 0), 0
  )

  const economiaBrutaAnualTotal = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.economiaBrutaAnual || 0), 0
  )

  const tempoEconomizadoAnualHoras = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.tempoEconomizadoAnualHoras || 0), 0
  )

  const custoImplementacaoTotal = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.custoImplementacao || 0), 0
  )

  const custoAnualRecorrenteTotal = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.custoAnualRecorrenteIA || 0), 0
  )

  // ROI Geral
  const investimentoTotal = custoImplementacaoTotal + custoAnualRecorrenteTotal
  const roiGeral = investimentoTotal > 0
    ? ((economiaBrutaAnualTotal - investimentoTotal) / investimentoTotal) * 100
    : economiaBrutaAnualTotal > 0 ? Infinity : 0

  // Payback Médio
  const paybacks = indicadoresDetalhados
    .map(item => item.metricas?.paybackMeses)
    .filter(p => p !== undefined && p !== Infinity && !isNaN(p))
  
  const paybackMedioMeses = paybacks.length > 0
    ? paybacks.reduce((sum, p) => sum + p, 0) / paybacks.length
    : Infinity

  // Ganho de Produtividade Médio
  const ganhosProdutividade = indicadoresDetalhados
    .map(item => item.metricas?.ganhoProdutividade)
    .filter(g => g !== undefined && !isNaN(g) && g > 0)
  
  const ganhoProdutividadeMedio = ganhosProdutividade.length > 0
    ? ganhosProdutividade.reduce((sum, g) => sum + g, 0) / ganhosProdutividade.length
    : 0

  // Ganho de Capacidade Médio
  const ganhosCapacidade = indicadoresDetalhados
    .map(item => item.metricas?.ganhoCapacidade)
    .filter(g => g !== undefined && !isNaN(g) && g > 0)
  
  const ganhoCapacidadeMedio = ganhosCapacidade.length > 0
    ? ganhosCapacidade.reduce((sum, g) => sum + g, 0) / ganhosCapacidade.length
    : 0

  return {
    totalIndicadores: indicadoresDoProjeto.length,
    economiaAnualTotal,
    economiaBrutaAnualTotal,
    tempoEconomizadoAnualHoras,
    roiGeral,
    custoImplementacaoTotal,
    custoAnualRecorrenteTotal,
    paybackMedioMeses,
    ganhoProdutividadeMedio,
    ganhoCapacidadeMedio,
    indicadoresDetalhados
  }
}

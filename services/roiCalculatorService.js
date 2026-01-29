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
 * Formato atual: 'Diário' | 'Semanal' | 'Mensal'
 */
const calcularHorasPorMes = (quantidade, periodo) => {
  const qtd = toNumber(quantidade)
  if (qtd === 0) return 0
  
  switch (periodo) {
    case 'Diário':
      return qtd * 30 // 30 dias por mês (média)
    case 'Semanal':
      return qtd * 4.33 // 52 semanas / 12 meses = 4.333... semanas por mês
    case 'Mensal':
      return qtd // Já está em meses
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
 * Formato atual: usa tempoGasto (minutos) e frequenciaReal
 */
const calcularTempoTotalPessoas = (pessoas) => {
  if (!pessoas || pessoas.length === 0) return 0
  
  return pessoas.reduce((total, pessoa) => {
    const tempoGasto = toNumber(pessoa.tempoGasto) // em minutos
    const quantidade = toNumber(pessoa.frequenciaReal?.quantidade || 0)
    const periodo = pessoa.frequenciaReal?.periodo || 'Mensal'
    const horasPorMes = calcularHorasPorMes(quantidade, periodo)
    // Converte horas para minutos e multiplica pelo tempo gasto por execução
    return total + (tempoGasto * horasPorMes)
  }, 0)
}

/**
 * Calcula ROI de um indicador individual
 */
export const calcularROIIndicador = (indicador) => {
  if (!indicador) {
    return null
  }

  // Formato atual: usa baselineData e postIAData com pessoas (tempoGasto e frequenciaReal)
  const baselineData = indicador.baselineData || {}
  const postIAData = indicador.postIAData || indicador.post_ia_data || {}
  
  let tempoBaselineMinutos = 0
  let tempoComIAMinutos = 0
  let volumeBaseline = 0
  let volumeIA = 0

  // CÁLCULO ATUAL - Usando pessoas detalhadas com formato atual
  const pessoasBaseline = baselineData.pessoas || []
  const pessoasPostIA = postIAData.pessoas || []
  
  // Calcula tempo total em minutos/mês
  tempoBaselineMinutos = calcularTempoTotalPessoas(pessoasBaseline)
  tempoComIAMinutos = calcularTempoTotalPessoas(pessoasPostIA)
  
  // Calcula volume (quantidade de execuções por mês) baseado na frequência real
  pessoasBaseline.forEach(p => {
    const quantidade = toNumber(p.frequenciaReal?.quantidade || 0)
    const periodo = p.frequenciaReal?.periodo || 'Mensal'
    volumeBaseline += calcularHorasPorMes(quantidade, periodo)
  })
  
  pessoasPostIA.forEach(p => {
    const quantidade = toNumber(p.frequenciaReal?.quantidade || 0)
    const periodo = p.frequenciaReal?.periodo || 'Mensal'
    volumeIA += calcularHorasPorMes(quantidade, periodo)
  })

  // Economia de tempo
  const tempoEconomizadoMinutos = Math.max(0, tempoBaselineMinutos - tempoComIAMinutos)
  const tempoEconomizadoHoras = tempoEconomizadoMinutos / 60
  const tempoEconomizadoAnualHoras = tempoEconomizadoHoras * 12

  // Custo hora médio (baseline)
  const custoHoraMedio = calcularCustoHoraMedio(pessoasBaseline) || 80 // Default R$ 80/hora

  // Economia financeira
  const economiaBrutaAnual = tempoEconomizadoAnualHoras * custoHoraMedio

  // Custos da IA (vem de postIAData ou custos_data)
  const custoImplementacao = toNumber(postIAData.custoImplementacao || 0)
  
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
  
  // Custo mensal total (apenas ferramentas, não há mais custoMensalManutencao separado)
  const custoMensalTotal = custoMensalFerramentas
  const custoAnualRecorrenteIA = custoMensalTotal * 12

  // Economia líquida
  const economiaAnual = economiaBrutaAnual - custoAnualRecorrenteIA

  // Ganho de Capacidade (%)
  const ganhoCapacidade = volumeBaseline > 0 
    ? ((volumeIA / volumeBaseline) - 1) * 100 
    : 0

  // Eficiência do Processo (%)
  // Calcula tempo médio por execução
  const tempoMedioBaseline = pessoasBaseline.length > 0 && volumeBaseline > 0
    ? tempoBaselineMinutos / volumeBaseline
    : 0
  const tempoMedioPostIA = pessoasPostIA.length > 0 && volumeIA > 0
    ? tempoComIAMinutos / volumeIA
    : 0
  const eficiencia = tempoMedioBaseline > 0 
    ? (1 - (tempoMedioPostIA / tempoMedioBaseline)) * 100 
    : 0

  // Ganho de Produtividade (%)
  const ganhoProdutividade = tempoBaselineMinutos > 0
    ? ((tempoBaselineMinutos - tempoComIAMinutos) / tempoBaselineMinutos) * 100
    : 0

  // Execuções Equivalentes
  const execucoesEquivalentes = tempoMedioPostIA > 0 
    ? tempoMedioBaseline / tempoMedioPostIA 
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

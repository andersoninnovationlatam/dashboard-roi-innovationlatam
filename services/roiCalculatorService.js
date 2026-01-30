/**
 * Serviço de Cálculo de ROI
 * Implementa todas as fórmulas de cálculo de ROI conforme especificação técnica
 * Suporta tanto estrutura normalizada quanto formato legado (JSONB) para compatibilidade
 */

import { FrequencyUnit } from '../src/types'

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
 * Converte frequency_unit para multiplicador anual conforme especificação
 */
const getFrequencyMultiplier = (unit) => {
  switch (unit) {
    case FrequencyUnit.HOUR:
      return 8760 // 24h × 365 dias
    case FrequencyUnit.DAY:
      return 365
    case FrequencyUnit.WEEK:
      return 52
    case FrequencyUnit.MONTH:
      return 12
    case FrequencyUnit.QUARTER:
      return 4
    case FrequencyUnit.YEAR:
      return 1
    default:
      return 12 // Default mensal
  }
}

/**
 * Converte frequency_value e frequency_unit para frequência anual
 */
const convertToAnnualFrequency = (value, unit) => {
  const multiplier = getFrequencyMultiplier(unit)
  return toNumber(value) * multiplier
}

/**
 * Converte período legado para multiplicador mensal (compatibilidade)
 */
const calcularHorasPorMes = (quantidade, periodo) => {
  const qtd = toNumber(quantidade)
  if (qtd === 0) return 0

  switch (periodo) {
    case 'Diário':
      return qtd * 30
    case 'Semanal':
      return qtd * 4.33
    case 'Mensal':
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

  const pessoasComValor = pessoas.filter(p => {
    const valorHora = p.hourly_rate || p.valorHora || 0
    return toNumber(valorHora) > 0
  })
  if (pessoasComValor.length === 0) return 0

  const soma = pessoasComValor.reduce((acc, p) => {
    const valorHora = p.hourly_rate || p.valorHora || 0
    return acc + toNumber(valorHora)
  }, 0)
  return soma / pessoasComValor.length
}

/**
 * Calcula horas baseline usando estrutura normalizada ou legada
 */
const calcularHorasBaseline = (indicador, personsBaseline) => {
  if (!personsBaseline || personsBaseline.length === 0) return 0

  // Estrutura normalizada: usa frequency_value e frequency_unit do indicador
  if (indicador.frequency_value && indicador.frequency_unit) {
    const frequencyAnual = convertToAnnualFrequency(
      indicador.baseline_frequency_real || indicador.frequency_value,
      indicador.frequency_unit
    )

    // Calcula tempo total por execução em horas
    const tempoTotalPorExecucaoHoras = personsBaseline.reduce((total, pessoa) => {
      const tempoMinutos = toNumber(pessoa.time_spent_minutes || pessoa.tempoGasto || 0)
      return total + (tempoMinutos / 60)
    }, 0)

    // Horas totais por ano = tempo por execução × frequência anual
    return tempoTotalPorExecucaoHoras * frequencyAnual
  }

  // Formato legado: usa frequenciaReal de cada pessoa
  return personsBaseline.reduce((total, pessoa) => {
    const tempoMinutos = toNumber(pessoa.tempoGasto || pessoa.time_spent_minutes || 0)
    const quantidade = toNumber(pessoa.frequenciaReal?.quantidade || 0)
    const periodo = pessoa.frequenciaReal?.periodo || 'Mensal'
    const execucoesPorMes = calcularHorasPorMes(quantidade, periodo)
    const horasPorMes = (tempoMinutos / 60) * execucoesPorMes
    return total + (horasPorMes * 12) // Anualiza
  }, 0)
}

/**
 * Calcula horas pós-IA usando estrutura normalizada ou legada
 */
const calcularHorasPostIA = (indicador, personsPostIA) => {
  if (!personsPostIA || personsPostIA.length === 0) return 0

  // Estrutura normalizada
  if (indicador.frequency_value && indicador.frequency_unit) {
    const frequencyAnual = convertToAnnualFrequency(
      indicador.post_ia_frequency || indicador.frequency_value,
      indicador.frequency_unit
    )

    const tempoTotalPorExecucaoHoras = personsPostIA.reduce((total, pessoa) => {
      const tempoMinutos = toNumber(pessoa.time_spent_minutes || pessoa.tempoGasto || 0)
      return total + (tempoMinutos / 60)
    }, 0)

    return tempoTotalPorExecucaoHoras * frequencyAnual
  }

  // Formato legado
  return personsPostIA.reduce((total, pessoa) => {
    const tempoMinutos = toNumber(pessoa.tempoGasto || pessoa.time_spent_minutes || 0)
    const quantidade = toNumber(pessoa.frequenciaReal?.quantidade || 0)
    const periodo = pessoa.frequenciaReal?.periodo || 'Mensal'
    const execucoesPorMes = calcularHorasPorMes(quantidade, periodo)
    const horasPorMes = (tempoMinutos / 60) * execucoesPorMes
    return total + (horasPorMes * 12)
  }, 0)
}

/**
 * Calcula custo de mão de obra baseline anual
 */
const calcularCustoMaoObraBaseline = (indicador, personsBaseline) => {
  if (!personsBaseline || personsBaseline.length === 0) return 0

  // Estrutura normalizada
  if (indicador.frequency_value && indicador.frequency_unit) {
    const frequencyAnual = convertToAnnualFrequency(
      indicador.baseline_frequency_real || indicador.frequency_value,
      indicador.frequency_unit
    )

    return personsBaseline.reduce((total, pessoa) => {
      const tempoMinutos = toNumber(pessoa.time_spent_minutes || pessoa.tempoGasto || 0)
      const valorHora = toNumber(pessoa.hourly_rate || pessoa.valorHora || 0)
      const tempoHoras = tempoMinutos / 60
      return total + (tempoHoras * valorHora * frequencyAnual)
    }, 0)
  }

  // Formato legado
  return personsBaseline.reduce((total, pessoa) => {
    const tempoMinutos = toNumber(pessoa.tempoGasto || 0)
    const valorHora = toNumber(pessoa.valorHora || 0)
    const quantidade = toNumber(pessoa.frequenciaReal?.quantidade || 0)
    const periodo = pessoa.frequenciaReal?.periodo || 'Mensal'
    const execucoesPorMes = calcularHorasPorMes(quantidade, periodo)
    const horasPorMes = (tempoMinutos / 60) * execucoesPorMes
    return total + (horasPorMes * valorHora * 12)
  }, 0)
}

/**
 * Calcula custo de mão de obra pós-IA anual
 */
const calcularCustoMaoObraPostIA = (indicador, personsPostIA) => {
  if (!personsPostIA || personsPostIA.length === 0) return 0

  // Estrutura normalizada
  if (indicador.frequency_value && indicador.frequency_unit) {
    const frequencyAnual = convertToAnnualFrequency(
      indicador.post_ia_frequency || indicador.frequency_value,
      indicador.frequency_unit
    )

    return personsPostIA.reduce((total, pessoa) => {
      const tempoMinutos = toNumber(pessoa.time_spent_minutes || pessoa.tempoGasto || 0)
      const valorHora = toNumber(pessoa.hourly_rate || pessoa.valorHora || 0)
      const tempoHoras = tempoMinutos / 60
      return total + (tempoHoras * valorHora * frequencyAnual)
    }, 0)
  }

  // Formato legado
  return personsPostIA.reduce((total, pessoa) => {
    const tempoMinutos = toNumber(pessoa.tempoGasto || 0)
    const valorHora = toNumber(pessoa.valorHora || 0)
    const quantidade = toNumber(pessoa.frequenciaReal?.quantidade || 0)
    const periodo = pessoa.frequenciaReal?.periodo || 'Mensal'
    const execucoesPorMes = calcularHorasPorMes(quantidade, periodo)
    const horasPorMes = (tempoMinutos / 60) * execucoesPorMes
    return total + (horasPorMes * valorHora * 12)
  }, 0)
}

/**
 * Calcula custo de ferramentas anual (baseline ou pós-IA)
 */
const calcularCustoFerramentasAnual = (tools, frequencyAnual = null) => {
  if (!tools || tools.length === 0) return 0

  return tools.reduce((total, tool) => {
    const custoMensal = toNumber(tool.monthly_cost || tool.custoMensal || 0)
    const custoAnualMensal = custoMensal * 12

    // Se há custo por execução e frequência anual, adiciona
    if (frequencyAnual && tool.cost_per_execution) {
      const custoPorExecucao = toNumber(tool.cost_per_execution)
      return total + custoAnualMensal + (custoPorExecucao * frequencyAnual)
    }

    // Formato legado
    if (tool.valor && tool.tipo) {
      if (tool.tipo === 'anual') {
        return total + toNumber(tool.valor)
      }
      return total + (toNumber(tool.valor) * 12)
    }

    return total + custoAnualMensal
  }, 0)
}

/**
 * Calcula ROI de um indicador individual
 * Suporta estrutura normalizada e formato legado
 */
export const calcularROIIndicador = (indicador) => {
  if (!indicador) {
    return null
  }

  // Detectar estrutura: normalizada ou legada
  const isNormalized = indicador.persons_baseline !== undefined ||
    indicador.persons_post_ia !== undefined ||
    (indicador.frequency_value && indicador.frequency_unit)

  let personsBaseline = []
  let personsPostIA = []
  let toolsBaseline = []
  let toolsPostIA = []
  let frequencyAnualBaseline = 0
  let frequencyAnualPostIA = 0

  if (isNormalized) {
    // Estrutura normalizada
    personsBaseline = indicador.persons_baseline || []
    personsPostIA = indicador.persons_post_ia || []
    toolsBaseline = indicador.tools_baseline || []
    toolsPostIA = indicador.tools_post_ia || []

    frequencyAnualBaseline = convertToAnnualFrequency(
      indicador.baseline_frequency_real || indicador.frequency_value || 0,
      indicador.frequency_unit || FrequencyUnit.MONTH
    )

    frequencyAnualPostIA = convertToAnnualFrequency(
      indicador.post_ia_frequency || indicador.frequency_value || 0,
      indicador.frequency_unit || FrequencyUnit.MONTH
    )
  } else {
    // Formato legado (compatibilidade)
    const baselineData = indicador.baselineData || {}
    const postIAData = indicador.postIAData || indicador.post_ia_data || {}

    personsBaseline = baselineData.pessoas || []
    personsPostIA = postIAData.pessoas || []

    // Extrair ferramentas do formato legado
    const custosData = indicador.custos_data || indicador.custos || {}
    if (Array.isArray(custosData)) {
      toolsPostIA = custosData
    } else if (custosData.custos && Array.isArray(custosData.custos)) {
      toolsPostIA = custosData.custos
    }

    // Calcular frequências do formato legado
    personsBaseline.forEach(p => {
      const quantidade = toNumber(p.frequenciaReal?.quantidade || 0)
      const periodo = p.frequenciaReal?.periodo || 'Mensal'
      frequencyAnualBaseline += calcularHorasPorMes(quantidade, periodo) * 12
    })

    personsPostIA.forEach(p => {
      const quantidade = toNumber(p.frequenciaReal?.quantidade || 0)
      const periodo = p.frequenciaReal?.periodo || 'Mensal'
      frequencyAnualPostIA += calcularHorasPorMes(quantidade, periodo) * 12
    })
  }

  // Calcular horas
  const horasBaselineAnual = calcularHorasBaseline(indicador, personsBaseline)
  const horasPostIAAnual = calcularHorasPostIA(indicador, personsPostIA)
  const horasEconomizadasAnual = Math.max(0, horasBaselineAnual - horasPostIAAnual)

  // Calcular custos de mão de obra
  const custoMaoObraBaselineAnual = calcularCustoMaoObraBaseline(indicador, personsBaseline)
  const custoMaoObraPostIAAnual = calcularCustoMaoObraPostIA(indicador, personsPostIA)

  // Calcular custos de ferramentas
  const custoFerramentasBaselineAnual = calcularCustoFerramentasAnual(toolsBaseline, frequencyAnualBaseline)
  const custoFerramentasPostIAAnual = calcularCustoFerramentasAnual(toolsPostIA, frequencyAnualPostIA)

  // Custos totais
  const custoTotalBaselineAnual = custoMaoObraBaselineAnual + custoFerramentasBaselineAnual
  const custoTotalPostIAAnual = custoMaoObraPostIAAnual + custoFerramentasPostIAAnual

  // Economia bruta anual
  const economiaBrutaAnual = Math.max(0, custoTotalBaselineAnual - custoTotalPostIAAnual)

  // Custo hora médio (baseline)
  const custoHoraMedio = calcularCustoHoraMedio(personsBaseline) || 80

  // Economia de horas convertida para dinheiro (alternativa)
  const economiaBrutaAnualPorHoras = horasEconomizadasAnual * custoHoraMedio

  // Usar o maior valor entre economia por custos e economia por horas
  const economiaBrutaAnualFinal = Math.max(economiaBrutaAnual, economiaBrutaAnualPorHoras)

  // Custo de implementação (vem do projeto, não do indicador)
  const custoImplementacao = 0 // Será calculado no nível do projeto

  // Economia líquida anual
  const economiaLiquidaAnual = economiaBrutaAnualFinal - custoFerramentasPostIAAnual

  // ROI Percentual (1º Ano)
  const investimentoTotalAno1 = custoImplementacao + custoFerramentasPostIAAnual
  const roiPercentual = investimentoTotalAno1 > 0
    ? ((economiaBrutaAnualFinal - investimentoTotalAno1) / investimentoTotalAno1) * 100
    : economiaBrutaAnualFinal > 0 ? Infinity : 0

  // ROI Anos Seguintes (%)
  const roiAno2Mais = custoFerramentasPostIAAnual > 0
    ? ((economiaBrutaAnualFinal - custoFerramentasPostIAAnual) / custoFerramentasPostIAAnual) * 100
    : economiaBrutaAnualFinal > 0 ? Infinity : 0

  // Payback (Meses)
  const economiaLiquidaMensal = economiaLiquidaAnual / 12
  let paybackMeses = Infinity
  if (economiaLiquidaMensal > 0 && custoImplementacao > 0) {
    paybackMeses = custoImplementacao / economiaLiquidaMensal
  } else if (custoImplementacao === 0 && economiaLiquidaAnual > 0) {
    paybackMeses = 0
  }

  // Ganho de Produtividade (%)
  const ganhoProdutividade = horasBaselineAnual > 0
    ? ((horasBaselineAnual - horasPostIAAnual) / horasBaselineAnual) * 100
    : 0

  // Ganho de Capacidade (%)
  const ganhoCapacidade = frequencyAnualBaseline > 0
    ? ((frequencyAnualPostIA / frequencyAnualBaseline) - 1) * 100
    : 0

  // Eficiência do Processo (%)
  const tempoMedioBaseline = frequencyAnualBaseline > 0
    ? horasBaselineAnual / frequencyAnualBaseline
    : 0
  const tempoMedioPostIA = frequencyAnualPostIA > 0
    ? horasPostIAAnual / frequencyAnualPostIA
    : 0
  const eficiencia = tempoMedioBaseline > 0
    ? (1 - (tempoMedioPostIA / tempoMedioBaseline)) * 100
    : 0

  return {
    // Horas
    horasBaselineAnual,
    horasPostIAAnual,
    horasEconomizadasAnual,
    horasEconomizadasMensal: horasEconomizadasAnual / 12,

    // Custos
    custoMaoObraBaselineAnual,
    custoMaoObraPostIAAnual,
    custoFerramentasBaselineAnual,
    custoFerramentasPostIAAnual,
    custoTotalBaselineAnual,
    custoTotalPostIAAnual,

    // Economia
    economiaBrutaAnual: economiaBrutaAnualFinal,
    economiaLiquidaAnual,
    economiaMensal: economiaLiquidaAnual / 12,

    // ROI
    roiPercentual,
    roiAno2Mais,
    paybackMeses,

    // Métricas de produtividade
    ganhoProdutividade,
    ganhoCapacidade,
    eficiencia,

    // Dados de referência
    frequencyAnualBaseline,
    frequencyAnualPostIA,
    custoHoraMedio
  }
}

/**
 * Calcula ROI consolidado de um projeto
 */
export const calcularROIProjeto = (projetoId, indicators, projectData = null) => {
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

  const indicadoresDoProjeto = indicators.filter(i => {
    if (!i) return false
    // Verificar se pertence ao projeto (formato normalizado ou legado)
    return i.project_id === projetoId || i.projetoId === projetoId
  })

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
    (sum, item) => sum + (item.metricas?.economiaLiquidaAnual || 0), 0
  )

  const economiaBrutaAnualTotal = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.economiaBrutaAnual || 0), 0
  )

  const tempoEconomizadoAnualHoras = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.horasEconomizadasAnual || 0), 0
  )

  // Custo de implementação vem do projeto
  const custoImplementacaoTotal = projectData?.implementation_cost || 0
  const custoMensalManutencao = projectData?.monthly_maintenance_cost || 0
  const custoAnualManutencao = custoMensalManutencao * 12

  // Custo anual recorrente total (ferramentas dos indicadores + manutenção do projeto)
  const custoAnualRecorrenteTotal = indicadoresDetalhados.reduce(
    (sum, item) => sum + (item.metricas?.custoFerramentasPostIAAnual || 0), 0
  ) + custoAnualManutencao

  // Investimento total primeiro ano
  const investimentoTotalAno1 = custoImplementacaoTotal + custoAnualRecorrenteTotal

  // ROI Geral
  const roiGeral = investimentoTotalAno1 > 0
    ? ((economiaBrutaAnualTotal - investimentoTotalAno1) / investimentoTotalAno1) * 100
    : economiaBrutaAnualTotal > 0 ? Infinity : 0

  // Payback Médio
  const economiaLiquidaMensal = economiaAnualTotal / 12
  const paybackMedioMeses = economiaLiquidaMensal > 0 && custoImplementacaoTotal > 0
    ? custoImplementacaoTotal / economiaLiquidaMensal
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
    custoAnualManutencao,
    paybackMedioMeses,
    ganhoProdutividadeMedio,
    ganhoCapacidadeMedio,
    indicadoresDetalhados
  }
}

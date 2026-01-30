import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import {
  IndicatorType,
  BaselineData
} from '../../types/baseline'
import {
  PostIAData,
  PostIAProdutividadePerson
} from '../../types/postIA'

// Mapeamento dos tipos do sistema antigo para os novos tipos
const TIPO_MAPPING: Record<string, IndicatorType> = {
  'Produtividade': 'PRODUTIVIDADE',
  'Capacidade Analítica': 'CAPACIDADE ANALÍTICA',
  'Incremento Receita': 'INCREMENTO RECEITA',
  'Melhoria Margem': 'MELHORIA MARGEM',
  'Redução de Risco': 'REDUÇÃO DE RISCO',
  'Qualidade Decisão': 'QUALIDADE DECISÃO',
  'Velocidade': 'VELOCIDADE',
  'Satisfação': 'SATISFAÇÃO'
}

interface PostIATabProps {
  tipoIndicador: string
  baselineData?: BaselineData | null
  postIAData?: PostIAData | null
  onPostIAChange?: (data: PostIAData) => void
}

export const PostIATab = ({
  tipoIndicador,
  baselineData,
  postIAData,
  onPostIAChange
}: PostIATabProps) => {
  const tipoPostIA = TIPO_MAPPING[tipoIndicador] || 'PRODUTIVIDADE'

  // Helper para formatar valor numérico (permite zero mas remove zeros à esquerda)
  const formatNumberValue = (value: number): string => {
    if (value === null || value === undefined) return ''
    if (value === 0) return '0'  // Permite zero
    return value.toString().replace(/^0+/, '')  // Remove zeros à esquerda
  }

  // Inicializa dados herdando do Baseline
  const [data, setData] = useState<PostIAData>(() => {
    if (postIAData) {
      return postIAData
    }

    // Herda dados do Baseline
    if (baselineData) {
      if (baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData) {
        return {
          tipo: 'PRODUTIVIDADE',
          pessoaEnvolvida: false,
          pessoas: [],
          custoTotalPostIA: 0,
          deltaProdutividade: 0
        }
      } else if (baselineData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaAntes' in baselineData) {
        return {
          tipo: 'INCREMENTO RECEITA',
          valorReceitaDepois: baselineData.valorReceitaAntes,
          deltaReceita: 0
        }
      } else if (baselineData.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in baselineData) {
        return {
          tipo: 'CUSTOS RELACIONADOS',
          ferramentas: baselineData.ferramentas.map(f => ({
            id: f.id,
            nomeFerramenta: f.nomeFerramenta,
            custoMensal: f.custoMensal,
            outrosCustos: f.outrosCustos,
            custoImplementacao: 0 // Campo exclusivo do Pós-IA
          })),
          custoTotalImplementacao: 0
        }
      } else if (baselineData.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in baselineData) {
        // Herda dados do Baseline para Capacidade Analítica
        return {
          tipo: 'CAPACIDADE ANALÍTICA',
          camposQualitativos: baselineData.camposQualitativos.map(campo => ({
            id: campo.id,
            criterio: campo.criterio,
            valor: campo.valor
          }))
        }
      } else if (baselineData.tipo === 'MELHORIA MARGEM' && 'receitaBrutaMensal' in baselineData) {
        // Herda dados do Baseline para Melhoria Margem
        return {
          tipo: 'MELHORIA MARGEM',
          receitaBrutaMensalEstimada: baselineData.receitaBrutaMensal,
          custoTotalMensalEstimado: baselineData.custoTotalMensal,
          margemBrutaEstimada: baselineData.margemBrutaAtual,
          volumeTransacoesEstimado: baselineData.volumeTransacoes,
          deltaMargem: 0,
          deltaMargemReais: 0,
          economiaMensal: 0,
          economiaAnual: 0
        }
      } else if (baselineData.tipo === 'REDUÇÃO DE RISCO' && 'tipoRisco' in baselineData) {
        // Herda dados do Baseline para Redução de Risco
        return {
          tipo: 'REDUÇÃO DE RISCO',
          probabilidadeComIA: baselineData.probabilidadeAtual,
          impactoFinanceiroReduzido: baselineData.impactoFinanceiro,
          frequenciaAvaliacaoComIA: baselineData.frequenciaAvaliacao,
          periodoAvaliacaoComIA: baselineData.periodoAvaliacao, // Herda do Baseline
          custoMitigacaoComIA: baselineData.custoMitigacaoAtual,
          reducaoProbabilidade: 0,
          valorRiscoEvitado: 0,
          economiaMitigacao: 0,
          beneficioAnual: 0,
          custoVsBeneficio: 0,
          roiReducaoRisco: 0
        }
      } else if (baselineData.tipo === 'QUALIDADE DECISÃO' && 'numeroDecisoesPeriodo' in baselineData) {
        // Herda dados do Baseline para Qualidade Decisão
        return {
          tipo: 'QUALIDADE DECISÃO',
          numeroDecisoesPeriodoComIA: baselineData.numeroDecisoesPeriodo,
          periodoComIA: baselineData.periodo, // Herda do Baseline
          taxaAcertoComIA: baselineData.taxaAcertoAtual,
          custoMedioDecisaoErradaComIA: baselineData.custoMedioDecisaoErrada,
          tempoMedioDecisaoComIA: baselineData.tempoMedioDecisao,
          pessoasEnvolvidasComIA: baselineData.pessoasEnvolvidas,
          melhoriaTaxaAcerto: 0,
          economiaErrosEvitados: 0,
          economiaTempo: 0,
          valorTempoEconomizado: 0,
          beneficioTotalMensal: 0,
          roiMelhoria: 0
        }
      } else if (baselineData.tipo === 'VELOCIDADE' && 'tempoMedioEntregaAtual' in baselineData) {
        // Herda dados do Baseline para Velocidade
        return {
          tipo: 'VELOCIDADE',
          tempoMedioEntregaComIA: baselineData.tempoMedioEntregaAtual,
          unidadeTempoEntregaComIA: baselineData.unidadeTempoEntrega, // Herda do Baseline
          numeroEntregasPeriodoComIA: baselineData.numeroEntregasPeriodo,
          periodoEntregasComIA: baselineData.periodoEntregas, // Herda do Baseline
          custoPorAtrasoReduzido: baselineData.custoPorAtraso,
          pessoasEnvolvidasComIA: baselineData.pessoasEnvolvidas,
          tempoTrabalhoPorEntregaComIA: baselineData.tempoTrabalhoPorEntrega,
          reducaoTempoEntrega: 0,
          aumentoCapacidade: 0,
          economiaAtrasos: 0,
          valorTempoEconomizado: 0,
          ganhoProdutividade: 0,
          roiVelocidade: 0
        }
      } else if (baselineData.tipo === 'SATISFAÇÃO' && 'tipoScore' in baselineData) {
        // Herda dados do Baseline para Satisfação
        return {
          tipo: 'SATISFAÇÃO',
          scoreComIA: baselineData.scoreAtual || 0,
          tipoScore: baselineData.tipoScore, // Herda do Baseline
          numeroClientesEsperado: baselineData.numeroClientes || 0,
          valorMedioPorClienteComIA: baselineData.valorMedioPorCliente || 0,
          taxaChurnComIA: baselineData.taxaChurnAtual || 0,
          ticketMedioSuporteComIA: baselineData.ticketMedioSuporte || 0,
          deltaSatisfacao: 0,
          reducaoChurn: 0,
          valorRetencao: 0,
          economiaSuporte: 0,
          aumentoRevenue: 0,
          roiSatisfacao: 0,
          ltvIncrementado: 0
        }
      } else if (baselineData.tipo === 'OUTROS' && 'nomeIndicador' in baselineData) {
        return {
          tipo: 'OUTROS',
          nomeIndicador: baselineData.nomeIndicador,
          valorIndicadorDepois: baselineData.valorIndicador,
          deltaIndicador: 0
        }
      }
    }

    // Se não há baseline, inicializa vazio
    switch (tipoPostIA) {
      case 'PRODUTIVIDADE':
        return {
          tipo: 'PRODUTIVIDADE',
          pessoaEnvolvida: false,
          pessoas: [],
          custoTotalPostIA: 0,
          deltaProdutividade: 0
        }
      case 'INCREMENTO RECEITA':
        return {
          tipo: 'INCREMENTO RECEITA',
          valorReceitaDepois: 0,
          deltaReceita: 0
        }
      case 'CUSTOS RELACIONADOS':
        return {
          tipo: 'CUSTOS RELACIONADOS',
          ferramentas: [],
          custoTotalImplementacao: 0
        }
      case 'MELHORIA MARGEM':
        return {
          tipo: 'MELHORIA MARGEM',
          receitaBrutaMensalEstimada: 0,
          custoTotalMensalEstimado: 0,
          margemBrutaEstimada: 0,
          volumeTransacoesEstimado: 0,
          deltaMargem: 0,
          deltaMargemReais: 0,
          economiaMensal: 0,
          economiaAnual: 0
        }
      case 'REDUÇÃO DE RISCO':
        return {
          tipo: 'REDUÇÃO DE RISCO',
          probabilidadeComIA: 0,
          impactoFinanceiroReduzido: 0,
          frequenciaAvaliacaoComIA: 0,
          periodoAvaliacaoComIA: 'mês',
          custoMitigacaoComIA: 0,
          reducaoProbabilidade: 0,
          valorRiscoEvitado: 0,
          economiaMitigacao: 0,
          beneficioAnual: 0,
          custoVsBeneficio: 0,
          roiReducaoRisco: 0
        }
      case 'QUALIDADE DECISÃO':
        return {
          tipo: 'QUALIDADE DECISÃO',
          numeroDecisoesPeriodoComIA: 0,
          periodoComIA: 'mês',
          taxaAcertoComIA: 0,
          custoMedioDecisaoErradaComIA: 0,
          tempoMedioDecisaoComIA: 0,
          pessoasEnvolvidasComIA: 0,
          melhoriaTaxaAcerto: 0,
          economiaErrosEvitados: 0,
          economiaTempo: 0,
          valorTempoEconomizado: 0,
          beneficioTotalMensal: 0,
          roiMelhoria: 0
        }
      case 'VELOCIDADE':
        return {
          tipo: 'VELOCIDADE',
          tempoMedioEntregaComIA: 0,
          unidadeTempoEntregaComIA: 'dias',
          numeroEntregasPeriodoComIA: 0,
          periodoEntregasComIA: 'mês',
          custoPorAtrasoReduzido: 0,
          pessoasEnvolvidasComIA: 0,
          tempoTrabalhoPorEntregaComIA: 0,
          reducaoTempoEntrega: 0,
          aumentoCapacidade: 0,
          economiaAtrasos: 0,
          valorTempoEconomizado: 0,
          ganhoProdutividade: 0,
          roiVelocidade: 0
        }
      case 'SATISFAÇÃO':
        return {
          tipo: 'SATISFAÇÃO',
          scoreComIA: 0,
          tipoScore: 'NPS',
          numeroClientesEsperado: 0,
          valorMedioPorClienteComIA: 0,
          taxaChurnComIA: 0,
          ticketMedioSuporteComIA: 0,
          deltaSatisfacao: 0,
          reducaoChurn: 0,
          valorRetencao: 0,
          economiaSuporte: 0,
          aumentoRevenue: 0,
          roiSatisfacao: 0,
          ltvIncrementado: 0
        }
      default:
        return {
          tipo: 'OUTROS',
          nomeIndicador: '',
          valorIndicadorDepois: 0,
          deltaIndicador: 0
        }
    }
  })

  // Atualiza quando baselineData ou postIAData mudam
  useEffect(() => {
    // Se já existe postIAData salvo, usa ele mas recalcula deltaProdutividade se necessário
    if (postIAData) {
      // Se for PRODUTIVIDADE e deltaProdutividade for 0 ou não existir, será recalculado no useEffect de cálculos
      setData(postIAData)
      return
    }

    if (!baselineData) return

    const novoTipo = TIPO_MAPPING[tipoIndicador] || 'PRODUTIVIDADE'

    // Só re-herda se o tipo do baseline corresponde ao tipo atual
    if (baselineData.tipo === novoTipo) {
      if (baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData) {
        // Garante que TODAS as pessoas do baseline sejam herdadas
        setData(prevData => {
          // Se já tem dados no Pós-IA, preserva valores preenchidos
          const pessoasExistentes = prevData.tipo === 'PRODUTIVIDADE' && 'pessoas' in prevData ? prevData.pessoas : []

          // Mapeia TODAS as pessoas do baseline
          const novasPessoas = baselineData.pessoas.map(p => {
            const existente = pessoasExistentes.find(pp => pp.id === p.id)
            // Se já existe no Pós-IA, preserva os valores preenchidos
            if (existente) {
              return {
                id: p.id,
                nome: p.nome,
                cargo: p.cargo,
                valorHora: existente.valorHora ?? p.valorHora,
                tempoGasto: existente.tempoGasto ?? p.tempoGasto,
                frequenciaReal: existente.frequenciaReal ?? { ...p.frequenciaReal },
                frequenciaDesejada: existente.frequenciaDesejada ?? { ...p.frequenciaDesejada }
              }
            }
            // Se não existe, cria nova pessoa herdando do baseline
            return {
              id: p.id,
              nome: p.nome,
              cargo: p.cargo,
              valorHora: p.valorHora,
              tempoGasto: p.tempoGasto,
              frequenciaReal: { ...p.frequenciaReal },
              frequenciaDesejada: { ...p.frequenciaDesejada }
            }
          })

          return {
            tipo: 'PRODUTIVIDADE',
            pessoaEnvolvida: prevData.tipo === 'PRODUTIVIDADE' ? (prevData.pessoaEnvolvida ?? false) : false,
            pessoas: novasPessoas, // Garante que todas as pessoas do baseline estão presentes
            custoTotalPostIA: prevData.tipo === 'PRODUTIVIDADE' ? prevData.custoTotalPostIA : 0,
            deltaProdutividade: prevData.tipo === 'PRODUTIVIDADE' ? prevData.deltaProdutividade : 0
          }
        })
      } else if (baselineData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaAntes' in baselineData) {
        setData(prevData => ({
          tipo: 'INCREMENTO RECEITA',
          valorReceitaDepois: prevData.tipo === 'INCREMENTO RECEITA' ? prevData.valorReceitaDepois : baselineData.valorReceitaAntes,
          deltaReceita: prevData.tipo === 'INCREMENTO RECEITA' ? prevData.deltaReceita : 0
        }))
      } else if (baselineData.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in baselineData) {
        setData(prevData => {
          const ferramentasExistentes = prevData.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in prevData ? prevData.ferramentas : []
          // Mapeia TODAS as ferramentas do baseline
          const novasFerramentas = baselineData.ferramentas.map(f => {
            const existente = ferramentasExistentes.find(ff => ff.id === f.id)
            return {
              id: f.id,
              nomeFerramenta: f.nomeFerramenta,
              custoMensal: existente?.custoMensal ?? f.custoMensal,
              outrosCustos: existente?.outrosCustos ?? f.outrosCustos,
              custoImplementacao: existente?.custoImplementacao ?? 0
            }
          })
          return {
            tipo: 'CUSTOS RELACIONADOS',
            ferramentas: novasFerramentas, // Garante que todas as ferramentas do baseline estão presentes
            custoTotalImplementacao: prevData.tipo === 'CUSTOS RELACIONADOS' ? prevData.custoTotalImplementacao : 0
          }
        })
      } else if (baselineData.tipo === 'OUTROS' && 'nomeIndicador' in baselineData) {
        setData(prevData => ({
          tipo: 'OUTROS',
          nomeIndicador: baselineData.nomeIndicador,
          valorIndicadorDepois: prevData.tipo === 'OUTROS' ? prevData.valorIndicadorDepois : baselineData.valorIndicador,
          deltaIndicador: prevData.tipo === 'OUTROS' ? prevData.deltaIndicador : 0
        }))
      }
    }
  }, [baselineData, tipoIndicador, postIAData])

  const updateData = (newData: PostIAData) => {
    setData(newData)
    onPostIAChange?.(newData)
  }

  // Calcula custo total Pós-IA para PRODUTIVIDADE
  const calcularCustoTotalPostIA = (pessoas: PostIAProdutividadePerson[]): number => {
    return pessoas.reduce((total, pessoa) => {
      const horasPorMes = calcularHorasPorMes(
        pessoa.frequenciaReal.quantidade,
        pessoa.frequenciaReal.periodo
      )
      const custoMensal = (pessoa.valorHora * (pessoa.tempoGasto / 60)) * horasPorMes
      return total + custoMensal
    }, 0)
  }

  const calcularHorasPorMes = (quantidade: number, periodo: string): number => {
    switch (periodo) {
      case 'Diário':
        return quantidade * 30
      case 'Semanal':
        return quantidade * 4.33
      case 'Mensal':
        return quantidade
      default:
        return quantidade
    }
  }

  // Calcula Delta Produtividade: (HH Antes - HH Depois) × Valor Hora
  const calcularDeltaProdutividade = useMemo(() => {
    if (data.tipo !== 'PRODUTIVIDADE' || !baselineData || baselineData.tipo !== 'PRODUTIVIDADE' || !('pessoas' in data) || !('pessoas' in baselineData)) {
      return 0
    }

    const pessoasBaseline = baselineData.pessoas || []
    const pessoasPostIA = data.pessoas || []

    return pessoasPostIA.reduce((total, pessoaPostIA) => {
      const pessoaBaseline = pessoasBaseline.find(p => p.id === pessoaPostIA.id)
      if (!pessoaBaseline) return total

      const horasBaseline = calcularHorasPorMes(
        pessoaBaseline.frequenciaReal.quantidade,
        pessoaBaseline.frequenciaReal.periodo
      )
      // Usa a mesma frequência do baseline para comparar o mesmo volume de trabalho
      const horasPostIA = horasBaseline

      const hhAntes = (pessoaBaseline.tempoGasto / 60) * horasBaseline
      const hhDepois = (pessoaPostIA.tempoGasto / 60) * horasPostIA
      const delta = (hhAntes - hhDepois) * pessoaPostIA.valorHora

      return total + delta
    }, 0)
  }, [data, baselineData])

  // Calcula Delta Receita: Receita Depois - Receita Antes
  const calcularDeltaReceita = useMemo(() => {
    if (data.tipo !== 'INCREMENTO RECEITA' || !baselineData || baselineData.tipo !== 'INCREMENTO RECEITA' || !('valorReceitaAntes' in baselineData)) {
      return 0
    }
    return data.valorReceitaDepois - (baselineData.valorReceitaAntes || 0)
  }, [data, baselineData])

  // Calcula Delta Margem (Melhoria Margem)
  const calcularMetricasMelhoriaMargem = useMemo(() => {
    if (data.tipo !== 'MELHORIA MARGEM' || !baselineData || baselineData.tipo !== 'MELHORIA MARGEM') {
      return {
        deltaMargem: 0,
        deltaMargemReais: 0,
        economiaMensal: 0,
        economiaAnual: 0
      }
    }

    // Delta Margem em percentual
    const deltaMargem = data.margemBrutaEstimada - baselineData.margemBrutaAtual

    // Lucro Bruto Baseline
    const lucroBrutoBaseline = baselineData.receitaBrutaMensal - baselineData.custoTotalMensal

    // Lucro Bruto Estimado
    const lucroBrutoEstimado = data.receitaBrutaMensalEstimada - data.custoTotalMensalEstimado

    // Delta Margem em Reais (diferença de lucro)
    const deltaMargemReais = lucroBrutoEstimado - lucroBrutoBaseline

    // Economia Mensal = Delta Margem em Reais
    const economiaMensal = deltaMargemReais // Pode ser positivo (ganho) ou negativo (perda)

    // Economia Anual
    const economiaAnual = economiaMensal * 12

    return {
      deltaMargem,
      deltaMargemReais,
      economiaMensal,
      economiaAnual
    }
  }, [data, baselineData])

  // Ref para evitar loops infinitos - rastreia se já inicializamos os campos calculados
  const hasInitializedRef = useRef<Record<string, boolean>>({})

  // Atualiza cálculos quando dados mudam
  useEffect(() => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const custoTotal = calcularCustoTotalPostIA(data.pessoas)
      // Calcula deltaProdutividade diretamente aqui para evitar dependência de useMemo
      let deltaProdutividade = 0
      if (baselineData && baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData && 'pessoas' in data) {
        const pessoasBaseline = baselineData.pessoas || []
        const pessoasPostIA = data.pessoas || []
        deltaProdutividade = pessoasPostIA.reduce((total, pessoaPostIA) => {
          const pessoaBaseline = pessoasBaseline.find(p => p.id === pessoaPostIA.id)
          if (!pessoaBaseline) return total
          const horasBaseline = calcularHorasPorMes(pessoaBaseline.frequenciaReal.quantidade, pessoaBaseline.frequenciaReal.periodo)
          const horasPostIA = horasBaseline
          const hhAntes = (pessoaBaseline.tempoGasto / 60) * horasBaseline
          const hhDepois = (pessoaPostIA.tempoGasto / 60) * horasPostIA
          const delta = (hhAntes - hhDepois) * pessoaPostIA.valorHora
          return total + delta
        }, 0)
      }
      const updatedData: PostIAData = {
        ...data,
        custoTotalPostIA: custoTotal,
        deltaProdutividade
      }
      // Sempre atualiza se deltaProdutividade mudou ou se estava zerado/indefinido
      const key = `PRODUTIVIDADE_${data.pessoas.length}_${data.pessoas.map(p => `${p.id}-${p.tempoGasto}`).join('_')}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        updatedData.custoTotalPostIA !== data.custoTotalPostIA ||
        updatedData.deltaProdutividade !== data.deltaProdutividade ||
        (data.deltaProdutividade === 0 && deltaProdutividade !== 0) ||
        (data.deltaProdutividade === undefined)

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'INCREMENTO RECEITA') {
      // Calcula deltaReceita diretamente aqui para evitar dependência de useMemo
      const deltaReceita = baselineData && baselineData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaAntes' in baselineData && 'valorReceitaDepois' in data
        ? data.valorReceitaDepois - (baselineData.valorReceitaAntes || 0)
        : 0
      const updatedData: PostIAData = {
        ...data,
        deltaReceita
      }
      const key = `INCREMENTO_RECEITA_${data.valorReceitaDepois}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        updatedData.deltaReceita !== data.deltaReceita

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'MELHORIA MARGEM' && baselineData && baselineData.tipo === 'MELHORIA MARGEM') {
      // Calcula métricas diretamente aqui para evitar dependência de useMemo
      const deltaMargem = data.margemBrutaEstimada - baselineData.margemBrutaAtual
      const lucroBrutoBaseline = baselineData.receitaBrutaMensal - baselineData.custoTotalMensal
      const lucroBrutoEstimado = data.receitaBrutaMensalEstimada - data.custoTotalMensalEstimado
      const deltaMargemReais = lucroBrutoEstimado - lucroBrutoBaseline
      const economiaMensal = deltaMargemReais
      const economiaAnual = economiaMensal * 12

      const updatedData: PostIAData = {
        ...data,
        deltaMargem,
        deltaMargemReais,
        economiaMensal,
        economiaAnual
      }
      // CORREÇÃO: Verifica se algum campo está undefined OU se mudou
      const key = `MELHORIA_MARGEM_${data.receitaBrutaMensalEstimada}_${data.custoTotalMensalEstimado}_${data.margemBrutaEstimada}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        data.deltaMargem === undefined ||
        data.deltaMargemReais === undefined ||
        data.economiaMensal === undefined ||
        data.economiaAnual === undefined ||
        updatedData.deltaMargem !== data.deltaMargem ||
        updatedData.deltaMargemReais !== data.deltaMargemReais ||
        updatedData.economiaMensal !== data.economiaMensal ||
        updatedData.economiaAnual !== data.economiaAnual

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'REDUÇÃO DE RISCO' && baselineData && baselineData.tipo === 'REDUÇÃO DE RISCO') {
      // Calcula métricas diretamente aqui para evitar dependência de useMemo
      const reducaoProbabilidade = baselineData.probabilidadeAtual - data.probabilidadeComIA
      const exposicaoAntes = (baselineData.probabilidadeAtual / 100) * baselineData.impactoFinanceiro
      const exposicaoDepois = (data.probabilidadeComIA / 100) * data.impactoFinanceiroReduzido
      const valorRiscoEvitado = exposicaoAntes - exposicaoDepois
      const economiaMitigacao = baselineData.custoMitigacaoAtual - data.custoMitigacaoComIA
      const beneficioAnual = (economiaMitigacao * 12) + valorRiscoEvitado
      const custoImplementacao = 0
      const custoVsBeneficio = custoImplementacao > 0 ? beneficioAnual / custoImplementacao : 0
      const roiReducaoRisco = custoImplementacao > 0 ? ((beneficioAnual - custoImplementacao) / custoImplementacao) * 100 : 0

      const updatedData: PostIAData = {
        ...data,
        reducaoProbabilidade,
        valorRiscoEvitado,
        economiaMitigacao,
        beneficioAnual,
        custoVsBeneficio,
        roiReducaoRisco
      }
      // CORREÇÃO: Verifica se algum campo está undefined OU se mudou
      const key = `REDUCAO_RISCO_${data.probabilidadeComIA}_${data.custoMitigacaoComIA}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        data.reducaoProbabilidade === undefined ||
        data.valorRiscoEvitado === undefined ||
        data.economiaMitigacao === undefined ||
        data.beneficioAnual === undefined ||
        data.custoVsBeneficio === undefined ||
        data.roiReducaoRisco === undefined ||
        updatedData.reducaoProbabilidade !== data.reducaoProbabilidade ||
        updatedData.valorRiscoEvitado !== data.valorRiscoEvitado ||
        updatedData.economiaMitigacao !== data.economiaMitigacao ||
        updatedData.beneficioAnual !== data.beneficioAnual ||
        updatedData.custoVsBeneficio !== data.custoVsBeneficio ||
        updatedData.roiReducaoRisco !== data.roiReducaoRisco

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'QUALIDADE DECISÃO' && baselineData && baselineData.tipo === 'QUALIDADE DECISÃO') {
      // Calcula métricas diretamente aqui para evitar dependência de useMemo
      const melhoriaTaxaAcerto = data.taxaAcertoComIA - baselineData.taxaAcertoAtual
      const fatorBaseline = baselineData.periodo === 'dia' ? 30 : baselineData.periodo === 'semana' ? 4 : 1
      const fatorComIA = data.periodoComIA === 'dia' ? 30 : data.periodoComIA === 'semana' ? 4 : 1
      const decisoesMensalBaseline = baselineData.numeroDecisoesPeriodo * fatorBaseline
      const decisoesMensalComIA = data.numeroDecisoesPeriodoComIA * fatorComIA
      const decisoesErradasBaseline = decisoesMensalBaseline * (1 - baselineData.taxaAcertoAtual / 100)
      const decisoesErradasComIA = decisoesMensalComIA * (1 - data.taxaAcertoComIA / 100)
      const economiaErrosEvitados = (decisoesErradasBaseline * baselineData.custoMedioDecisaoErrada) - (decisoesErradasComIA * data.custoMedioDecisaoErradaComIA)
      const tempoTotalBaseline = (decisoesMensalBaseline * baselineData.tempoMedioDecisao * baselineData.pessoasEnvolvidas) / 60
      const tempoTotalComIA = (decisoesMensalComIA * data.tempoMedioDecisaoComIA * data.pessoasEnvolvidasComIA) / 60
      const economiaTempo = tempoTotalBaseline - tempoTotalComIA
      const valorTempoEconomizado = economiaTempo * baselineData.valorHoraMedio
      const beneficioTotalMensal = economiaErrosEvitados + valorTempoEconomizado
      const roiMelhoria = 0

      const updatedData: PostIAData = {
        ...data,
        melhoriaTaxaAcerto,
        economiaErrosEvitados,
        economiaTempo,
        valorTempoEconomizado,
        beneficioTotalMensal,
        roiMelhoria
      }
      // CORREÇÃO: Verifica se algum campo está undefined OU se mudou
      const key = `QUALIDADE_DECISAO_${data.taxaAcertoComIA}_${data.tempoMedioDecisaoComIA}_${data.custoMedioDecisaoErradaComIA}_${data.numeroDecisoesPeriodoComIA}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        data.melhoriaTaxaAcerto === undefined ||
        data.economiaErrosEvitados === undefined ||
        data.economiaTempo === undefined ||
        data.valorTempoEconomizado === undefined ||
        data.beneficioTotalMensal === undefined ||
        data.roiMelhoria === undefined ||
        updatedData.melhoriaTaxaAcerto !== data.melhoriaTaxaAcerto ||
        updatedData.economiaErrosEvitados !== data.economiaErrosEvitados ||
        updatedData.economiaTempo !== data.economiaTempo ||
        updatedData.valorTempoEconomizado !== data.valorTempoEconomizado ||
        updatedData.beneficioTotalMensal !== data.beneficioTotalMensal ||
        updatedData.roiMelhoria !== data.roiMelhoria

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'VELOCIDADE' && baselineData && baselineData.tipo === 'VELOCIDADE') {
      // Calcula métricas diretamente aqui para evitar dependência de useMemo
      const fatorBaseline = baselineData.periodoEntregas === 'dia' ? 30 : baselineData.periodoEntregas === 'semana' ? 4 : baselineData.periodoEntregas === 'ano' ? 1 / 12 : 1
      const fatorComIA = data.periodoEntregasComIA === 'dia' ? 30 : data.periodoEntregasComIA === 'semana' ? 4 : data.periodoEntregasComIA === 'ano' ? 1 / 12 : 1
      const entregasMensalBaseline = baselineData.numeroEntregasPeriodo * fatorBaseline
      const entregasMensalComIA = data.numeroEntregasPeriodoComIA * fatorComIA
      const tempoEntregaHorasBaseline = baselineData.unidadeTempoEntrega === 'dias' ? baselineData.tempoMedioEntregaAtual * 24 : baselineData.tempoMedioEntregaAtual
      const tempoEntregaHorasComIA = data.unidadeTempoEntregaComIA === 'dias' ? data.tempoMedioEntregaComIA * 24 : data.tempoMedioEntregaComIA
      const reducaoTempoEntrega = tempoEntregaHorasBaseline > 0 ? ((tempoEntregaHorasBaseline - tempoEntregaHorasComIA) / tempoEntregaHorasBaseline) * 100 : 0
      const aumentoCapacidade = entregasMensalComIA - entregasMensalBaseline
      const economiaAtrasos = (baselineData.custoPorAtraso - data.custoPorAtrasoReduzido) * entregasMensalComIA
      const horasTotaisBaseline = entregasMensalBaseline * baselineData.tempoTrabalhoPorEntrega * baselineData.pessoasEnvolvidas
      const horasTotaisComIA = entregasMensalComIA * data.tempoTrabalhoPorEntregaComIA * data.pessoasEnvolvidasComIA
      const horasEconomizadas = horasTotaisBaseline - horasTotaisComIA
      const valorTempoEconomizado = horasEconomizadas * baselineData.valorHoraMedio
      const ganhoProdutividade = entregasMensalBaseline > 0 ? ((entregasMensalComIA - entregasMensalBaseline) / entregasMensalBaseline) * 100 : 0
      const roiVelocidade = 0

      const updatedData: PostIAData = {
        ...data,
        reducaoTempoEntrega,
        aumentoCapacidade,
        economiaAtrasos,
        valorTempoEconomizado,
        ganhoProdutividade,
        roiVelocidade
      }
      // CORREÇÃO: Verifica se algum campo está undefined OU se mudou
      const key = `VELOCIDADE_${data.tempoMedioEntregaComIA}_${data.numeroEntregasPeriodoComIA}_${data.periodoEntregasComIA}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        data.reducaoTempoEntrega === undefined ||
        data.aumentoCapacidade === undefined ||
        data.economiaAtrasos === undefined ||
        data.valorTempoEconomizado === undefined ||
        data.ganhoProdutividade === undefined ||
        data.roiVelocidade === undefined ||
        updatedData.reducaoTempoEntrega !== data.reducaoTempoEntrega ||
        updatedData.aumentoCapacidade !== data.aumentoCapacidade ||
        updatedData.economiaAtrasos !== data.economiaAtrasos ||
        updatedData.valorTempoEconomizado !== data.valorTempoEconomizado ||
        updatedData.ganhoProdutividade !== data.ganhoProdutividade ||
        updatedData.roiVelocidade !== data.roiVelocidade

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'SATISFAÇÃO' && baselineData && baselineData.tipo === 'SATISFAÇÃO') {
      // Calcula métricas diretamente aqui para evitar dependência de useMemo
      const deltaSatisfacao = data.scoreComIA - baselineData.scoreAtual
      const reducaoChurn = baselineData.taxaChurnAtual - data.taxaChurnComIA
      const clientesRetidos = baselineData.numeroClientes * (reducaoChurn / 100)
      const valorRetencao = clientesRetidos * baselineData.valorMedioPorCliente * 12
      const ticketsEvitados = baselineData.ticketMedioSuporte - data.ticketMedioSuporteComIA
      const custoMedioTicket = 50
      const economiaSuporte = ticketsEvitados * custoMedioTicket
      const aumentoRevenue = (data.numeroClientesEsperado * data.valorMedioPorClienteComIA * 12) - (baselineData.numeroClientes * baselineData.valorMedioPorCliente * 12)
      const ltvAntes = baselineData.taxaChurnAtual > 0 ? baselineData.valorMedioPorCliente / (baselineData.taxaChurnAtual / 100) : 0
      const ltvDepois = data.taxaChurnComIA > 0 ? data.valorMedioPorClienteComIA / (data.taxaChurnComIA / 100) : 0
      const ltvIncrementado = ltvDepois - ltvAntes
      const roiSatisfacao = 0

      const updatedData: PostIAData = {
        ...data,
        deltaSatisfacao,
        reducaoChurn,
        valorRetencao,
        economiaSuporte,
        aumentoRevenue,
        roiSatisfacao,
        ltvIncrementado
      }
      // CORREÇÃO: Verifica se algum campo está undefined OU se mudou
      const key = `SATISFACAO_${data.scoreComIA}_${data.taxaChurnComIA}_${data.numeroClientesEsperado}`
      const needsUpdate = !hasInitializedRef.current[key] ||
        data.deltaSatisfacao === undefined ||
        data.reducaoChurn === undefined ||
        data.valorRetencao === undefined ||
        data.economiaSuporte === undefined ||
        data.aumentoRevenue === undefined ||
        data.roiSatisfacao === undefined ||
        data.ltvIncrementado === undefined ||
        updatedData.deltaSatisfacao !== data.deltaSatisfacao ||
        updatedData.reducaoChurn !== data.reducaoChurn ||
        updatedData.valorRetencao !== data.valorRetencao ||
        updatedData.economiaSuporte !== data.economiaSuporte ||
        updatedData.aumentoRevenue !== data.aumentoRevenue ||
        updatedData.roiSatisfacao !== data.roiSatisfacao ||
        updatedData.ltvIncrementado !== data.ltvIncrementado

      if (needsUpdate) {
        hasInitializedRef.current[key] = true
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    }
  }, [
    baselineData,
    data.tipo,
    // Apenas campos de entrada específicos (não useMemo, não campos calculados)
    ...(data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data ? [data.pessoas.length] : []),
    ...(data.tipo === 'INCREMENTO RECEITA' && 'valorReceitaDepois' in data ? [data.valorReceitaDepois] : []),
    ...(data.tipo === 'MELHORIA MARGEM' && 'receitaBrutaMensalEstimada' in data ? [data.receitaBrutaMensalEstimada, data.custoTotalMensalEstimado, data.margemBrutaEstimada] : []),
    ...(data.tipo === 'REDUÇÃO DE RISCO' && 'probabilidadeComIA' in data ? [data.probabilidadeComIA, data.custoMitigacaoComIA, data.impactoFinanceiroReduzido] : []),
    ...(data.tipo === 'QUALIDADE DECISÃO' && 'taxaAcertoComIA' in data ? [data.taxaAcertoComIA, data.tempoMedioDecisaoComIA, data.custoMedioDecisaoErradaComIA, data.numeroDecisoesPeriodoComIA, data.periodoComIA, data.pessoasEnvolvidasComIA] : []),
    ...(data.tipo === 'VELOCIDADE' && 'tempoMedioEntregaComIA' in data ? [data.tempoMedioEntregaComIA, data.numeroEntregasPeriodoComIA, data.periodoEntregasComIA, data.custoPorAtrasoReduzido, data.tempoTrabalhoPorEntregaComIA, data.pessoasEnvolvidasComIA, data.unidadeTempoEntregaComIA] : []),
    ...(data.tipo === 'SATISFAÇÃO' && 'scoreComIA' in data ? [data.scoreComIA, data.taxaChurnComIA, data.numeroClientesEsperado, data.valorMedioPorClienteComIA, data.ticketMedioSuporteComIA] : [])
  ])

  const updatePessoa = (index: number, field: string, value: any) => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const updatedPessoas = [...data.pessoas]
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        const pessoaAtual = updatedPessoas[index]
        const parentValue = pessoaAtual[parent as keyof PostIAProdutividadePerson]
        if (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) {
          updatedPessoas[index] = {
            ...pessoaAtual,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          }
        }
      } else {
        updatedPessoas[index] = {
          ...updatedPessoas[index],
          [field]: value
        }
      }
      const custoTotal = calcularCustoTotalPostIA(updatedPessoas)
      const updatedData: PostIAData = {
        ...data,
        pessoas: updatedPessoas,
        custoTotalPostIA: custoTotal
      }
      updateData(updatedData)
    }
  }

  const updateFerramenta = (index: number, field: string, value: any) => {
    if (data.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in data) {
      const updatedFerramentas = [...data.ferramentas]
      updatedFerramentas[index] = {
        ...updatedFerramentas[index],
        [field]: value
      }
      const custoTotal = updatedFerramentas.reduce((sum, f) => sum + (f.custoImplementacao || 0), 0)
      const updatedData: PostIAData = {
        ...data,
        ferramentas: updatedFerramentas,
        custoTotalImplementacao: custoTotal
      }
      updateData(updatedData)
    }
  }

  // Funções para PRODUTIVIDADE - Métricas Manuais
  const isPessoaManual = (id: string): boolean => {
    return id.startsWith('manual-')
  }

  const addNovaPessoaManual = () => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const novaPessoa: PostIAProdutividadePerson = {
        id: `manual-${Date.now()}`,
        nome: '',
        cargo: '',
        valorHora: 0,
        tempoGasto: 0,
        frequenciaReal: {
          quantidade: 0,
          periodo: 'Mensal'
        },
        frequenciaDesejada: {
          quantidade: 0,
          periodo: 'Mensal'
        }
      }
      const updatedData: PostIAData = {
        ...data,
        pessoas: [...data.pessoas, novaPessoa]
      }
      updateData(updatedData)
    }
  }

  const removePessoaManual = (pessoaId: string) => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      // Permite remover qualquer métrica (manual ou do baseline)
      const updatedPessoas = data.pessoas.filter(p => p.id !== pessoaId)
      const custoTotal = calcularCustoTotalPostIA(updatedPessoas)
      const updatedData: PostIAData = {
        ...data,
        pessoas: updatedPessoas,
        custoTotalPostIA: custoTotal
      }
      updateData(updatedData)
    }
  }

  // Funções para CAPACIDADE ANALÍTICA
  const addCampoQualitativo = () => {
    if (data.tipo === 'CAPACIDADE ANALÍTICA') {
      const novoCampo = {
        id: `campo-${Date.now()}`,
        criterio: '',
        valor: ''
      }
      const updatedData: PostIAData = {
        ...data,
        camposQualitativos: [...data.camposQualitativos, novoCampo]
      }
      updateData(updatedData)
    }
  }

  const removeCampoQualitativo = (index: number) => {
    if (data.tipo === 'CAPACIDADE ANALÍTICA') {
      const updatedCampos = data.camposQualitativos.filter((_, i) => i !== index)
      const updatedData: PostIAData = {
        ...data,
        camposQualitativos: updatedCampos
      }
      updateData(updatedData)
    }
  }

  const updateCampoQualitativo = (index: number, field: string, value: any) => {
    if (data.tipo === 'CAPACIDADE ANALÍTICA') {
      const updatedCampos = data.camposQualitativos.map((campo, i) => {
        if (i === index) {
          return { ...campo, [field]: value }
        }
        return campo
      })
      const updatedData: PostIAData = {
        ...data,
        camposQualitativos: updatedCampos
      }
      updateData(updatedData)
    }
  }

  return (
    <div className="space-y-6">
      {/* PRODUTIVIDADE */}
      {tipoPostIA === 'PRODUTIVIDADE' && data.tipo === 'PRODUTIVIDADE' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Pessoas (Pós-IA)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Dados herdados do Baseline. Altere apenas os valores que mudaram após a implementação.
              </p>
            </div>

            {/* Seção: Pessoa Envolvida */}
            <div className="space-y-4 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  Deseja utilizar pessoas do Baseline?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pessoaEnvolvidaPostIA"
                      checked={data.pessoaEnvolvida === true}
                      onChange={() => {
                        const updatedData: PostIAData = {
                          ...data,
                          pessoaEnvolvida: true
                        }
                        updateData(updatedData)
                      }}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pessoaEnvolvidaPostIA"
                      checked={data.pessoaEnvolvida === false}
                      onChange={() => {
                        const updatedData: PostIAData = {
                          ...data,
                          pessoaEnvolvida: false,
                          // Remove apenas pessoas do Baseline, mantém as manuais
                          pessoas: data.pessoas.filter(p => isPessoaManual(p.id))
                        }
                        updateData(updatedData)
                      }}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Não</span>
                  </label>
                </div>
              </div>

              {/* Dropdown de pessoas do Baseline (quando pessoaEnvolvida = true) */}
              {data.pessoaEnvolvida && baselineData && baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Selecione a(s) pessoa(s) do Baseline
                  </label>
                  {baselineData.pessoas.length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Nenhuma pessoa cadastrada no Baseline. Adicione pessoas na aba Baseline primeiro.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {baselineData.pessoas.map((pessoaBaseline, index) => {
                        const isSelected = data.pessoas.some(
                          p => p.id === pessoaBaseline.id ||
                            (p.id === undefined && p.nome === pessoaBaseline.nome)
                        )

                        return (
                          <label
                            key={pessoaBaseline.id || index}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border-2 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            style={{
                              borderColor: isSelected ? 'rgb(34 197 94)' : 'rgb(226 232 240)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Verifica se pessoa já existe
                                  const pessoaExistenteIndex = data.pessoas.findIndex(
                                    p => p.id === pessoaBaseline.id ||
                                      (p.id === undefined && p.nome === pessoaBaseline.nome)
                                  )

                                  // Cria objeto pessoa com dados do Baseline
                                  const pessoaPostIA: PostIAProdutividadePerson = {
                                    id: pessoaBaseline.id,
                                    nome: pessoaBaseline.nome,
                                    cargo: pessoaBaseline.cargo,
                                    valorHora: pessoaBaseline.valorHora,
                                    tempoGasto: pessoaBaseline.tempoGasto, // Usuário pode alterar
                                    frequenciaReal: { ...pessoaBaseline.frequenciaReal },
                                    frequenciaDesejada: { ...pessoaBaseline.frequenciaDesejada }
                                  }

                                  if (pessoaExistenteIndex >= 0) {
                                    // Atualiza pessoa existente
                                    const updatedPessoas = [...data.pessoas]
                                    updatedPessoas[pessoaExistenteIndex] = pessoaPostIA
                                    const updatedData: PostIAData = {
                                      ...data,
                                      pessoas: updatedPessoas
                                    }
                                    updateData(updatedData)
                                  } else {
                                    // Adiciona nova pessoa
                                    const updatedData: PostIAData = {
                                      ...data,
                                      pessoas: [...data.pessoas, pessoaPostIA]
                                    }
                                    updateData(updatedData)
                                  }
                                } else {
                                  // Remove pessoa
                                  const updatedData: PostIAData = {
                                    ...data,
                                    pessoas: data.pessoas.filter(
                                      p => p.id !== pessoaBaseline.id &&
                                        (p.id !== undefined || p.nome !== pessoaBaseline.nome)
                                    )
                                  }
                                  updateData(updatedData)
                                }
                              }}
                              className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-white">
                                {pessoaBaseline.nome}
                              </div>
                              {pessoaBaseline.cargo && (
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {pessoaBaseline.cargo}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="my-6 border-slate-200 dark:border-slate-700" />

            {/* NOVA SEÇÃO: Adicionar Métricas Manuais (SEMPRE VISÍVEL) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Métricas Adicionais
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Adicione pessoas/métricas extras que não estão no Baseline
                  </p>
                </div>
                <button
                  onClick={addNovaPessoaManual}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Métrica
                </button>
              </div>

              {/* Lista todas as pessoas (Baseline + Manuais) */}
              {data.pessoas.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {data.pessoaEnvolvida
                      ? 'Selecione pessoas do Baseline acima ou clique em "Adicionar Métrica"'
                      : 'Clique em "Adicionar Métrica" para começar'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.pessoas.map((pessoa, index) => {
                    const isManual = isPessoaManual(pessoa.id);
                    return (
                      <div
                        key={pessoa.id || index}
                        className={`p-4 border rounded-lg ${isManual
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {pessoa.nome || 'Nova Métrica'} {pessoa.cargo && `- ${pessoa.cargo}`}
                            </h4>
                            {isManual && (
                              <span className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">
                                Manual
                              </span>
                            )}
                            {!isManual && (
                              <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                                PósIA
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removePessoaManual(pessoa.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover métrica"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {isManual && (
                            <>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                  Nome
                                </label>
                                <input
                                  type="text"
                                  value={pessoa.nome}
                                  onChange={(e) => updatePessoa(index, 'nome', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                  placeholder="Nome da pessoa"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                  Cargo
                                </label>
                                <input
                                  type="text"
                                  value={pessoa.cargo}
                                  onChange={(e) => updatePessoa(index, 'cargo', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                  placeholder="Cargo"
                                />
                              </div>
                            </>
                          )}
                          <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                              Valor da Hora (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formatNumberValue(pessoa.valorHora)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updatePessoa(index, 'valorHora', val)
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                              Tempo Gasto (min) {!isManual && <span className="text-green-600 dark:text-green-400">- Pós IA</span>}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formatNumberValue(pessoa.tempoGasto)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updatePessoa(index, 'tempoGasto', val)
                              }}
                              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${!isManual ? 'border-green-300 dark:border-green-600' : 'border-slate-300 dark:border-slate-600'
                                }`}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Frequências */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                              Frequência Real
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                  Quantidade
                                </label>
                                <input
                                  type="number"
                                  value={formatNumberValue(pessoa.frequenciaReal.quantidade)}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                    updatePessoa(index, 'frequenciaReal.quantidade', val)
                                  }}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                  Período
                                </label>
                                <select
                                  value={pessoa.frequenciaReal.periodo}
                                  onChange={(e) => updatePessoa(index, 'frequenciaReal.periodo', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                  <option value="Diário">Diário</option>
                                  <option value="Semanal">Semanal</option>
                                  <option value="Mensal">Mensal</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                              Frequência Desejada
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                  Quantidade
                                </label>
                                <input
                                  type="number"
                                  value={formatNumberValue(pessoa.frequenciaDesejada.quantidade)}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                    updatePessoa(index, 'frequenciaDesejada.quantidade', val)
                                  }}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                  Período
                                </label>
                                <select
                                  value={pessoa.frequenciaDesejada.periodo}
                                  onChange={(e) => updatePessoa(index, 'frequenciaDesejada.periodo', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                  <option value="Diário">Diário</option>
                                  <option value="Semanal">Semanal</option>
                                  <option value="Mensal">Mensal</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Resultados Prévios */}
            {data.pessoas.length > 0 && baselineData && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Custo Total Pós-IA (Mensal):
                    </span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      R$ {(data.custoTotalPostIA ?? 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
                {/*<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Delta Produtividade:
                      </span>
                    </div>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {calcularDeltaProdutividade.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    (HH Antes - HH Depois) × Valor Hora
                  </p>
                </div>*/}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INCREMENTO RECEITA */}
      {tipoPostIA === 'INCREMENTO RECEITA' && data.tipo === 'INCREMENTO RECEITA' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
              Valor da Receita Depois (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={data.tipo === 'INCREMENTO RECEITA' ? formatNumberValue(data.valorReceitaDepois) : ''}
              onChange={(e) => {
                const updatedData: PostIAData = {
                  tipo: 'INCREMENTO RECEITA',
                  valorReceitaDepois: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                  deltaReceita: calcularDeltaReceita
                }
                updateData(updatedData)
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />

            {/* Resultados Prévios */}
            {baselineData && baselineData.tipo === 'INCREMENTO RECEITA' && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Delta Receita:
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    R$ {calcularDeltaReceita.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Receita Depois - Receita Antes
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOS RELACIONADOS */}
      {tipoPostIA === 'CUSTOS RELACIONADOS' && data.tipo === 'CUSTOS RELACIONADOS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Ferramentas (Pós-IA)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Dados herdados do Baseline. Adicione o custo de implementação.
              </p>
            </div>

            {data.ferramentas.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                Preencha primeiro a aba Baseline para herdar os dados.
              </p>
            ) : (
              <div className="space-y-4">
                {data.ferramentas.map((ferramenta, index) => (
                  <div
                    key={ferramenta.id || index}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {ferramenta.nomeFerramenta}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Custo Mensal (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(ferramenta.custoMensal)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateFerramenta(index, 'custoMensal', val)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Outros Custos (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(ferramenta.outrosCustos)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateFerramenta(index, 'outrosCustos', val)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Custo de Implementação (R$) <span className="text-green-600 dark:text-green-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(ferramenta.custoImplementacao)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateFerramenta(index, 'custoImplementacao', val)
                          }}
                          className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Campo exclusivo do Pós-IA
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custo Total Implementação */}
            {data.ferramentas.length > 0 && (
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Custo Total de Implementação:
                  </span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    R$ {(data.custoTotalImplementacao ?? 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MELHORIA MARGEM */}
      {tipoPostIA === 'MELHORIA MARGEM' && data.tipo === 'MELHORIA MARGEM' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Dados Pós-IA - Melhoria de Margem
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Insira os valores estimados após a implementação da IA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Receita Bruta Mensal Estimada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formatNumberValue(data.receitaBrutaMensalEstimada)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      receitaBrutaMensalEstimada: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Custo Total Mensal Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formatNumberValue(data.custoTotalMensalEstimado)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      custoTotalMensalEstimado: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Margem Bruta Estimada (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatNumberValue(data.margemBrutaEstimada)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      margemBrutaEstimada: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Margem Bruta = ((Receita - Custo) / Receita) × 100
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Volume de Transações/Mês Estimado
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formatNumberValue(data.volumeTransacoesEstimado)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      volumeTransacoesEstimado: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Métricas Calculadas */}
            {baselineData && baselineData.tipo === 'MELHORIA MARGEM' && data.receitaBrutaMensalEstimada > 0 && (
              <div className="mt-6 space-y-4">
                {/* Delta Margem */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Delta Margem
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {(calcularMetricasMelhoriaMargem.deltaMargem > 0 ? '+' : '')}
                        {(calcularMetricasMelhoriaMargem.deltaMargem ?? 0).toFixed(2)}%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        R$ {(calcularMetricasMelhoriaMargem.deltaMargemReais ?? 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Margem Estimada ({(data.margemBrutaEstimada ?? 0).toFixed(2)}%) - Margem Atual ({(baselineData.margemBrutaAtual ?? 0).toFixed(2)}%)
                  </p>
                </div>

                {/* Economia Mensal e Anual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Economia Mensal
                      </span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        R$ {(calcularMetricasMelhoriaMargem.economiaMensal ?? 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Economia Anual
                      </span>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        R$ {(calcularMetricasMelhoriaMargem.economiaAnual ?? 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparativo Baseline vs Pós-IA */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Comparativo</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-600 dark:text-slate-400 mb-2">Baseline</div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Receita:</span>
                          <span className="ml-2 font-medium text-slate-900 dark:text-white">
                            R$ {(baselineData.receitaBrutaMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Custo:</span>
                          <span className="ml-2 font-medium text-slate-900 dark:text-white">
                            R$ {(baselineData.custoTotalMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Lucro:</span>
                          <span className="ml-2 font-medium text-slate-900 dark:text-white">
                            R$ {((baselineData.receitaBrutaMensal ?? 0) - (baselineData.custoTotalMensal ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-green-600 dark:text-green-400 mb-2">Pós-IA</div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Receita:</span>
                          <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                            R$ {(data.receitaBrutaMensalEstimada ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Custo:</span>
                          <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                            R$ {(data.custoTotalMensalEstimado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Lucro:</span>
                          <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                            R$ {((data.receitaBrutaMensalEstimada ?? 0) - (data.custoTotalMensalEstimado ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REDUÇÃO DE RISCO */}
      {tipoPostIA === 'REDUÇÃO DE RISCO' && data.tipo === 'REDUÇÃO DE RISCO' && baselineData && baselineData.tipo === 'REDUÇÃO DE RISCO' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Projeção Pós-IA - Redução de Risco
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Probabilidade com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Probabilidade de Ocorrência com IA (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formatNumberValue(data.probabilidadeComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      probabilidadeComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Probabilidade após implementação da IA
                </p>
              </div>

              {/* Impacto Financeiro Reduzido */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Impacto Financeiro Reduzido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.impactoFinanceiroReduzido)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      impactoFinanceiroReduzido: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Custo estimado do risco se ocorrer (com IA)
                </p>
              </div>

              {/* Frequência de Avaliação com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Frequência de Avaliação com IA
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatNumberValue(data.frequenciaAvaliacaoComIA)}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        frequenciaAvaliacaoComIA: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                  <select
                    value={data.periodoAvaliacaoComIA}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        periodoAvaliacaoComIA: e.target.value as 'dia' | 'semana' | 'mês' | 'ano'
                      } as PostIAData
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dia">por dia</option>
                    <option value="semana">por semana</option>
                    <option value="mês">por mês</option>
                    <option value="ano">por ano</option>
                  </select>
                </div>
              </div>

              {/* Custo de Mitigação com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Custo de Mitigação com IA (R$/mês)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.custoMitigacaoComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      custoMitigacaoComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Custo mensal para mitigar/monitorar com IA
                </p>
              </div>
            </div>

            {/* Cards de Métricas Calculadas */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Redução de Probabilidade */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Redução de Probabilidade
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {((data.reducaoProbabilidade ?? 0) > 0 ? '-' : '')}{Math.abs(data.reducaoProbabilidade ?? 0).toFixed(2)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(baselineData.probabilidadeAtual ?? 0).toFixed(2)}% → {(data.probabilidadeComIA ?? 0).toFixed(2)}%
                </p>
              </div>

              {/* Valor do Risco Evitado */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Valor do Risco Evitado
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  R$ {(data.valorRiscoEvitado ?? 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Redução de exposição
                </p>
              </div>

              {/* Economia em Mitigação */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Economia em Mitigação
                </h4>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  R$ {(data.economiaMitigacao ?? 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}/mês
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Redução de custo operacional
                </p>
              </div>

              {/* Benefício Anual */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Benefício Anual
                </h4>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  R$ {(data.beneficioAnual ?? 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Economia + Risco evitado
                </p>
              </div>

              {/* Custo vs Benefício */}
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Custo vs Benefício
                </h4>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(data.custoVsBeneficio ?? 0) > 0 ? (data.custoVsBeneficio ?? 0).toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(data.custoVsBeneficio ?? 0) > 1 ? `${(data.custoVsBeneficio ?? 0).toFixed(2)}x de retorno` : 'Razão benefício/custo'}
                </p>
              </div>

              {/* ROI da Redução de Risco */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ROI da Redução de Risco
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {((data.roiReducaoRisco ?? 0) > 0 ? '+' : '')}{(data.roiReducaoRisco ?? 0).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Retorno sobre investimento
                </p>
              </div>
            </div>

            {/* Comparativo Baseline vs Pós-IA */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Comparativo Baseline vs Pós-IA</h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-2 font-medium">Baseline</div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Probabilidade:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        {(baselineData.probabilidadeAtual ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Impacto:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        R$ {(baselineData.impactoFinanceiro ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Exposição:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        R$ {(((baselineData.probabilidadeAtual ?? 0) / 100) * (baselineData.impactoFinanceiro ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Custo Mitigação:</span>
                      <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                        R$ {(baselineData.custoMitigacaoAtual ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-2 font-medium">Pós-IA</div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Probabilidade:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {(data.probabilidadeComIA ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Impacto:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        R$ {(data.impactoFinanceiroReduzido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Exposição:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        R$ {((data.probabilidadeComIA / 100) * data.impactoFinanceiroReduzido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Custo Mitigação:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        R$ {(data.custoMitigacaoComIA ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUALIDADE DECISÃO */}
      {tipoPostIA === 'QUALIDADE DECISÃO' && data.tipo === 'QUALIDADE DECISÃO' && baselineData && baselineData.tipo === 'QUALIDADE DECISÃO' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-brain text-purple-600"></i>
              Projeção com IA - Qualidade de Decisão
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Número de Decisões/Período com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Número de Decisões por Período (Com IA)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatNumberValue(data.numeroDecisoesPeriodoComIA)}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        numeroDecisoesPeriodoComIA: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                  <select
                    value={data.periodoComIA}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        periodoComIA: e.target.value as 'dia' | 'semana' | 'mês' | 'ano'
                      } as PostIAData
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="dia">por dia</option>
                    <option value="semana">por semana</option>
                    <option value="mês">por mês</option>
                    <option value="ano">por ano</option>
                  </select>
                </div>
              </div>

              {/* Taxa de Acerto com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Taxa de Acerto com IA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatNumberValue(data.taxaAcertoComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      taxaAcertoComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Percentual de decisões corretas estimado com IA
                </p>
              </div>

              {/* Custo Médio de Decisão Errada com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Custo Médio de Decisão Errada com IA (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.custoMedioDecisaoErradaComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      custoMedioDecisaoErradaComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Custo financeiro quando a IA erra
                </p>
              </div>

              {/* Tempo Médio por Decisão com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Tempo Médio por Decisão com IA (minutos)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.tempoMedioDecisaoComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      tempoMedioDecisaoComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tempo médio para tomar cada decisão com IA
                </p>
              </div>

              {/* Pessoas Envolvidas com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Pessoas Envolvidas com IA
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formatNumberValue(data.pessoasEnvolvidasComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      pessoasEnvolvidasComIA: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Número de pessoas necessárias com suporte de IA
                </p>
              </div>
            </div>

            {/* Cards de Métricas Calculadas */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Melhoria na Taxa de Acerto */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Melhoria Taxa Acerto
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {((data.melhoriaTaxaAcerto ?? 0) > 0 ? '+' : '')}{(data.melhoriaTaxaAcerto ?? 0).toFixed(2)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Aumento na assertividade
                </p>
              </div>

              {/* Economia com Erros Evitados */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Economia Erros Evitados
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  R$ {(data.economiaErrosEvitados ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Por mês
                </p>
              </div>

              {/* Economia de Tempo */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Economia de Tempo
                </h4>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {(data.economiaTempo ?? 0).toFixed(1)}h
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Por mês
                </p>
              </div>

              {/* Valor do Tempo Economizado */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Valor Tempo Economizado
                </h4>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  R$ {(data.valorTempoEconomizado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Por mês
                </p>
              </div>

              {/* Benefício Total Mensal */}
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Benefício Total
                </h4>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  R$ {(data.beneficioTotalMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Por mês
                </p>
              </div>

              {/* ROI da Melhoria */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ROI da Melhoria
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {((data.roiMelhoria ?? 0) > 0 ? '+' : '')}{(data.roiMelhoria ?? 0).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Retorno anual
                </p>
              </div>
            </div>

            {/* Comparativo Baseline vs Pós-IA */}
            <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Comparativo: Baseline vs Pós-IA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-2 font-medium">Baseline</div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Decisões/mês:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        {(() => {
                          const fator = baselineData.periodo === 'dia' ? 30 : baselineData.periodo === 'semana' ? 4 : 1
                          return (baselineData.numeroDecisoesPeriodo * fator).toFixed(0)
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Taxa Acerto:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        {(baselineData.taxaAcertoAtual ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Tempo/Decisão:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        {(baselineData.tempoMedioDecisao ?? 0).toFixed(1)} min
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Custo Erro:</span>
                      <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                        R$ {(baselineData.custoMedioDecisaoErrada ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-2 font-medium">Pós-IA</div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Decisões/mês:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {(() => {
                          const fator = data.periodoComIA === 'dia' ? 30 : data.periodoComIA === 'semana' ? 4 : 1
                          return (data.numeroDecisoesPeriodoComIA * fator).toFixed(0)
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Taxa Acerto:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {(data.taxaAcertoComIA ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Tempo/Decisão:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {(data.tempoMedioDecisaoComIA ?? 0).toFixed(1)} min
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Custo Erro:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        R$ {(data.custoMedioDecisaoErradaComIA ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VELOCIDADE */}
      {tipoPostIA === 'VELOCIDADE' && data.tipo === 'VELOCIDADE' && baselineData && baselineData.tipo === 'VELOCIDADE' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-bolt text-orange-600"></i>
              Projeção com IA - Velocidade de Entrega
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tempo Médio de Entrega com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Tempo Médio de Entrega com IA
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formatNumberValue(data.tempoMedioEntregaComIA)}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        tempoMedioEntregaComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                  <select
                    value={data.unidadeTempoEntregaComIA}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        unidadeTempoEntregaComIA: e.target.value as 'dias' | 'horas'
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="horas">horas</option>
                    <option value="dias">dias</option>
                  </select>
                </div>
              </div>

              {/* Número de Entregas com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Número de Entregas por Período (Com IA)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatNumberValue(data.numeroEntregasPeriodoComIA)}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        numeroEntregasPeriodoComIA: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                  />
                  <select
                    value={data.periodoEntregasComIA}
                    onChange={(e) => {
                      const updatedData: PostIAData = {
                        ...data,
                        periodoEntregasComIA: e.target.value as 'dia' | 'semana' | 'mês' | 'ano'
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="dia">por dia</option>
                    <option value="semana">por semana</option>
                    <option value="mês">por mês</option>
                    <option value="ano">por ano</option>
                  </select>
                </div>
              </div>

              {/* Custo por Atraso Reduzido */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Custo por Atraso Reduzido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.custoPorAtrasoReduzido)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      custoPorAtrasoReduzido: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              {/* Pessoas Envolvidas com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Pessoas Envolvidas com IA
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formatNumberValue(data.pessoasEnvolvidasComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      pessoasEnvolvidasComIA: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              {/* Tempo de Trabalho por Entrega com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Tempo de Trabalho por Entrega com IA (horas)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.tempoTrabalhoPorEntregaComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      tempoTrabalhoPorEntregaComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Cards de Métricas Calculadas */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Redução Tempo Entrega
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(data.reducaoTempoEntrega ?? 0).toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Aumento Capacidade
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {((data.aumentoCapacidade ?? 0) > 0 ? '+' : '')}{(data.aumentoCapacidade ?? 0).toFixed(0)} entregas/mês
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Economia Atrasos
                </h4>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  R$ {(data.economiaAtrasos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Valor Tempo Economizado
                </h4>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  R$ {(data.valorTempoEconomizado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ganho Produtividade
                </h4>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {((data.ganhoProdutividade ?? 0) > 0 ? '+' : '')}{(data.ganhoProdutividade ?? 0).toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ROI Velocidade
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {((data.roiVelocidade ?? 0) > 0 ? '+' : '')}{(data.roiVelocidade ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SATISFAÇÃO */}
      {tipoPostIA === 'SATISFAÇÃO' && data.tipo === 'SATISFAÇÃO' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">😊</span>
              Estimativas Pós-IA (Satisfação)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Score de Satisfação com IA (0-100 ou NPS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.scoreComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      scoreComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              {/* Tipo Score */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Tipo de Score
                </label>
                <input
                  type="text"
                  value={data.tipoScore || ''}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  placeholder="Ex: NPS, CSAT, 0-100"
                />
              </div>

              {/* Número de Clientes Esperado */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Número de Clientes Esperado
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formatNumberValue(data.numeroClientesEsperado)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      numeroClientesEsperado: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              {/* Valor Médio por Cliente com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Valor Médio por Cliente com IA (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatNumberValue(data.valorMedioPorClienteComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      valorMedioPorClienteComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              {/* Taxa de Churn com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Taxa de Churn com IA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatNumberValue(data.taxaChurnComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      taxaChurnComIA: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              {/* Ticket Médio Suporte com IA */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Ticket Médio de Suporte com IA (nº/mês)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formatNumberValue(data.ticketMedioSuporteComIA)}
                  onChange={(e) => {
                    const updatedData: PostIAData = {
                      ...data,
                      ticketMedioSuporteComIA: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Cards de Métricas Calculadas */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Delta Satisfação
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {((data.deltaSatisfacao ?? 0) > 0 ? '+' : '')}{(data.deltaSatisfacao ?? 0).toFixed(1)} pts
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Redução Churn
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(data.reducaoChurn ?? 0).toFixed(2)}%
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Valor Retenção
                </h4>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  R$ {(data.valorRetencao ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Economia Suporte
                </h4>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  R$ {(data.economiaSuporte ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Aumento Revenue
                </h4>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  R$ {(data.aumentoRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ROI Satisfação
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {((data.roiSatisfacao ?? 0) > 0 ? '+' : '')}{(data.roiSatisfacao ?? 0).toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  LTV Incrementado
                </h4>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  R$ {(data.ltvIncrementado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Resumo Comparativo */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                📊 Resumo Comparativo: Baseline vs Pós-IA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Score</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {baselineData && baselineData.tipo === 'SATISFAÇÃO' ? (baselineData.scoreAtual ?? 0).toFixed(1) : '0.00'} → {(data.scoreComIA ?? 0).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Churn</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {baselineData && baselineData.tipo === 'SATISFAÇÃO' ? (baselineData.taxaChurnAtual ?? 0).toFixed(2) : '0.00'}% → {(data.taxaChurnComIA ?? 0).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Tickets Suporte</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {baselineData && baselineData.tipo === 'SATISFAÇÃO' ? baselineData.ticketMedioSuporte : '0'} → {data.ticketMedioSuporteComIA}/mês
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAPACIDADE ANALÍTICA */}
      {tipoPostIA === 'CAPACIDADE ANALÍTICA' && data.tipo === 'CAPACIDADE ANALÍTICA' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Capacidade Analítica - Pós IA
              </h3>
              <button
                type="button"
                onClick={addCampoQualitativo}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Adicionar Critério
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>Baseline:</strong> {baselineData && baselineData.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in baselineData ? baselineData.camposQualitativos.length : 0} critério(s) definido(s)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Documente os novos insights, análises ou capacidades analíticas geradas pela IA que não eram possíveis antes.
              </p>
            </div>

            {data.camposQualitativos.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                Nenhum critério adicionado. Clique em "Adicionar Critério" para começar.
              </p>
            ) : (
              <div className="space-y-4">
                {data.camposQualitativos.map((campo, index) => (
                  <div
                    key={campo.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        Critério {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeCampoQualitativo(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Critério / Insight
                        </label>
                        <input
                          type="text"
                          value={campo.criterio}
                          onChange={(e) => updateCampoQualitativo(index, 'criterio', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="Ex: Previsão de demanda por região"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Descrição / Valor Gerado
                        </label>
                        <textarea
                          value={campo.valor}
                          onChange={(e) => updateCampoQualitativo(index, 'valor', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="Descreva o insight ou capacidade analítica gerada pela IA..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comparativo com Baseline */}
            {baselineData && baselineData.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in baselineData && baselineData.camposQualitativos.length > 0 && (
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Referência - Baseline
                </h4>
                <div className="space-y-2">
                  {baselineData.camposQualitativos.map((campo, idx) => (
                    <div key={campo.id} className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {idx + 1}. {campo.criterio}:
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 ml-2">
                        {campo.valor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card de Métricas Calculadas */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5 shadow-sm">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Resumo - Capacidade Analítica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Critérios no Baseline
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {baselineData && baselineData.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in baselineData ? baselineData.camposQualitativos.length : 0}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Novos Critérios (Pós-IA)
                </p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {data.camposQualitativos.length}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Aumento na Capacidade
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {baselineData && baselineData.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in baselineData
                  ? `+${data.camposQualitativos.length - baselineData.camposQualitativos.length} novos insights`
                  : `${data.camposQualitativos.length} insights`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OUTROS */}
      {tipoPostIA === 'OUTROS' && data.tipo === 'OUTROS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
              Valor do Indicador Depois
            </label>
            <input
              type="number"
              step="0.01"
              value={data.tipo === 'OUTROS' ? formatNumberValue(data.valorIndicadorDepois) : ''}
              onChange={(e) => {
                const valorDepois = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                const valorAntes = baselineData && baselineData.tipo === 'OUTROS' ? baselineData.valorIndicador : 0
                const updatedData: PostIAData = {
                  tipo: 'OUTROS',
                  nomeIndicador: data.tipo === 'OUTROS' ? data.nomeIndicador : '',
                  valorIndicadorDepois: valorDepois,
                  deltaIndicador: valorDepois - valorAntes
                }
                updateData(updatedData)
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>
      )}
    </div>
  )
}

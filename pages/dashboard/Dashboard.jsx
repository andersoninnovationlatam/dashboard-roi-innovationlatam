import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { correlationService } from '../../services/correlationService'
import { calcularMetricasPorTipo, calcularMetricasProdutividade, calcularMetricasIncrementoReceita, calcularMetricasMelhoriaMargem, calcularMetricasReducaoRisco, calcularMetricasQualidadeDecisao, calcularMetricasVelocidade, calcularMetricasSatisfacao, calcularMetricasCapacidadeAnalitica } from '../../services/indicatorMetricsService'
import { indicatorCalculatedMetricsService } from '../../services/indicatorCalculatedMetricsService'
import Card from '../../components/common/Card'
import Loading from '../../components/common/Loading'
import Button from '../../components/common/Button'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import RadarChart from '../../components/charts/RadarChart'
import ProdutividadeCharts from '../../components/dashboard/ProdutividadeCharts'
import IncrementoReceitaCard from '../../components/dashboard/IncrementoReceitaCard'
import MelhoriaMargemCharts from '../../components/dashboard/MelhoriaMargemCharts'
import ReducaoRiscoCharts from '../../components/dashboard/ReducaoRiscoCharts'
import QualidadeDecisaoCharts from '../../components/dashboard/QualidadeDecisaoCharts'
import VelocidadeCharts from '../../components/dashboard/VelocidadeCharts'
import SatisfacaoCharts from '../../components/dashboard/SatisfacaoCharts'
import KPICard from '../../components/dashboard/KPICard'
import { formatarMoeda, formatarPorcentagem, formatarHoras, formatarPayback, formatarROI } from '../../utils/formatters'
import { obterNomeIndicador, normalizarTipoIndicador } from '../../utils/indicatorUtils'

const Dashboard = () => {
  const params = useParams()
  const id = params?.id
  const navigate = useNavigate()
  const { getProjectById, getIndicatorsByProjectId, getIndicatorById, calculateProjectROI, loading } = useData()


  const project = getProjectById(id)
  const [indicators, setIndicators] = useState([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(true)
  const [completeIndicators, setCompleteIndicators] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [metricasLoading, setMetricasLoading] = useState(false)
  const [calculatedMetricsMap, setCalculatedMetricsMap] = useState({}) // Mapa de métricas calculadas por indicator_id

  // Carrega indicadores completos (com baselineData e postIAData)
  useEffect(() => {
    const loadCompleteIndicators = async () => {
      if (!id) {
        setIndicators([])
        setCompleteIndicators([])
        setIndicatorsLoading(false)
        return
      }

      setIndicatorsLoading(true)
      try {
        const projectIndicators = await getIndicatorsByProjectId(id)
        setIndicators(projectIndicators || [])

        // Filtra IDs válidos (UUIDs) antes de buscar dados completos
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const validIndicators = (projectIndicators || []).filter(ind =>
          ind && ind.id && uuidRegex.test(ind.id)
        )

        // Carrega dados completos de cada indicador válido
        const complete = await Promise.all(
          validIndicators.map(async (ind) => {
            try {
              const completeIndicator = await getIndicatorById(ind.id)
              return completeIndicator
            } catch (error) {
              console.error(`Erro ao carregar indicador ${ind.id}:`, error)
              return ind
            }
          })
        )
        setCompleteIndicators(complete.filter(Boolean))
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error)
        setIndicators([])
        setCompleteIndicators([])
      } finally {
        setIndicatorsLoading(false)
      }
    }

    loadCompleteIndicators()
  }, [id, getIndicatorsByProjectId, getIndicatorById])

  // Busca métricas calculadas de indicator_calculated_metrics
  useEffect(() => {
    const loadCalculatedMetrics = async () => {
      if (completeIndicators.length === 0) {
        setCalculatedMetricsMap({})
        return
      }

      try {
        const indicatorIds = completeIndicators
          .filter(ind => ind && ind.id)
          .map(ind => ind.id)

        if (indicatorIds.length === 0) {
          setCalculatedMetricsMap({})
          return
        }

        // Busca métricas calculadas para todos os indicadores de uma vez
        const calculatedMetrics = await indicatorCalculatedMetricsService.getByIndicatorIds(indicatorIds)

        // Cria mapa de métricas por indicator_id
        const metricsMap = {}
        calculatedMetrics.forEach(metric => {
          if (metric && metric.indicator_id) {
            metricsMap[metric.indicator_id] = metric
          }
        })

        setCalculatedMetricsMap(metricsMap)
      } catch (error) {
        console.error('Erro ao buscar métricas calculadas:', error)
        setCalculatedMetricsMap({})
      }
    }

    loadCalculatedMetrics()
  }, [completeIndicators])

  // Calcula métricas do projeto de forma assíncrona
  useEffect(() => {
    const loadMetricas = async () => {
      if (!project || completeIndicators.length === 0) {
        setMetricas(null)
        return
      }
      setMetricasLoading(true)
      try {
        const result = await calculateProjectROI(id)
        setMetricas(result)
      } catch (error) {
        console.error('Erro ao calcular ROI:', error)
        setMetricas(null)
      } finally {
        setMetricasLoading(false)
      }
    }
    loadMetricas()
  }, [project, completeIndicators, id, calculateProjectROI])

  // Calcula métricas específicas por tipo de indicador
  const metricasPorTipo = useMemo(() => {
    if (completeIndicators.length === 0) {
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
    return calcularMetricasPorTipo(completeIndicators)
  }, [completeIndicators])

  // Verifica quais tipos de indicadores existem no projeto
  const tiposPresentes = useMemo(() => {
    const tipos = {
      produtividade: false,
      capacidadeAnalitica: false,
      incrementoReceita: false,
      melhoriaMargem: false,
      reducaoRisco: false,
      qualidadeDecisao: false,
      velocidade: false,
      satisfacao: false
    }

    completeIndicators.forEach(ind => {
      const tipo = ind?.tipoIndicador || ind?.info_data?.tipoIndicador
      if (tipo) {
        if (tipo === 'Produtividade') tipos.produtividade = true
        else if (tipo === 'Capacidade Analítica') tipos.capacidadeAnalitica = true
        else if (tipo === 'Incremento Receita') tipos.incrementoReceita = true
        else if (tipo === 'Melhoria Margem') tipos.melhoriaMargem = true
        else if (tipo === 'Redução de Risco') tipos.reducaoRisco = true
        else if (tipo === 'Qualidade Decisão') tipos.qualidadeDecisao = true
        else if (tipo === 'Velocidade') tipos.velocidade = true
        else if (tipo === 'Satisfação') tipos.satisfacao = true
      }
    })

    return tipos
  }, [completeIndicators])

  const [correlations, setCorrelations] = useState(null)
  const [correlationsLoading, setCorrelationsLoading] = useState(false)

  useEffect(() => {
    if (project && completeIndicators.length > 0) {
      setCorrelationsLoading(true)
      const result = correlationService.calculateCorrelations(id)
      if (result.success) {
        setCorrelations(result)
      }
      setCorrelationsLoading(false)
    }
  }, [project, completeIndicators, id])

  // Dados para gráfico de evolução financeira
  const dadosEvolucao = useMemo(() => {
    if (!metricas) return { labels: [], datasets: [] }

    const meses = [0, 3, 6, 9, 12, 18, 24, 36]
    const economiaMensal = (metricas.economiaAnualTotal || 0) / 12
    const investimentoTotal = (metricas.custoImplementacaoTotal || 0) + (metricas.custoAnualRecorrenteTotal || 0)

    return {
      labels: meses.map(m => `Mês ${m}`),
      datasets: [
        {
          label: 'Economia Acumulada',
          data: meses.map(m => {
            if (m === 0) return 0
            const economiaAcumulada = economiaMensal * m
            return economiaAcumulada - (m <= 12 ? investimentoTotal : (metricas.custoAnualRecorrenteTotal || 0))
          }),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Investimento Total',
          data: meses.map(m => investimentoTotal),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Lucro Líquido',
          data: meses.map(m => {
            if (m === 0) return -investimentoTotal
            const economiaAcumulada = economiaMensal * m
            return economiaAcumulada - (m <= 12 ? investimentoTotal : (metricas.custoAnualRecorrenteTotal || 0))
          }),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  }, [metricas])

  // Dados para gráfico de comparação manual vs IA
  const dadosComparacao = useMemo(() => {
    if (!metricas || !metricas.indicadoresDetalhados) {
      return { labels: [], datasets: [] }
    }

    const indicadoresComMetricas = metricas.indicadoresDetalhados.filter(item => {
      if (!item || !item.indicador) return false
      const tipoIndicador = normalizarTipoIndicador(item.indicador) || item.indicador.tipoIndicador || ''
      return tipoIndicador === 'Produtividade'
    })

    if (indicadoresComMetricas.length === 0) {
      return { labels: [], datasets: [] }
    }

    // Calcula tempos a partir dos dados reais do indicador
    const calcularTempoMedio = (indicador, isBaseline) => {
      const persons = isBaseline
        ? (indicador.persons_baseline || indicador.baselineData?.pessoas || indicador.baseline?.pessoas || [])
        : (indicador.persons_post_ia || indicador.postIAData?.pessoas || indicador.postIA?.pessoas || [])

      if (persons.length === 0) return 0

      const tempoTotal = persons.reduce((total, pessoa) => {
        const tempoMinutos = pessoa.time_spent_minutes || pessoa.tempoGasto || 0
        return total + (parseFloat(tempoMinutos) || 0)
      }, 0)

      return tempoTotal / persons.length
    }

    return {
      labels: indicadoresComMetricas.map(item => obterNomeIndicador(item.indicador) || 'Indicador'),
      datasets: [
        {
          label: 'Tempo Manual (min)',
          data: indicadoresComMetricas.map(item => calcularTempoMedio(item.indicador, true)),
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Tempo com IA (min)',
          data: indicadoresComMetricas.map(item => calcularTempoMedio(item.indicador, false)),
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Dados para gráfico de economia por indicador
  const dadosEconomia = useMemo(() => {
    if (!metricas || !metricas.indicadoresDetalhados) {
      return { labels: [], datasets: [] }
    }

    const indicadoresComMetricas = metricas.indicadoresDetalhados.filter(item => item && item.metricas)

    if (indicadoresComMetricas.length === 0) {
      return { labels: [], datasets: [] }
    }

    return {
      labels: indicadoresComMetricas.map(item => obterNomeIndicador(item.indicador) || 'Indicador'),
      datasets: [
        {
          label: 'Economia Anual (R$)',
          data: indicadoresComMetricas.map(item => item.metricas?.economiaAnual || 0),
          backgroundColor: indicadoresComMetricas.map(item =>
            (item.metricas?.economiaAnual || 0) >= 0
              ? 'rgba(34, 197, 94, 0.8)'
              : 'rgba(239, 68, 68, 0.8)'
          )
        }
      ]
    }
  }, [metricas])

  // Dados para gráfico de radar (métricas de performance)
  const dadosRadar = useMemo(() => {
    if (!metricas || !metricas.indicadoresDetalhados) {
      return {
        labels: ['ROI', 'Eficiência', 'Capacidade', 'Produtividade', 'Economia'],
        datasets: []
      }
    }

    const indicadoresComMetricas = metricas.indicadoresDetalhados.filter(item => item && item.metricas)

    if (indicadoresComMetricas.length === 0) {
      return {
        labels: ['ROI', 'Eficiência', 'Capacidade', 'Produtividade', 'Economia'],
        datasets: []
      }
    }

    // Normaliza valores para escala 0-100
    const normalizar = (valor, max) => {
      if (max === 0) return 0
      return Math.min(100, (valor / max) * 100)
    }

    const maxROI = Math.max(...indicadoresComMetricas.map(item => Math.abs(item.metricas?.roiPercentual || 0)), 1)
    const maxEficiencia = Math.max(...indicadoresComMetricas.map(item => Math.abs(item.metricas?.eficiencia || 0)), 1)
    const maxCapacidade = Math.max(...indicadoresComMetricas.map(item => Math.abs(item.metricas?.ganhoCapacidade || 0)), 1)
    const maxProdutividade = Math.max(...indicadoresComMetricas.map(item => Math.abs(item.metricas?.ganhoProdutividade || 0)), 1)
    const maxEconomia = Math.max(...indicadoresComMetricas.map(item => Math.abs(item.metricas?.economiaAnual || 0)), 1)

    return {
      labels: ['ROI (%)', 'Eficiência (%)', 'Capacidade (%)', 'Produtividade (%)', 'Economia (R$)'],
      datasets: indicadoresComMetricas.map((item, index) => {
        const m = item.metricas || {}
        const colors = [
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(251, 191, 36, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(236, 72, 153, 0.6)'
        ]
        return {
          label: obterNomeIndicador(item.indicador) || `Indicador ${index + 1}`,
          data: [
            normalizar(Math.abs(m.roiPercentual || 0), maxROI),
            normalizar(Math.abs(m.eficiencia || 0), maxEficiencia),
            normalizar(Math.abs(m.ganhoCapacidade || 0), maxCapacidade),
            normalizar(Math.abs(m.ganhoProdutividade || 0), maxProdutividade),
            normalizar(Math.abs(m.economiaAnual || 0), maxEconomia)
          ],
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.6', '1'),
          borderWidth: 2
        }
      })
    }
  }, [metricas])

  // Retornos condicionais - APÓS todos os hooks
  if (loading || indicatorsLoading || metricasLoading) {
    return <Loading />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Projeto não encontrado</p>
      </div>
    )
  }

  if (indicators.length === 0 || completeIndicators.length === 0) {
    return (
      <Card>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-chart-line text-4xl text-blue-500 dark:text-blue-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Nenhum indicador encontrado
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Adicione indicadores ao projeto para ver as métricas de ROI
          </p>
          <Button onClick={() => navigate(`/projects/${id}/indicators/new`)}>
            <i className="fas fa-plus mr-2"></i>
            Criar Primeiro Indicador
          </Button>
        </div>
      </Card>
    )
  }

  if (!metricas || !metricas.indicadoresDetalhados || metricas.indicadoresDetalhados.length === 0) {
    return (
      <Card>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-hourglass-half text-4xl text-yellow-500 dark:text-yellow-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Calculando métricas...
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Aguarde enquanto processamos os dados dos indicadores
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div>
      {/* Cards de KPI - Movidos para o topo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {(metricas.economiaAnualTotal && metricas.economiaAnualTotal !== 0) && (
          <KPICard
            label="Economia Líquida/Ano"
            value={formatarMoeda(metricas.economiaAnualTotal)}
            icon="fas fa-piggy-bank"
            color="green"
            isPositive={metricas.economiaAnualTotal >= 0}
          />
        )}

        {(metricas.tempoEconomizadoAnualHoras && metricas.tempoEconomizadoAnualHoras !== 0) && (
          <KPICard
            label="Tempo Economizado"
            value={formatarHoras(metricas.tempoEconomizadoAnualHoras)}
            icon="fas fa-clock"
            color="cyan"
            subLabel="/ano"
          />
        )}

        {(metricas.roiGeral !== null && metricas.roiGeral !== undefined && !isNaN(metricas.roiGeral)) && (
          <KPICard
            label="ROI 1º Ano"
            value={formatarROI(metricas.roiGeral)}
            icon="fas fa-chart-line"
            color="purple"
            isPositive={metricas.roiGeral >= 0}
          />
        )}

        {(metricas.paybackMedioMeses && metricas.paybackMedioMeses !== Infinity && !isNaN(metricas.paybackMedioMeses)) && (
          <KPICard
            label="Payback Médio"
            value={formatarPayback(metricas.paybackMedioMeses)}
            icon="fas fa-sync-alt"
            color="blue"
          />
        )}
      </div>

      {/* Cards Individuais por Indicador */}
      {completeIndicators
        .filter((indicador) => {
          // Filtrar apenas indicadores que têm métricas calculadas
          const calculatedMetrics = calculatedMetricsMap[indicador.id]
          return calculatedMetrics && Object.keys(calculatedMetrics).length > 0
        })
        .map((indicador) => {
        const tipoIndicador = normalizarTipoIndicador(indicador) || 'Produtividade'
        const nomeIndicador = obterNomeIndicador(indicador)

        // Busca métricas calculadas do banco de dados
        const calculatedMetrics = calculatedMetricsMap[indicador.id] || null

        // Encontra a métrica específica deste indicador
        const metricaDetalhada = metricas?.indicadoresDetalhados?.find(item =>
          item.indicador?.id === indicador.id
        )

        // Encontra a métrica por tipo correspondente
        let metricaPorTipo = null
        if (tipoIndicador === 'Produtividade') {
          metricaPorTipo = metricasPorTipo.produtividade.find(m =>
            m.indicadorNome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Incremento Receita') {
          metricaPorTipo = metricasPorTipo.incrementoReceita.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Melhoria Margem') {
          metricaPorTipo = metricasPorTipo.melhoriaMargem.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Redução de Risco') {
          metricaPorTipo = metricasPorTipo.reducaoRisco.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Qualidade Decisão') {
          metricaPorTipo = metricasPorTipo.qualidadeDecisao.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Velocidade') {
          metricaPorTipo = metricasPorTipo.velocidade.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Satisfação') {
          metricaPorTipo = metricasPorTipo.satisfacao.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        } else if (tipoIndicador === 'Capacidade Analítica') {
          metricaPorTipo = metricasPorTipo.capacidadeAnalitica.find(m =>
            m.nome === nomeIndicador ||
            (indicador.id && metricaDetalhada?.indicador?.id === indicador.id)
          )
        }

        // Prioriza métricas calculadas do banco se disponíveis (mais confiáveis)
        // Sempre usa dados do banco quando disponíveis, pois são calculados automaticamente
        if (calculatedMetrics) {
          if (tipoIndicador === 'Produtividade') {
            // Sempre prioriza dados do banco para produtividade
            metricaPorTipo = {
              ...(metricaPorTipo || {}),
              nome: nomeIndicador,
              indicadorNome: nomeIndicador,
              // Prioriza dados do banco, mas mantém dados calculados no frontend como fallback
              deltaProdutividade: calculatedMetrics.delta_produtividade ?? metricaPorTipo?.deltaProdutividade ?? 0,
              delta_produtividade: calculatedMetrics.delta_produtividade ?? 0,
              horasEconomizadasMes: calculatedMetrics.horas_economizadas_mes ?? metricaPorTipo?.horasEconomizadasMes ?? 0,
              horas_economizadas_mes: calculatedMetrics.horas_economizadas_mes ?? 0,
              horasEconomizadasAno: calculatedMetrics.horas_economizadas_ano ?? metricaPorTipo?.horasEconomizadasAno ?? 0,
              horas_economizadas_ano: calculatedMetrics.horas_economizadas_ano ?? 0,
              custoTotalBaseline: calculatedMetrics.custo_total_baseline ?? metricaPorTipo?.custoTotalBaseline ?? 0,
              custo_total_baseline: calculatedMetrics.custo_total_baseline ?? 0,
              custoTotalPostIA: calculatedMetrics.custo_total_post_ia ?? metricaPorTipo?.custoTotalPostIA ?? 0,
              custo_total_post_ia: calculatedMetrics.custo_total_post_ia ?? 0
            }
          } else if (tipoIndicador === 'Incremento Receita') {
            if (!metricaPorTipo || !metricaPorTipo.deltaReceita || metricaPorTipo.deltaReceita === 0) {
              metricaPorTipo = {
                ...(metricaPorTipo || {}),
                nome: nomeIndicador,
                deltaReceita: calculatedMetrics.delta_receita || 0
              }
            }
          } else if (tipoIndicador === 'Melhoria Margem') {
            if (!metricaPorTipo) {
              metricaPorTipo = {
                nome: nomeIndicador,
                deltaMargem: calculatedMetrics.delta_margem || 0,
                deltaMargemReais: calculatedMetrics.delta_margem_reais || 0,
                economiaMensal: calculatedMetrics.economia_mensal || 0,
                economiaAnual: calculatedMetrics.economia_anual || 0
              }
            }
          } else if (tipoIndicador === 'Redução de Risco') {
            if (!metricaPorTipo) {
              metricaPorTipo = {
                nome: nomeIndicador,
                reducaoProbabilidade: calculatedMetrics.reducao_probabilidade || 0,
                valorRiscoEvitado: calculatedMetrics.valor_risco_evitado || 0,
                economiaMitigacao: calculatedMetrics.economia_mitigacao || 0,
                beneficioAnual: calculatedMetrics.beneficio_anual || 0,
                custoVsBeneficio: calculatedMetrics.custo_vs_beneficio || 0,
                roiReducaoRisco: calculatedMetrics.roi_reducao_risco || 0
              }
            }
          } else if (tipoIndicador === 'Qualidade Decisão') {
            if (!metricaPorTipo) {
              metricaPorTipo = {
                nome: nomeIndicador,
                melhoriaTaxaAcerto: calculatedMetrics.melhoria_taxa_acerto || 0,
                economiaErrosEvitados: calculatedMetrics.economia_erros_evitados || 0,
                economiaTempo: calculatedMetrics.economia_tempo || 0,
                valorTempoEconomizado: calculatedMetrics.valor_tempo_economizado || 0,
                beneficioTotalMensal: calculatedMetrics.beneficio_total_mensal || 0,
                roiMelhoria: calculatedMetrics.roi_melhoria || 0
              }
            }
          } else if (tipoIndicador === 'Velocidade') {
            if (!metricaPorTipo) {
              metricaPorTipo = {
                nome: nomeIndicador,
                reducaoTempoEntrega: calculatedMetrics.reducao_tempo_entrega || 0,
                aumentoCapacidade: calculatedMetrics.aumento_capacidade || 0,
                economiaAtrasos: calculatedMetrics.economia_atrasos || 0,
                valorTempoEconomizado: calculatedMetrics.valor_tempo_economizado_velocidade || 0,
                ganhoProdutividade: calculatedMetrics.ganho_produtividade || 0,
                roiVelocidade: calculatedMetrics.roi_velocidade || 0
              }
            }
          } else if (tipoIndicador === 'Satisfação') {
            if (!metricaPorTipo) {
              metricaPorTipo = {
                nome: nomeIndicador,
                deltaSatisfacao: calculatedMetrics.delta_satisfacao || 0,
                reducaoChurn: calculatedMetrics.reducao_churn || 0,
                valorRetencao: calculatedMetrics.valor_retencao || 0,
                economiaSuporte: calculatedMetrics.economia_suporte || 0,
                aumentoRevenue: calculatedMetrics.aumento_revenue || 0,
                roisatisfacao: calculatedMetrics.roi_satisfacao || 0,
                ltvIncrementado: calculatedMetrics.ltv_incrementado || 0
              }
            }
          }
        }

        // Se não há métricas calculadas do banco, não exibe o indicador
        // O dashboard mostra apenas indicadores com dados calculados salvos
        if (!calculatedMetrics) {
          return null
        }

        // Verifica se há pelo menos uma métrica com valor não-zero
        const hasData = Object.values(calculatedMetrics).some(value => {
          if (value === null || value === undefined) return false
          if (typeof value === 'number' && value !== 0) return true
          if (typeof value === 'string' && value.trim() !== '') return true
          return false
        })

        if (!hasData) {
          return null
        }

        // Renderiza card baseado no tipo
        if (tipoIndicador === 'Produtividade' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <ProdutividadeCharts metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Incremento Receita' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <IncrementoReceitaCard metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Melhoria Margem' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <MelhoriaMargemCharts metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Redução de Risco' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-red-500/5 to-rose-500/5 border-red-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <ReducaoRiscoCharts metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Qualidade Decisão' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border-indigo-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <QualidadeDecisaoCharts metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Velocidade' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border-yellow-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <VelocidadeCharts metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Satisfação' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-pink-500/5 to-rose-500/5 border-pink-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <SatisfacaoCharts metricas={[metricaPorTipo]} />
              </Card>
            </div>
          )
        }

        if (tipoIndicador === 'Capacidade Analítica' && metricaPorTipo) {
          return (
            <div key={indicador.id || `indicador-${nomeIndicador}`} className="mb-8">
              <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {nomeIndicador}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                      {tipoIndicador}
                    </span>
                  </div>
                  {indicador.description && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {indicador.description}
                    </p>
                  )}
                </div>
                <Card>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{metricaPorTipo.nome || nomeIndicador}</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricaPorTipo.aumentoCapacidade || 0}%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">aumento de capacidade</p>
                    </div>
                  </div>
                </Card>
              </Card>
            </div>
          )
        }

        // Fallback para tipos não mapeados
        return null
      })}

      {/* Gráficos Gerais - Mostrar apenas se houver dados */}
      {(dadosEvolucao.datasets.length > 0 || dadosComparacao.datasets.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {dadosEvolucao.datasets.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Evolução Financeira</h3>
                <i className="fas fa-chart-line text-slate-400"></i>
              </div>
              <LineChart data={dadosEvolucao} />
            </Card>
          )}

          {dadosComparacao.datasets.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Comparação Manual vs IA</h3>
                <i className="fas fa-chart-bar text-slate-400"></i>
              </div>
              <BarChart data={dadosComparacao} />
            </Card>
          )}
        </div>
      )}

      {(dadosEconomia.datasets.length > 0 || dadosRadar.datasets.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {dadosEconomia.datasets.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Economia por Indicador</h3>
                <i className="fas fa-chart-bar text-slate-400"></i>
              </div>
              <BarChart data={dadosEconomia} horizontal={true} />
            </Card>
          )}

          {dadosRadar.datasets.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Métricas de Performance</h3>
                <i className="fas fa-spider text-slate-400"></i>
              </div>
              <RadarChart data={dadosRadar} />
            </Card>
          )}
        </div>
      )}

      {/* Resumo Financeiro Detalhado */}
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Resumo Financeiro Detalhado</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-5 border border-green-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Economia Bruta Anual</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatarMoeda(metricas.economiaBrutaAnualTotal || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl p-5 border border-red-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Custo de Implementação</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatarMoeda(metricas.custoImplementacaoTotal || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-5 border border-yellow-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Custo Anual Recorrente</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatarMoeda(metricas.custoAnualRecorrenteTotal || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-5 border border-cyan-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Ganho de Produtividade Médio</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{formatarPorcentagem(metricas.ganhoProdutividadeMedio || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-5 border border-blue-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Ganho de Capacidade Médio</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatarPorcentagem(metricas.ganhoCapacidadeMedio || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-xl p-5 border border-slate-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total de Indicadores</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-white">{metricas.totalIndicadores || 0}</p>
          </div>
        </div>
      </Card>

      {/* Tabela de Indicadores */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Indicadores Detalhados</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Indicador</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Métrica Baseline</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Métrica Pós-IA</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Economia/Ano</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">ROI</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Payback</th>
              </tr>
            </thead>
            <tbody>
              {metricas.indicadoresDetalhados?.map((item, index) => {
                const m = item?.metricas || {}
                const indicador = item?.indicador || {}
                if (!m || !indicador) return null

                // Obtém o tipo do indicador suportando formato normalizado e antigo
                const tipoIndicador = normalizarTipoIndicador(indicador) || indicador.tipoIndicador || indicador.info_data?.tipoIndicador || 'N/A'
                const tipoNormalizado = tipoIndicador.toUpperCase().replace(/[ÁÀÂÃ]/g, 'A').replace(/[ÉÊ]/g, 'E').replace(/[Í]/g, 'I').replace(/[ÓÔÕ]/g, 'O').replace(/[ÚÛ]/g, 'U')

                // Busca dados de baseline e pós-IA
                const baselineData = indicador.baselineData || indicador.baseline || indicador.baseline_data || {}
                const postIAData = indicador.postIAData || indicador.post_ia_data || indicador.postIA || {}

                // Função helper para obter unidade de medida baseada no tipo de indicador
                const obterUnidadeMedida = (tipo) => {
                  switch (tipo) {
                    case 'PRODUTIVIDADE':
                      return 'min'
                    case 'INCREMENTO RECEITA':
                      return 'R$'
                    case 'CAPACIDADE ANALITICA':
                    case 'CAPACIDADE ANALÍTICA':
                      return 'análises'
                    case 'MELHORIA MARGEM':
                      return '%'
                    case 'REDUCAO DE RISCO':
                    case 'REDUÇÃO DE RISCO':
                      return '%'
                    case 'QUALIDADE DECISAO':
                    case 'QUALIDADE DECISÃO':
                      return '%'
                    case 'VELOCIDADE':
                      return baselineData.unidadeTempoEntrega || 'dias'
                    case 'SATISFACAO':
                    case 'SATISFAÇÃO':
                      return baselineData.tipoScore || 'NPS'
                    default:
                      return indicador.metric_unit || m.metric_unit || 'unidades'
                  }
                }

                // Função helper para formatar valor com unidade de medida
                const formatarValorComUnidade = (valor, tipo, unidade) => {
                  if (!valor || valor === 0) return '-'

                  switch (tipo) {
                    case 'INCREMENTO RECEITA':
                      return formatarMoeda(valor)
                    case 'MELHORIA MARGEM':
                    case 'REDUCAO DE RISCO':
                    case 'REDUÇÃO DE RISCO':
                    case 'QUALIDADE DECISAO':
                    case 'QUALIDADE DECISÃO':
                      return `${formatarPorcentagem(valor)}`
                    case 'VELOCIDADE':
                      return `${valor} ${unidade}`
                    case 'SATISFACAO':
                    case 'SATISFAÇÃO':
                      return `${valor} ${unidade}`
                    case 'CAPACIDADE ANALITICA':
                    case 'CAPACIDADE ANALÍTICA':
                      return `${valor} ${unidade}`
                    case 'PRODUTIVIDADE':
                      return `${Math.round(valor)} ${unidade}`
                    default:
                      return `${valor} ${unidade}`
                  }
                }

                // Função helper para determinar métricas baseado no tipo
                const obterMetricasPorTipo = () => {
                  const unidade = obterUnidadeMedida(tipoNormalizado)
                  let metricaBaseline = '-'
                  let metricaPosIA = '-'

                  switch (tipoNormalizado) {
                    case 'PRODUTIVIDADE':
                      // Calcula tempo médio a partir das pessoas do baseline e pós-IA
                      const personsBaseline = indicador.persons_baseline || baselineData.pessoas || []
                      const personsPostIA = indicador.persons_post_ia || postIAData.pessoas || []

                      // Calcula tempo total em minutos para baseline
                      const tempoTotalBaseline = personsBaseline.reduce((total, pessoa) => {
                        const tempoMinutos = pessoa.time_spent_minutes || pessoa.tempoGasto || 0
                        return total + (parseFloat(tempoMinutos) || 0)
                      }, 0)

                      // Calcula tempo total em minutos para pós-IA
                      const tempoTotalPostIA = personsPostIA.reduce((total, pessoa) => {
                        const tempoMinutos = pessoa.time_spent_minutes || pessoa.tempoGasto || 0
                        return total + (parseFloat(tempoMinutos) || 0)
                      }, 0)

                      // Calcula média se houver pessoas
                      const tempoMedioBaseline = personsBaseline.length > 0 ? tempoTotalBaseline / personsBaseline.length : tempoTotalBaseline
                      const tempoMedioPostIA = personsPostIA.length > 0 ? tempoTotalPostIA / personsPostIA.length : tempoTotalPostIA

                      if (tempoMedioBaseline > 0 || tempoMedioPostIA > 0) {
                        metricaBaseline = formatarValorComUnidade(tempoMedioBaseline, tipoNormalizado, unidade)
                        metricaPosIA = formatarValorComUnidade(tempoMedioPostIA, tipoNormalizado, unidade)
                      }
                      break

                    case 'INCREMENTO RECEITA':
                      const receitaAntes = baselineData.valorReceitaAntes || 0
                      const receitaDepois = postIAData.valorReceitaDepois || 0
                      metricaBaseline = formatarValorComUnidade(receitaAntes, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(receitaDepois, tipoNormalizado, unidade)
                      break

                    case 'CAPACIDADE ANALITICA':
                    case 'CAPACIDADE ANALÍTICA':
                      const qtdAnalisesAntes = baselineData.quantidadeAnalises || 0
                      const qtdAnalisesDepois = postIAData.quantidadeAnalises || 0
                      metricaBaseline = formatarValorComUnidade(qtdAnalisesAntes, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(qtdAnalisesDepois, tipoNormalizado, unidade)
                      break

                    case 'MELHORIA MARGEM':
                      const margemAtual = baselineData.margemBrutaAtual || 0
                      const margemEstimada = postIAData.margemBrutaEstimada || 0
                      metricaBaseline = formatarValorComUnidade(margemAtual, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(margemEstimada, tipoNormalizado, unidade)
                      break

                    case 'REDUCAO DE RISCO':
                    case 'REDUÇÃO DE RISCO':
                      const probAtual = baselineData.probabilidadeAtual || baselineData.probabilidade || 0
                      const probComIA = postIAData.probabilidadeComIA || postIAData.probabilidadeDepois || 0
                      metricaBaseline = formatarValorComUnidade(probAtual, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(probComIA, tipoNormalizado, unidade)
                      break

                    case 'QUALIDADE DECISAO':
                    case 'QUALIDADE DECISÃO':
                      const taxaAcertoAtual = baselineData.taxaAcertoAtual || 0
                      const taxaAcertoComIA = postIAData.taxaAcertoComIA || 0
                      metricaBaseline = formatarValorComUnidade(taxaAcertoAtual, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(taxaAcertoComIA, tipoNormalizado, unidade)
                      break

                    case 'VELOCIDADE':
                      const tempoEntregaAtual = baselineData.tempoMedioEntregaAtual || 0
                      const tempoEntregaComIA = postIAData.tempoMedioEntregaComIA || 0
                      const unidadeEntregaComIA = postIAData.unidadeTempoEntregaComIA || baselineData.unidadeTempoEntrega || 'dias'
                      metricaBaseline = formatarValorComUnidade(tempoEntregaAtual, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(tempoEntregaComIA, tipoNormalizado, unidadeEntregaComIA)
                      break

                    case 'SATISFACAO':
                    case 'SATISFAÇÃO':
                      const scoreAtual = baselineData.scoreAtual || 0
                      const scoreComIA = postIAData.scoreComIA || 0
                      metricaBaseline = formatarValorComUnidade(scoreAtual, tipoNormalizado, unidade)
                      metricaPosIA = formatarValorComUnidade(scoreComIA, tipoNormalizado, unidade)
                      break

                    default:
                      // Tenta calcular tempo para tipos não mapeados (similar a produtividade)
                      const personsBaselineDefault = indicador.persons_baseline || baselineData.pessoas || []
                      const personsPostIADefault = indicador.persons_post_ia || postIAData.pessoas || []

                      if (personsBaselineDefault.length > 0 || personsPostIADefault.length > 0) {
                        const tempoTotalBaselineDefault = personsBaselineDefault.reduce((total, pessoa) => {
                          const tempoMinutos = pessoa.time_spent_minutes || pessoa.tempoGasto || 0
                          return total + (parseFloat(tempoMinutos) || 0)
                        }, 0)

                        const tempoTotalPostIADefault = personsPostIADefault.reduce((total, pessoa) => {
                          const tempoMinutos = pessoa.time_spent_minutes || pessoa.tempoGasto || 0
                          return total + (parseFloat(tempoMinutos) || 0)
                        }, 0)

                        const tempoMedioBaselineDefault = personsBaselineDefault.length > 0 ? tempoTotalBaselineDefault / personsBaselineDefault.length : tempoTotalBaselineDefault
                        const tempoMedioPostIADefault = personsPostIADefault.length > 0 ? tempoTotalPostIADefault / personsPostIADefault.length : tempoTotalPostIADefault

                        if (tempoMedioBaselineDefault > 0 || tempoMedioPostIADefault > 0) {
                          metricaBaseline = formatarValorComUnidade(tempoMedioBaselineDefault, 'PRODUTIVIDADE', 'min')
                          metricaPosIA = formatarValorComUnidade(tempoMedioPostIADefault, 'PRODUTIVIDADE', 'min')
                        }
                      } else {
                        // Fallback para valores genéricos
                        const valorBaseline = baselineData.valor || m.valorBaseline || 0
                        const valorPosIA = postIAData.valor || m.valorPosIA || 0
                        if (valorBaseline > 0 || valorPosIA > 0) {
                          metricaBaseline = formatarValorComUnidade(valorBaseline, tipoNormalizado, unidade)
                          metricaPosIA = formatarValorComUnidade(valorPosIA, tipoNormalizado, unidade)
                        }
                      }
                  }

                  return { metricaBaseline, metricaPosIA }
                }

                const { metricaBaseline, metricaPosIA } = obterMetricasPorTipo()

                return (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 text-slate-900 dark:text-white font-medium">{obterNomeIndicador(indicador) || 'Indicador'}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {tipoIndicador}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-300 font-medium">{metricaBaseline}</td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-300 font-medium">{metricaPosIA}</td>
                    <td className={`py-4 px-4 text-right font-semibold ${(m.economiaAnual || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatarMoeda(m.economiaAnual || 0)}
                    </td>
                    <td className={`py-4 px-4 text-right ${(m.roiPercentual || 0) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatarROI(m.roiPercentual || 0)}
                    </td>
                    <td className="py-4 px-4 text-right text-cyan-600 dark:text-cyan-400">{formatarPayback(m.paybackMeses || Infinity)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Seção de Correlações */}
      {correlations && correlations.correlations && correlations.correlations.length > 0 && (
        <Card className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Análise de Correlações
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Correlações automáticas entre dados das abas para insights de ROI
            </p>
          </div>

          {correlationsLoading ? (
            <Loading />
          ) : (
            <>
              {/* Cards de Correlações */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {correlations.correlations.map((corr, index) => {
                  if (corr.type === 'tipo_vs_roi') {
                    return (
                      <Card key={index} className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                          {corr.label}
                        </h3>
                        <div className="space-y-2">
                          {corr.value.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{item.tipo}</span>
                              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {formatarPorcentagem(item.media)} ({item.count} indicadores)
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )
                  }

                  const corrValue = typeof corr.value === 'number' ? corr.value : 0
                  const corrPercent = (corrValue * 100).toFixed(1)
                  const isPositive = corrValue > 0

                  return (
                    <Card key={index} className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {corr.label}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-3xl font-bold ${isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isPositive ? '+' : ''}{corrPercent}%
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {corr.strength === 'muito_forte' && 'Correlação muito forte'}
                            {corr.strength === 'forte' && 'Correlação forte'}
                            {corr.strength === 'moderada' && 'Correlação moderada'}
                            {corr.strength === 'fraca' && 'Correlação fraca'}
                            {corr.strength === 'muito_fraca' && 'Correlação muito fraca'}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-blue-500/20' : 'bg-red-500/20'
                          }`}>
                          <i className={`fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} text-xl ${isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                            }`}></i>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Insights */}
              {correlations.insights && correlations.insights.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Insights Automáticos
                  </h3>
                  <div className="space-y-3">
                    {correlations.insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 ${insight.type === 'positive'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : insight.type === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <i className={`fas ${insight.type === 'positive' ? 'fa-check-circle text-green-600 dark:text-green-400'
                            : insight.type === 'warning' ? 'fa-exclamation-triangle text-yellow-600 dark:text-yellow-400'
                              : 'fa-info-circle text-blue-600 dark:text-blue-400'
                            } text-xl mt-1`}></i>
                          <p className="text-slate-700 dark:text-slate-300 flex-1">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}

export default Dashboard

import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { correlationService } from '../../services/correlationService'
import { calcularMetricasPorTipo } from '../../services/indicatorMetricsService'
import Card from '../../components/common/Card'
import Loading from '../../components/common/Loading'
import Button from '../../components/common/Button'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import RadarChart from '../../components/charts/RadarChart'
import ProdutividadeCharts from '../../components/dashboard/ProdutividadeCharts'
import IncrementoReceitaCard from '../../components/dashboard/IncrementoReceitaCard'
import MelhoriaMargemCharts from '../../components/dashboard/MelhoriaMargemCharts'
import KPICard from '../../components/dashboard/KPICard'
import { formatarMoeda, formatarPorcentagem, formatarHoras, formatarPayback, formatarROI } from '../../utils/formatters'

const Dashboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProjectById, getIndicatorsByProjectId, getIndicatorById, calculateProjectROI, loading } = useData()
  
  const project = getProjectById(id)
  const [indicators, setIndicators] = useState([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(true)
  const [completeIndicators, setCompleteIndicators] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [metricasLoading, setMetricasLoading] = useState(false)

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
        // Debug: Verificar valores dos cards
        console.log('📊 Métricas calculadas:', {
          economiaBrutaAnualTotal: result?.economiaBrutaAnualTotal,
          custoImplementacaoTotal: result?.custoImplementacaoTotal,
          custoAnualRecorrenteTotal: result?.custoAnualRecorrenteTotal,
          ganhoProdutividadeMedio: result?.ganhoProdutividadeMedio,
          ganhoCapacidadeMedio: result?.ganhoCapacidadeMedio,
          totalIndicadores: result?.totalIndicadores
        })
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
    
    const indicadoresComMetricas = metricas.indicadoresDetalhados.filter(item => item && item.metricas)
    
    if (indicadoresComMetricas.length === 0) {
      return { labels: [], datasets: [] }
    }
    
    return {
      labels: indicadoresComMetricas.map(item => item.indicador?.nome || 'Indicador'),
      datasets: [
        {
          label: 'Tempo Manual (min)',
          data: indicadoresComMetricas.map(item => item.metricas?.tempoBaselineMinutos || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Tempo com IA (min)',
          data: indicadoresComMetricas.map(item => item.metricas?.tempoComIAMinutos || 0),
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
      labels: indicadoresComMetricas.map(item => item.indicador?.nome || 'Indicador'),
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
          label: item.indicador?.nome || `Indicador ${index + 1}`,
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

  if (indicators.length === 0) {
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

  if (!metricas) {
    return <Loading />
  }

  return (
    <div>
      {/* Cards de KPI - Movidos para o topo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          label="Economia Líquida/Ano"
          value={formatarMoeda(metricas.economiaAnualTotal || 0)}
          icon="fas fa-piggy-bank"
          color="green"
          isPositive={(metricas.economiaAnualTotal || 0) >= 0}
        />

        <KPICard
          label="Tempo Economizado"
          value={formatarHoras(metricas.tempoEconomizadoAnualHoras || 0)}
          icon="fas fa-clock"
          color="cyan"
          subLabel="/ano"
        />

        <KPICard
          label="ROI 1º Ano"
          value={formatarROI(metricas.roiGeral || 0)}
          icon="fas fa-chart-line"
          color="purple"
          isPositive={(metricas.roiGeral || 0) >= 0}
        />

        <KPICard
          label="Payback Médio"
          value={formatarPayback(metricas.paybackMedioMeses || Infinity)}
          icon="fas fa-sync-alt"
          color="blue"
        />
      </div>

      {/* Gráficos Específicos por Tipo de Indicador */}
      {tiposPresentes.produtividade && metricasPorTipo.produtividade.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Produtividade
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise detalhada dos indicadores de produtividade
            </p>
          </div>
          <ProdutividadeCharts metricas={metricasPorTipo.produtividade} />
        </div>
      )}

      {tiposPresentes.incrementoReceita && metricasPorTipo.incrementoReceita.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Incremento de Receita
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise do delta de receita após implementação
            </p>
          </div>
          <IncrementoReceitaCard metricas={metricasPorTipo.incrementoReceita} />
        </div>
      )}

      {tiposPresentes.melhoriaMargem && metricasPorTipo.melhoriaMargem && metricasPorTipo.melhoriaMargem.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Melhoria de Margem
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise de otimização de custos e melhoria da margem de lucro
            </p>
          </div>
          <MelhoriaMargemCharts metricas={metricasPorTipo.melhoriaMargem} />
        </div>
      )}

      {tiposPresentes.reducaoRisco && metricasPorTipo.reducaoRisco && metricasPorTipo.reducaoRisco.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Redução de Risco
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise de riscos evitados e impactos mitigados
            </p>
          </div>
          <Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricasPorTipo.reducaoRisco.map((metrica, index) => (
                <div key={index} className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-5 border border-orange-500/20">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{metrica.nome}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatarMoeda(metrica.impactoEvitado || 0)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">impacto evitado/ano</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tiposPresentes.capacidadeAnalitica && metricasPorTipo.capacidadeAnalitica && metricasPorTipo.capacidadeAnalitica.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Capacidade Analítica
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise do aumento na capacidade de análise e tomada de decisão
            </p>
          </div>
          <Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricasPorTipo.capacidadeAnalitica.map((metrica, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{metrica.nome}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrica.aumentoCapacidade || 0}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">aumento de capacidade</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tiposPresentes.qualidadeDecisao && metricasPorTipo.qualidadeDecisao && metricasPorTipo.qualidadeDecisao.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Qualidade de Decisão
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise da melhoria na qualidade das decisões tomadas
            </p>
          </div>
          <Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricasPorTipo.qualidadeDecisao.map((metrica, index) => (
                <div key={index} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-5 border border-purple-500/20">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{metrica.nome}</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">+{metrica.melhoriaQualidade || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">pontos de melhoria (0-100)</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tiposPresentes.velocidade && metricasPorTipo.velocidade && metricasPorTipo.velocidade.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Velocidade
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise da redução no tempo de entrega
            </p>
          </div>
          <Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricasPorTipo.velocidade.map((metrica, index) => (
                <div key={index} className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-xl p-5 border border-indigo-500/20">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{metrica.nome}</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metrica.reducaoTempo || 0}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">redução no tempo</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tiposPresentes.satisfacao && metricasPorTipo.satisfacao && metricasPorTipo.satisfacao.length > 0 && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Métricas de Satisfação
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Análise da melhoria na satisfação
            </p>
          </div>
          <Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricasPorTipo.satisfacao.map((metrica, index) => (
                <div key={index} className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-xl p-5 border border-pink-500/20">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{metrica.nome}</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">+{metrica.deltaScore || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">pontos de melhoria</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tempo Manual</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tempo IA</th>
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
                return (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 text-slate-900 dark:text-white font-medium">{indicador.nome || 'Indicador'}</td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-300">{Math.round(m.tempoBaselineMinutos || 0)} min</td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-300">{Math.round(m.tempoComIAMinutos || 0)} min</td>
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isPositive ? 'bg-blue-500/20' : 'bg-red-500/20'
                        }`}>
                          <i className={`fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} text-xl ${
                            isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
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
                        className={`p-4 rounded-xl border-2 ${
                          insight.type === 'positive'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : insight.type === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <i className={`fas ${
                            insight.type === 'positive' ? 'fa-check-circle text-green-600 dark:text-green-400'
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

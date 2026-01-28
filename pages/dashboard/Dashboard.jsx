import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { correlationService } from '../../services/correlationService'
import Card from '../../components/common/Card'
import Loading from '../../components/common/Loading'
import Button from '../../components/common/Button'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import RadarChart from '../../components/charts/RadarChart'
import { formatarMoeda, formatarPorcentagem, formatarHoras, formatarPayback, formatarROI } from '../../utils/formatters'

const Dashboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProjectById, getIndicatorsByProjectId, calculateProjectROI, loading } = useData()
  
  const project = getProjectById(id)
  const indicators = getIndicatorsByProjectId(id)

  const metricas = useMemo(() => {
    if (!project) {
      return null
    }
    if (indicators.length === 0) {
      return null
    }
    try {
      const result = calculateProjectROI(id)
      return result
    } catch (error) {
      console.error('Erro ao calcular ROI:', error)
      return null
    }
  }, [project, indicators, id, calculateProjectROI])

  const [correlations, setCorrelations] = useState(null)
  const [correlationsLoading, setCorrelationsLoading] = useState(false)

  useEffect(() => {
    if (project && indicators.length > 0) {
      setCorrelationsLoading(true)
      const result = correlationService.calculateCorrelations(id)
      if (result.success) {
        setCorrelations(result)
      }
      setCorrelationsLoading(false)
    }
  }, [project, indicators, id])

  if (loading) {
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

  // Se não há indicadores, já retornou acima
  if (indicators.length === 0) {
    return null // Já foi tratado acima
  }

  if (!metricas) {
    return <Loading />
  }

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

  return (
    <div>

      {/* Cards de KPI */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Economia Líquida/Ano</p>
              <p className={`text-3xl font-bold ${(metricas.economiaAnualTotal || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatarMoeda(metricas.economiaAnualTotal || 0)}
              </p>
            </div>
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-piggy-bank text-3xl text-green-600 dark:text-green-400"></i>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tempo Economizado</p>
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {formatarHoras(metricas.tempoEconomizadoAnualHoras || 0)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">/ano</p>
            </div>
            <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-3xl text-cyan-600 dark:text-cyan-400"></i>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ROI 1º Ano</p>
              <p className={`text-3xl font-bold ${(metricas.roiGeral || 0) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatarROI(metricas.roiGeral || 0)}
              </p>
            </div>
            <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-chart-line text-3xl text-purple-600 dark:text-purple-400"></i>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Payback Médio</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatarPayback(metricas.paybackMedioMeses || Infinity)}
              </p>
            </div>
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-sync-alt text-3xl text-blue-600 dark:text-blue-400"></i>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Evolução Financeira</h3>
            <i className="fas fa-chart-line text-slate-400"></i>
          </div>
          <LineChart data={dadosEvolucao} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Comparação Manual vs IA</h3>
            <i className="fas fa-chart-bar text-slate-400"></i>
          </div>
          <BarChart data={dadosComparacao} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Economia por Indicador</h3>
            <i className="fas fa-chart-bar text-slate-400"></i>
          </div>
          <BarChart data={dadosEconomia} horizontal={true} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Métricas de Performance</h3>
            <i className="fas fa-spider text-slate-400"></i>
          </div>
          <RadarChart data={dadosRadar} />
        </Card>
      </div>

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

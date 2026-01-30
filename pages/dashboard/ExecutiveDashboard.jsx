/**
 * Dashboard Executivo
 * Visão consolidada de todos os projetos da organização
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { calculatedResultsService } from '../../services/calculatedResultsService'
import { projectServiceSupabase } from '../../services/projectServiceSupabase'
import Card from '../../components/common/Card'
import Loading from '../../components/common/Loading'
import KPICard from '../../components/dashboard/KPICard'
import LineChart from '../../components/charts/LineChart'
import DoughnutChart from '../../components/charts/DoughnutChart'
import BarChart from '../../components/charts/BarChart'
import { formatarMoeda, formatarPorcentagem, formatarHoras, formatarPayback } from '../../utils/formatters'
import { ProjectStatus, ImprovementType } from '../../../src/types'

const ExecutiveDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, indicators, getCurrentOrganization, calculateProjectROI } = useData()
  
  const [kpis, setKpis] = useState(null)
  const [economiaMensal, setEconomiaMensal] = useState([])
  const [distribuicaoTipo, setDistribuicaoTipo] = useState([])
  const [topProjetos, setTopProjetos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.organization_id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Filtrar projetos da organização
        const orgProjects = projects.filter(p => p.organization_id === user.organization_id)
        
        // Calcular KPIs consolidados
        let totalEconomiaAnual = 0
        let totalHorasEconomizadas = 0
        let totalInvestimento = 0
        let projetosProducao = 0
        let projetosConcluidos = 0
        const paybacks = []

        // Calcular ROI de cada projeto
        const projetosComROI = await Promise.all(
          orgProjects.map(async (project) => {
            const projectIndicators = indicators.filter(ind => ind.project_id === project.id)
            const roi = await calculateProjectROI(project.id)
            
            totalEconomiaAnual += roi.economiaAnualTotal || 0
            totalHorasEconomizadas += roi.tempoEconomizadoAnualHoras || 0
            totalInvestimento += (project.implementation_cost || 0) + ((project.monthly_maintenance_cost || 0) * 12)
            
            if (project.status === ProjectStatus.PRODUCTION) projetosProducao++
            if (project.status === ProjectStatus.COMPLETED) projetosConcluidos++
            
            if (roi.paybackMedioMeses && roi.paybackMedioMeses !== Infinity) {
              paybacks.push(roi.paybackMedioMeses)
            }

            return {
              ...project,
              roi: roi.roiGeral || 0,
              economiaAnual: roi.economiaAnualTotal || 0,
              payback: roi.paybackMedioMeses || Infinity
            }
          })
        )

        // Calcular ROI total do programa
        const roiTotal = totalInvestimento > 0
          ? ((totalEconomiaAnual - totalInvestimento) / totalInvestimento) * 100
          : totalEconomiaAnual > 0 ? Infinity : 0

        // Payback médio
        const paybackMedio = paybacks.length > 0
          ? paybacks.reduce((sum, p) => sum + p, 0) / paybacks.length
          : Infinity

        setKpis({
          roi_total: roiTotal,
          economia_anual: totalEconomiaAnual,
          horas_economizadas_ano: totalHorasEconomizadas,
          projetos_producao: projetosProducao,
          projetos_concluidos: projetosConcluidos,
          payback_medio: paybackMedio
        })

        // Top 5 projetos por ROI
        const top5 = projetosComROI
          .filter(p => p.roi > 0)
          .sort((a, b) => b.roi - a.roi)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            nome: p.name,
            tipo: p.development_type,
            status: p.status,
            economia_anual: p.economiaAnual,
            roi: p.roi,
            payback: p.payback
          }))

        setTopProjetos(top5)

        // Distribuição por tipo de melhoria
        const distribuicao = {}
        indicators.forEach(ind => {
          const tipo = ind.improvement_type || ind.improvementType
          if (tipo) {
            if (!distribuicao[tipo]) {
              distribuicao[tipo] = 0
            }
            // Buscar calculated_result para obter economia
            // Por enquanto usa valor estimado baseado no tipo
            distribuicao[tipo] += 10000 // Placeholder - será calculado corretamente
          }
        })

        const distribuicaoArray = Object.entries(distribuicao).map(([tipo, valor]) => ({
          tipo,
          valor,
          percentual: (valor / totalEconomiaAnual) * 100
        }))

        setDistribuicaoTipo(distribuicaoArray)

        // Economia mensal (últimos 12 meses)
        // Por enquanto placeholder - será implementado com tracking_history
        const meses = []
        for (let i = 11; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          meses.push({
            mes: date.toISOString().substring(0, 7),
            bruta: totalEconomiaAnual / 12,
            investimento: totalInvestimento / 12,
            liquida: (totalEconomiaAnual - totalInvestimento) / 12
          })
        }
        setEconomiaMensal(meses)

      } catch (error) {
        console.error('Erro ao carregar dashboard executivo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, projects, indicators, calculateProjectROI])

  const organization = getCurrentOrganization()

  if (loading) {
    return <Loading />
  }

  if (!kpis) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">
          Carregando dados do dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard Executivo
        </h1>
        {organization && (
          <p className="text-slate-600 dark:text-slate-400">
            {organization.name}
          </p>
        )}
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="ROI Total do Programa"
          value={formatarPorcentagem(kpis.roi_total)}
          icon="fas fa-chart-line"
          color="green"
          isPositive={kpis.roi_total >= 0}
        />
        <KPICard
          label="Economia Anual"
          value={formatarMoeda(kpis.economia_anual)}
          icon="fas fa-piggy-bank"
          color="green"
        />
        <KPICard
          label="Horas Economizadas/Ano"
          value={formatarHoras(kpis.horas_economizadas_ano)}
          icon="fas fa-clock"
          color="cyan"
        />
        <KPICard
          label="Projetos em Produção"
          value={kpis.projetos_producao.toString()}
          icon="fas fa-rocket"
          color="blue"
          subLabel="projetos"
        />
        <KPICard
          label="Projetos Concluídos"
          value={kpis.projetos_concluidos.toString()}
          icon="fas fa-check-circle"
          color="green"
          subLabel="projetos"
        />
        <KPICard
          label="Payback Médio"
          value={formatarPayback(kpis.payback_medio)}
          icon="fas fa-sync-alt"
          color="orange"
        />
      </div>

      {/* Gráfico: Economia Acumulada */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
          Economia Acumulada ao Longo do Tempo
        </h2>
        <LineChart
          data={{
            labels: economiaMensal.map(m => {
              const [year, month] = m.mes.split('-')
              return `${month}/${year}`
            }),
            datasets: [
              {
                label: 'Economia Bruta',
                data: economiaMensal.map(m => m.bruta),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true
              },
              {
                label: 'Investimento Acumulado',
                data: economiaMensal.map(m => m.investimento),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true
              },
              {
                label: 'Economia Líquida',
                data: economiaMensal.map(m => m.liquida),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
              }
            ]
          }}
        />
      </Card>

      {/* Gráfico: Distribuição por Tipo */}
      {distribuicaoTipo.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
              Distribuição por Tipo de Melhoria
            </h2>
            <DoughnutChart
              data={{
                labels: distribuicaoTipo.map(d => {
                  const labels = {
                    [ImprovementType.PRODUCTIVITY]: 'Produtividade',
                    [ImprovementType.ANALYTICAL_CAPACITY]: 'Capacidade Analítica',
                    [ImprovementType.REVENUE_INCREASE]: 'Incremento de Receita',
                    [ImprovementType.COST_REDUCTION]: 'Redução de Custo',
                    [ImprovementType.RISK_REDUCTION]: 'Redução de Risco',
                    [ImprovementType.DECISION_QUALITY]: 'Qualidade da Decisão',
                    [ImprovementType.SPEED]: 'Velocidade',
                    [ImprovementType.SATISFACTION]: 'Satisfação'
                  }
                  return labels[d.tipo] || d.tipo
                }),
                datasets: [{
                  data: distribuicaoTipo.map(d => d.valor),
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                  ]
                }]
              }}
            />
          </Card>

          {/* Top 5 Projetos */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
              Top 5 Projetos por ROI
            </h2>
            {topProjetos.length > 0 ? (
              <div className="space-y-3">
                {topProjetos.map((projeto, index) => (
                  <div
                    key={projeto.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => navigate(`/projects/${projeto.id}/dashboard`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          #{index + 1} {projeto.nome}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ROI: {formatarPorcentagem(projeto.roi)} • 
                          Economia: {formatarMoeda(projeto.economia_anual)}/ano
                        </div>
                      </div>
                      <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                Nenhum projeto com ROI positivo encontrado
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default ExecutiveDashboard

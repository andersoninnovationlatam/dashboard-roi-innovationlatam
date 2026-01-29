import React, { useMemo } from 'react'
import Card from '../common/Card'
import BarChart from '../charts/BarChart'
import { formatarMoeda } from '../../utils/formatters'

/**
 * Componente que renderiza gráficos específicos para indicadores de SATISFAÇÃO
 */
const SatisfacaoCharts = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Totais consolidados
  const totalValorRetencao = metricas.reduce((sum, m) => sum + (m.valorRetencao || 0), 0)
  const totalEconomiaSuporte = metricas.reduce((sum, m) => sum + (m.economiaSuporte || 0), 0)
  const totalAumentoRevenue = metricas.reduce((sum, m) => sum + (m.aumentoRevenue || 0), 0)
  const totalCustoImplementacao = metricas.reduce((sum, m) => sum + (m.custoImplementacao || 0), 0)
  
  const deltaSatisfacaoMedia = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.deltaSatisfacao || 0), 0) / metricas.length
    : 0
  
  const reducaoChurnMedia = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.reducaoChurn || 0), 0) / metricas.length
    : 0
  
  const ltvIncrementadoMedio = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.ltvIncrementado || 0), 0) / metricas.length
    : 0
  
  const beneficioTotal = totalValorRetencao + (totalEconomiaSuporte * 12) + totalAumentoRevenue
  const roiMedio = totalCustoImplementacao > 0
    ? ((beneficioTotal - totalCustoImplementacao) / totalCustoImplementacao) * 100
    : 0

  // Gráfico 1: Score de Satisfação - Antes vs Depois
  const dadosSatisfacao = useMemo(() => {
    const labels = []
    const scoreAntes = []
    const scoreDepois = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      scoreAntes.push(metrica.scoreAtual || 0)
      scoreDepois.push(metrica.scoreComIA || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Score Antes',
          data: scoreAntes,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Score com IA',
          data: scoreDepois,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 2: Taxa de Churn - Antes vs Depois
  const dadosChurn = useMemo(() => {
    const labels = []
    const churnAntes = []
    const churnDepois = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      churnAntes.push(metrica.taxaChurnAtual || 0)
      churnDepois.push(metrica.taxaChurnComIA || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Churn Antes (%)',
          data: churnAntes,
          backgroundColor: 'rgba(251, 146, 60, 0.8)'
        },
        {
          label: 'Churn com IA (%)',
          data: churnDepois,
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 3: Impacto Financeiro
  const dadosImpactoFinanceiro = useMemo(() => {
    const labels = []
    const retencao = []
    const suporte = []
    const revenue = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      retencao.push(metrica.valorRetencao || 0)
      suporte.push((metrica.economiaSuporte || 0) * 12)  // Anualizado
      revenue.push(metrica.aumentoRevenue || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Valor Retenção (R$/ano)',
          data: retencao,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          label: 'Economia Suporte (R$/ano)',
          data: suporte,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        },
        {
          label: 'Aumento Revenue (R$/ano)',
          data: revenue,
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        }
      ]
    }
  }, [metricas])

  return (
    <div className="space-y-6">
      {/* Cards com as 7 Métricas Solicitadas + 1 Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Delta de Satisfação */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Delta de Satisfação</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {deltaSatisfacaoMedia > 0 ? '+' : ''}{deltaSatisfacaoMedia.toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              pontos de melhoria
            </p>
          </div>
        </Card>

        {/* 2. Redução de Churn */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Redução de Churn</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {reducaoChurnMedia.toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Diminuição média
            </p>
          </div>
        </Card>

        {/* 3. Valor de Retenção */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Valor de Retenção</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatarMoeda(totalValorRetencao)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Por ano
            </p>
          </div>
        </Card>

        {/* 4. Economia com Suporte */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia com Suporte</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatarMoeda(totalEconomiaSuporte)}/mês
            </p>
            <p className="text-sm font-semibold text-amber-500 dark:text-amber-300 mt-1">
              {formatarMoeda(totalEconomiaSuporte * 12)}/ano
            </p>
          </div>
        </Card>

        {/* 5. Aumento de Revenue */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Aumento de Revenue</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatarMoeda(totalAumentoRevenue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Por ano
            </p>
          </div>
        </Card>

        {/* 6. ROI da Satisfação */}
        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ROI da Satisfação</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {roiMedio > 0 ? '+' : ''}{roiMedio.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Retorno sobre investimento
            </p>
          </div>
        </Card>

        {/* 7. LTV Incrementado */}
        <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">LTV Incrementado</p>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {formatarMoeda(ltvIncrementadoMedio)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lifetime Value médio
            </p>
          </div>
        </Card>

        {/* Info adicional: Número de Indicadores */}
        <Card className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Indicadores Satisfação</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
              {metricas.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total implementados
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico 1: Score de Satisfação Antes vs Depois */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Score de Satisfação: Antes vs Com IA
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comparação dos níveis de satisfação (NPS/CSAT)
            </p>
          </div>
          <i className="fas fa-heart text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosSatisfacao} />
      </Card>

      {/* Gráfico 2: Taxa de Churn */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Taxa de Churn: Antes vs Com IA
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Redução no cancelamento de clientes (%)
            </p>
          </div>
          <i className="fas fa-user-minus text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosChurn} />
      </Card>

      {/* Gráfico 3: Impacto Financeiro */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Impacto Financeiro da Satisfação
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Valor de retenção, economia com suporte e aumento de revenue (anual)
            </p>
          </div>
          <i className="fas fa-sack-dollar text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosImpactoFinanceiro} />
      </Card>

      {/* Tabela Detalhada com TODAS as Métricas */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Detalhamento Completo por Indicador
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="py-3 px-3 text-left font-semibold text-slate-700 dark:text-slate-300">Indicador</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Delta Satisf.</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Red. Churn</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Val. Retenção</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Econ. Suporte</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Aum. Revenue</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">LTV Increm.</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">ROI</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((metrica, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-slate-900 dark:text-white font-medium">{metrica.nome || 'Indicador'}</td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {metrica.deltaSatisfacao > 0 ? '+' : ''}{metrica.deltaSatisfacao?.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    {metrica.reducaoChurn?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">
                    {formatarMoeda(metrica.valorRetencao || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">
                    {formatarMoeda(metrica.economiaSuporte || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400">
                    {formatarMoeda(metrica.aumentoRevenue || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-pink-600 dark:text-pink-400 font-semibold">
                    {formatarMoeda(metrica.ltvIncrementado || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-semibold">
                    {metrica.roiSatisfacao > 0 ? '+' : ''}{metrica.roiSatisfacao?.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default SatisfacaoCharts

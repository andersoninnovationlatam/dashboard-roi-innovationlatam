import React, { useMemo } from 'react'
import Card from '../common/Card'
import BarChart from '../charts/BarChart'
import { formatarMoeda } from '../../utils/formatters'

/**
 * Componente que renderiza gráficos específicos para indicadores de MELHORIA MARGEM
 */
const MelhoriaMargemCharts = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Totais consolidados
  const totalEconomiaMensal = metricas.reduce((sum, m) => sum + (m.economiaMensal || 0), 0)
  const totalEconomiaAnual = metricas.reduce((sum, m) => sum + (m.economiaAnual || 0), 0)
  const totalDeltaMargemReais = metricas.reduce((sum, m) => sum + (m.deltaMargemReais || 0), 0)
  const totalCustoImplementacao = metricas.reduce((sum, m) => sum + (m.custoImplementacao || 0), 0)
  const totalImpactoLucroAnual = metricas.reduce((sum, m) => sum + (m.impactoLucroAnual || 0), 0)
  
  const roiMedio = totalCustoImplementacao > 0 
    ? ((totalEconomiaAnual - totalCustoImplementacao) / totalCustoImplementacao) * 100 
    : 0
  
  const paybackMedio = totalEconomiaMensal > 0 && totalCustoImplementacao > 0
    ? totalCustoImplementacao / totalEconomiaMensal
    : 0

  const deltaMargemMedio = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.deltaMargem || 0), 0) / metricas.length
    : 0

  // Gráfico 1: Delta Margem (% e R$)
  const dadosDeltaMargem = useMemo(() => {
    const labels = []
    const deltaMargemPercent = []
    const deltaMargemReais = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      deltaMargemPercent.push(metrica.deltaMargem || 0)
      deltaMargemReais.push(metrica.deltaMargemReais || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Delta Margem (%)',
          data: deltaMargemPercent,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        },
        {
          label: 'Delta Margem (R$)',
          data: deltaMargemReais,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 2: Economia Mensal vs Anual
  const dadosEconomia = useMemo(() => {
    const labels = []
    const economiaMensal = []
    const economiaAnual = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      economiaMensal.push(metrica.economiaMensal || 0)
      economiaAnual.push(metrica.economiaAnual || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Economia Mensal (R$)',
          data: economiaMensal,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        },
        {
          label: 'Economia Anual (R$)',
          data: economiaAnual,
          backgroundColor: 'rgba(22, 163, 74, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 3: ROI e Payback
  const dadosROIPayback = useMemo(() => {
    const labels = []
    const roi = []
    const payback = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      roi.push(metrica.roi || 0)
      payback.push(metrica.payback || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'ROI (%)',
          data: roi,
          backgroundColor: 'rgba(99, 102, 241, 0.8)'
        },
        {
          label: 'Payback (meses)',
          data: payback,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }
      ]
    }
  }, [metricas])

  return (
    <div className="space-y-6">
      {/* Cards com as 7 Métricas Solicitadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Delta Margem (% e R$) */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Delta Margem</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {deltaMargemMedio > 0 ? '+' : ''}{deltaMargemMedio.toFixed(2)}%
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
              {formatarMoeda(totalDeltaMargemReais)}
            </p>
          </div>
        </Card>

        {/* 2. Economia Mensal */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia Mensal</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatarMoeda(totalEconomiaMensal)}
            </p>
          </div>
        </Card>

        {/* 3. Economia Anual */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia Anual</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatarMoeda(totalEconomiaAnual)}
            </p>
          </div>
        </Card>

        {/* 4. ROI da Implementação */}
        <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ROI da Implementação</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {roiMedio.toFixed(1)}%
            </p>
          </div>
        </Card>

        {/* 5. Payback */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Payback</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {paybackMedio > 0 ? `${paybackMedio.toFixed(1)} meses` : 'N/A'}
            </p>
          </div>
        </Card>

        {/* 6. Impacto no Lucro Anual */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Impacto no Lucro Anual</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatarMoeda(totalImpactoLucroAnual)}
            </p>
          </div>
        </Card>

        {/* 7. Custo de Implementação (Info adicional) */}
        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Custo Implementação</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatarMoeda(totalCustoImplementacao)}
            </p>
          </div>
        </Card>

        {/* 8. Número de Indicadores */}
        <Card className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Indicadores</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
              {metricas.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico 1: Delta Margem (% e R$) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Delta Margem (% e R$)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Melhoria da margem em percentual e valor absoluto
            </p>
          </div>
          <i className="fas fa-percentage text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosDeltaMargem} />
      </Card>

      {/* Gráfico 2: Economia Mensal vs Anual */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Economia Mensal e Anual
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Ganho financeiro projetado por período
            </p>
          </div>
          <i className="fas fa-money-bill-wave text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosEconomia} />
      </Card>

      {/* Gráfico 3: ROI e Payback */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              ROI da Implementação e Payback
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Retorno sobre investimento e tempo de recuperação
            </p>
          </div>
          <i className="fas fa-chart-line text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosROIPayback} />
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
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Delta Margem (%)</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Delta Margem (R$)</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Economia Mensal</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Economia Anual</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">ROI</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Payback</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Impacto Lucro</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((metrica, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-slate-900 dark:text-white font-medium">{metrica.nome || 'Indicador'}</td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400 font-semibold">
                    {metrica.deltaMargem > 0 ? '+' : ''}{metrica.deltaMargem?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {formatarMoeda(metrica.deltaMargemReais || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400">
                    {formatarMoeda(metrica.economiaMensal || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatarMoeda(metrica.economiaAnual || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400">
                    {metrica.roi?.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400">
                    {metrica.payback > 0 ? `${metrica.payback.toFixed(1)}m` : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                    {formatarMoeda(metrica.impactoLucroAnual || 0)}
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

export default MelhoriaMargemCharts

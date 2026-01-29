import React, { useMemo } from 'react'
import Card from '../common/Card'
import BarChart from '../charts/BarChart'
import { formatarMoeda } from '../../utils/formatters'

/**
 * Componente que renderiza gráficos específicos para indicadores de REDUÇÃO DE RISCO
 */
const ReducaoRiscoCharts = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Totais consolidados
  const totalValorRiscoEvitado = metricas.reduce((sum, m) => sum + (m.valorRiscoEvitado || 0), 0)
  const totalEconomiaMitigacao = metricas.reduce((sum, m) => sum + (m.economiaMitigacao || 0), 0)
  const totalBeneficioAnual = metricas.reduce((sum, m) => sum + (m.beneficioAnual || 0), 0)
  const totalCustoImplementacao = metricas.reduce((sum, m) => sum + (m.custoImplementacao || 0), 0)
  
  const reducaoProbabilidadeMedia = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.reducaoProbabilidade || 0), 0) / metricas.length
    : 0
  
  const custoVsBeneficioMedio = totalCustoImplementacao > 0
    ? totalBeneficioAnual / totalCustoImplementacao
    : 0
  
  const roiMedio = totalCustoImplementacao > 0
    ? ((totalBeneficioAnual - totalCustoImplementacao) / totalCustoImplementacao) * 100
    : 0

  // Gráfico 1: Redução de Probabilidade (%)
  const dadosReducaoProbabilidade = useMemo(() => {
    const labels = []
    const reducaoProbabilidade = []
    const probabilidadeAntes = []
    const probabilidadeDepois = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      reducaoProbabilidade.push(metrica.reducaoProbabilidade || 0)
      probabilidadeAntes.push(metrica.probabilidadeAtual || 0)
      probabilidadeDepois.push(metrica.probabilidadeComIA || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Probabilidade Antes (%)',
          data: probabilidadeAntes,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          yAxisID: 'y'
        },
        {
          label: 'Probabilidade Depois (%)',
          data: probabilidadeDepois,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          yAxisID: 'y'
        }
      ]
    }
  }, [metricas])

  // Gráfico 2: Valor do Risco Evitado e Economia em Mitigação
  const dadosValorEconomia = useMemo(() => {
    const labels = []
    const valorRiscoEvitado = []
    const economiaMitigacaoAnual = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      valorRiscoEvitado.push(metrica.valorRiscoEvitado || 0)
      economiaMitigacaoAnual.push((metrica.economiaMitigacao || 0) * 12)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Valor do Risco Evitado (R$)',
          data: valorRiscoEvitado,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          label: 'Economia Mitigação Anual (R$)',
          data: economiaMitigacaoAnual,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 3: ROI e Custo vs Benefício
  const dadosROICusto = useMemo(() => {
    const labels = []
    const roi = []
    const custoVsBeneficio = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      roi.push(metrica.roiReducaoRisco || 0)
      custoVsBeneficio.push(metrica.custoVsBeneficio || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'ROI (%)',
          data: roi,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          yAxisID: 'y'
        },
        {
          label: 'Custo vs Benefício (x)',
          data: custoVsBeneficio,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          yAxisID: 'y1'
        }
      ]
    }
  }, [metricas])

  return (
    <div className="space-y-6">
      {/* Cards com as 6 Métricas Solicitadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Redução de Probabilidade */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Redução de Probabilidade</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {reducaoProbabilidadeMedia > 0 ? '-' : ''}{Math.abs(reducaoProbabilidadeMedia).toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Média de redução de risco
            </p>
          </div>
        </Card>

        {/* 2. Valor do Risco Evitado */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Valor do Risco Evitado</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatarMoeda(totalValorRiscoEvitado)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total consolidado
            </p>
          </div>
        </Card>

        {/* 3. Economia em Mitigação */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia em Mitigação</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatarMoeda(totalEconomiaMitigacao)}/mês
            </p>
            <p className="text-sm font-semibold text-purple-500 dark:text-purple-300 mt-1">
              {formatarMoeda(totalEconomiaMitigacao * 12)}/ano
            </p>
          </div>
        </Card>

        {/* 4. Benefício Anual */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Benefício Anual</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatarMoeda(totalBeneficioAnual)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Economia + Risco evitado
            </p>
          </div>
        </Card>

        {/* 5. Custo vs Benefício */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Custo vs Benefício</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {custoVsBeneficioMedio > 0 ? custoVsBeneficioMedio.toFixed(2) : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {custoVsBeneficioMedio > 1 ? `${custoVsBeneficioMedio.toFixed(2)}x de retorno` : 'Razão benefício/custo'}
            </p>
          </div>
        </Card>

        {/* 6. ROI da Redução de Risco */}
        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ROI da Redução de Risco</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {roiMedio > 0 ? '+' : ''}{roiMedio.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Retorno sobre investimento
            </p>
          </div>
        </Card>

        {/* Info adicional: Custo de Implementação */}
        <Card className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Custo Implementação</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
              {formatarMoeda(totalCustoImplementacao)}
            </p>
          </div>
        </Card>

        {/* Info adicional: Número de Indicadores */}
        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Indicadores</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metricas.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico 1: Probabilidade Antes vs Depois */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Redução de Probabilidade de Ocorrência
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comparação entre probabilidade antes e depois da implementação da IA
            </p>
          </div>
          <i className="fas fa-chart-bar text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosReducaoProbabilidade} />
      </Card>

      {/* Gráfico 2: Valor do Risco Evitado e Economia em Mitigação */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Valor do Risco Evitado e Economia Anual em Mitigação
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Benefícios financeiros da redução de risco
            </p>
          </div>
          <i className="fas fa-shield-alt text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosValorEconomia} />
      </Card>

      {/* Gráfico 3: ROI e Custo vs Benefício */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              ROI e Custo vs Benefício
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Retorno financeiro da implementação de IA
            </p>
          </div>
          <i className="fas fa-chart-line text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosROICusto} />
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
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Red. Prob. (%)</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Risco Evitado</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Econ. Mitigação</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Benefício Anual</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">C vs B</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">ROI</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((metrica, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-slate-900 dark:text-white font-medium">{metrica.nome || 'Indicador'}</td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {metrica.reducaoProbabilidade > 0 ? '-' : ''}{Math.abs(metrica.reducaoProbabilidade || 0).toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    {formatarMoeda(metrica.valorRiscoEvitado || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">
                    {formatarMoeda(metrica.economiaMitigacao || 0)}/mês
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                    {formatarMoeda(metrica.beneficioAnual || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400">
                    {metrica.custoVsBeneficio > 0 ? metrica.custoVsBeneficio.toFixed(2) : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-semibold">
                    {metrica.roiReducaoRisco > 0 ? '+' : ''}{metrica.roiReducaoRisco?.toFixed(1)}%
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

export default ReducaoRiscoCharts

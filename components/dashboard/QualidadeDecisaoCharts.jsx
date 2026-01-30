import React, { useMemo } from 'react'
import Card from '../common/Card'
import BarChart from '../charts/BarChart'
import { formatarMoeda } from '../../utils/formatters'

/**
 * Componente que renderiza gráficos específicos para indicadores de QUALIDADE DECISÃO
 */
const QualidadeDecisaoCharts = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Totais consolidados
  const totalEconomiaErrosEvitados = metricas.reduce((sum, m) => sum + (m.economiaErrosEvitados || 0), 0)
  const totalEconomiaTempo = metricas.reduce((sum, m) => sum + (m.economiaTempo || 0), 0)
  const totalValorTempoEconomizado = metricas.reduce((sum, m) => sum + (m.valorTempoEconomizado || 0), 0)
  const totalBeneficioMensal = metricas.reduce((sum, m) => sum + (m.beneficioTotalMensal || 0), 0)
  const totalCustoImplementacao = metricas.reduce((sum, m) => sum + (m.custoImplementacao || 0), 0)
  
  const melhoriaTaxaAcertoMedia = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.melhoriaTaxaAcerto || 0), 0) / metricas.length
    : 0
  
  const roiMedio = totalCustoImplementacao > 0
    ? (((totalBeneficioMensal * 12) - totalCustoImplementacao) / totalCustoImplementacao) * 100
    : 0

  // Gráfico 1: Taxa de Acerto - Antes vs Depois
  const dadosTaxaAcerto = useMemo(() => {
    const labels = []
    const taxaAntes = []
    const taxaDepois = []

    metricas.forEach(metrica => {
      labels.push(metrica.name || metrica.nome || 'Indicador')
      taxaAntes.push(metrica.taxaAcertoAtual || 0)
      taxaDepois.push(metrica.taxaAcertoComIA || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Taxa de Acerto Antes (%)',
          data: taxaAntes,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Taxa de Acerto com IA (%)',
          data: taxaDepois,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 2: Economias - Erros Evitados e Tempo
  const dadosEconomias = useMemo(() => {
    const labels = []
    const economiaErros = []
    const valorTempo = []

    metricas.forEach(metrica => {
      labels.push(metrica.name || metrica.nome || 'Indicador')
      economiaErros.push(metrica.economiaErrosEvitados || 0)
      valorTempo.push(metrica.valorTempoEconomizado || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Economia com Erros Evitados (R$)',
          data: economiaErros,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          label: 'Valor do Tempo Economizado (R$)',
          data: valorTempo,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 3: Benefício Total e ROI
  const dadosBeneficioROI = useMemo(() => {
    const labels = []
    const beneficio = []
    const roi = []

    metricas.forEach(metrica => {
      labels.push(metrica.name || metrica.nome || 'Indicador')
      beneficio.push(metrica.beneficioTotalMensal || 0)
      roi.push(metrica.roiMelhoria || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Benefício Total Mensal (R$)',
          data: beneficio,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          yAxisID: 'y'
        },
        {
          label: 'ROI (%)',
          data: roi,
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
        {/* 1. Melhoria na Taxa de Acerto */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Melhoria na Taxa de Acerto</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {melhoriaTaxaAcertoMedia > 0 ? '+' : ''}{melhoriaTaxaAcertoMedia.toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aumento médio na assertividade
            </p>
          </div>
        </Card>

        {/* 2. Economia com Erros Evitados */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia com Erros Evitados</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatarMoeda(totalEconomiaErrosEvitados)}/mês
            </p>
            <p className="text-sm font-semibold text-blue-500 dark:text-blue-300 mt-1">
              {formatarMoeda(totalEconomiaErrosEvitados * 12)}/ano
            </p>
          </div>
        </Card>

        {/* 3. Economia de Tempo */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia de Tempo</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalEconomiaTempo.toFixed(1)}h/mês
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Horas economizadas mensalmente
            </p>
          </div>
        </Card>

        {/* 4. Valor do Tempo Economizado */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Valor do Tempo Economizado</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatarMoeda(totalValorTempoEconomizado)}/mês
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Valor financeiro do tempo poupado
            </p>
          </div>
        </Card>

        {/* 5. Benefício Total Mensal */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Benefício Total Mensal</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatarMoeda(totalBeneficioMensal)}
            </p>
            <p className="text-sm font-semibold text-cyan-500 dark:text-cyan-300 mt-1">
              {formatarMoeda(totalBeneficioMensal * 12)}/ano
            </p>
          </div>
        </Card>

        {/* 6. ROI da Melhoria */}
        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ROI da Melhoria</p>
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

      {/* Gráfico 1: Taxa de Acerto Antes vs Depois */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Taxa de Acerto: Antes vs Com IA
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comparação da assertividade nas decisões
            </p>
          </div>
          <i className="fas fa-check-circle text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosTaxaAcerto} />
      </Card>

      {/* Gráfico 2: Economias */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Economias: Erros Evitados e Tempo Poupado
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Benefícios financeiros da melhoria na qualidade de decisão
            </p>
          </div>
          <i className="fas fa-coins text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosEconomias} />
      </Card>

      {/* Gráfico 3: Benefício Total e ROI */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Benefício Total Mensal e ROI
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Retorno financeiro das decisões mais assertivas
            </p>
          </div>
          <i className="fas fa-chart-line text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosBeneficioROI} />
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
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Melhoria (%)</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Econ. Erros</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Econ. Tempo</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Valor Tempo</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Benef. Total</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">ROI</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((metrica, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-slate-900 dark:text-white font-medium">{metrica.name || metrica.nome || 'Indicador'}</td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {metrica.melhoriaTaxaAcerto > 0 ? '+' : ''}{metrica.melhoriaTaxaAcerto?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    {formatarMoeda(metrica.economiaErrosEvitados || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">
                    {metrica.economiaTempo?.toFixed(1)}h
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">
                    {formatarMoeda(metrica.valorTempoEconomizado || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400 font-semibold">
                    {formatarMoeda(metrica.beneficioTotalMensal || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-semibold">
                    {metrica.roiMelhoria > 0 ? '+' : ''}{metrica.roiMelhoria?.toFixed(1)}%
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

export default QualidadeDecisaoCharts

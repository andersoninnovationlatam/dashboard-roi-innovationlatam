import React, { useMemo } from 'react'
import Card from '../common/Card'
import BarChart from '../charts/BarChart'
import { formatarMoeda } from '../../utils/formatters'

/**
 * Componente que renderiza gráficos específicos para indicadores de VELOCIDADE
 */
const VelocidadeCharts = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Totais consolidados
  const totalEconomiaAtrasos = metricas.reduce((sum, m) => sum + (m.economiaAtrasos || 0), 0)
  const totalValorTempoEconomizado = metricas.reduce((sum, m) => sum + (m.valorTempoEconomizado || 0), 0)
  const totalAumentoCapacidade = metricas.reduce((sum, m) => sum + (m.aumentoCapacidade || 0), 0)
  const totalCustoImplementacao = metricas.reduce((sum, m) => sum + (m.custoImplementacao || 0), 0)
  
  const reducaoTempoMedia = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.reducaoTempoEntrega || 0), 0) / metricas.length
    : 0
  
  const ganhoProdutividadeMedia = metricas.length > 0
    ? metricas.reduce((sum, m) => sum + (m.ganhoProdutividade || 0), 0) / metricas.length
    : 0
  
  const beneficioTotal = totalEconomiaAtrasos + totalValorTempoEconomizado
  const roiMedio = totalCustoImplementacao > 0
    ? (((beneficioTotal * 12) - totalCustoImplementacao) / totalCustoImplementacao) * 100
    : 0

  // Gráfico 1: Tempo de Entrega - Antes vs Depois
  const dadosTempoEntrega = useMemo(() => {
    const labels = []
    const tempoAntes = []
    const tempoDepois = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      
      // Converter para horas para padronização
      const tempoAntesHoras = metrica.unidadeTempoEntrega === 'dias' 
        ? metrica.tempoMedioEntregaAtual * 24 
        : metrica.tempoMedioEntregaAtual
      
      const tempoDepoisHoras = metrica.unidadeTempoEntregaComIA === 'dias'
        ? metrica.tempoMedioEntregaComIA * 24
        : metrica.tempoMedioEntregaComIA
      
      tempoAntes.push(tempoAntesHoras)
      tempoDepois.push(tempoDepoisHoras)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Tempo Antes (horas)',
          data: tempoAntes,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Tempo com IA (horas)',
          data: tempoDepois,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 2: Capacidade - Antes vs Depois
  const dadosCapacidade = useMemo(() => {
    const labels = []
    const capacidadeAntes = []
    const capacidadeDepois = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      capacidadeAntes.push(metrica.entregasMensalBaseline || 0)
      capacidadeDepois.push(metrica.entregasMensalComIA || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Entregas/mês Antes',
          data: capacidadeAntes,
          backgroundColor: 'rgba(251, 146, 60, 0.8)'
        },
        {
          label: 'Entregas/mês com IA',
          data: capacidadeDepois,
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        }
      ]
    }
  }, [metricas])

  // Gráfico 3: Benefícios Financeiros
  const dadosBeneficios = useMemo(() => {
    const labels = []
    const economiaAtrasos = []
    const valorTempo = []

    metricas.forEach(metrica => {
      labels.push(metrica.nome || 'Indicador')
      economiaAtrasos.push(metrica.economiaAtrasos || 0)
      valorTempo.push(metrica.valorTempoEconomizado || 0)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Economia com Atrasos (R$)',
          data: economiaAtrasos,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          label: 'Valor Tempo Economizado (R$)',
          data: valorTempo,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        }
      ]
    }
  }, [metricas])

  return (
    <div className="space-y-6">
      {/* Cards com as 6 Métricas Solicitadas + 2 Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Redução de Tempo de Entrega */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Redução Tempo Entrega</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {reducaoTempoMedia.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Média de redução
            </p>
          </div>
        </Card>

        {/* 2. Aumento de Capacidade */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Aumento de Capacidade</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalAumentoCapacidade > 0 ? '+' : ''}{totalAumentoCapacidade.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              entregas/mês a mais
            </p>
          </div>
        </Card>

        {/* 3. Economia com Redução de Atrasos */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Economia com Atrasos</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatarMoeda(totalEconomiaAtrasos)}/mês
            </p>
            <p className="text-sm font-semibold text-purple-500 dark:text-purple-300 mt-1">
              {formatarMoeda(totalEconomiaAtrasos * 12)}/ano
            </p>
          </div>
        </Card>

        {/* 4. Valor do Tempo Economizado */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Valor Tempo Economizado</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatarMoeda(totalValorTempoEconomizado)}/mês
            </p>
            <p className="text-sm font-semibold text-amber-500 dark:text-amber-300 mt-1">
              {formatarMoeda(totalValorTempoEconomizado * 12)}/ano
            </p>
          </div>
        </Card>

        {/* 5. Ganho de Produtividade */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Ganho de Produtividade</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {ganhoProdutividadeMedia > 0 ? '+' : ''}{ganhoProdutividadeMedia.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aumento médio em entregas
            </p>
          </div>
        </Card>

        {/* 6. ROI da Velocidade */}
        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ROI da Velocidade</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {roiMedio > 0 ? '+' : ''}{roiMedio.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Retorno sobre investimento
            </p>
          </div>
        </Card>

        {/* Info adicional: Benefício Total */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Benefício Total Mensal</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatarMoeda(beneficioTotal)}
            </p>
            <p className="text-sm font-semibold text-emerald-500 dark:text-emerald-300 mt-1">
              {formatarMoeda(beneficioTotal * 12)}/ano
            </p>
          </div>
        </Card>

        {/* Info adicional: Número de Indicadores */}
        <Card className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/20">
          <div className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Indicadores Velocidade</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
              {metricas.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total implementados
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico 1: Tempo de Entrega Antes vs Depois */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Tempo de Entrega: Antes vs Com IA
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comparação do tempo médio de entrega (em horas)
            </p>
          </div>
          <i className="fas fa-clock text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosTempoEntrega} />
      </Card>

      {/* Gráfico 2: Capacidade de Entregas */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Capacidade de Entregas: Antes vs Com IA
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Número de entregas realizadas por mês
            </p>
          </div>
          <i className="fas fa-truck-fast text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosCapacidade} />
      </Card>

      {/* Gráfico 3: Benefícios Financeiros */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Benefícios Financeiros da Velocidade
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Economia com atrasos e valor do tempo economizado
            </p>
          </div>
          <i className="fas fa-sack-dollar text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosBeneficios} />
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
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Redução (%)</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Aumento Cap.</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Econ. Atrasos</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Valor Tempo</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">Ganho Prod.</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">ROI</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((metrica, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-slate-900 dark:text-white font-medium">{metrica.nome || 'Indicador'}</td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 font-semibold">
                    {metrica.reducaoTempoEntrega?.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    {metrica.aumentoCapacidade > 0 ? '+' : ''}{metrica.aumentoCapacidade?.toFixed(0)}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">
                    {formatarMoeda(metrica.economiaAtrasos || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">
                    {formatarMoeda(metrica.valorTempoEconomizado || 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400 font-semibold">
                    {metrica.ganhoProdutividade > 0 ? '+' : ''}{metrica.ganhoProdutividade?.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-semibold">
                    {metrica.roiVelocidade > 0 ? '+' : ''}{metrica.roiVelocidade?.toFixed(1)}%
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

export default VelocidadeCharts

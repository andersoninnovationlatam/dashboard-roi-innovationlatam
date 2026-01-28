import React, { useMemo } from 'react'
import Card from '../common/Card'
import BarChart from '../charts/BarChart'
import LineChart from '../charts/LineChart'
import { formatarMoeda, formatarHoras } from '../../utils/formatters'

/**
 * Componente que renderiza gráficos específicos para indicadores de PRODUTIVIDADE
 */
const ProdutividadeCharts = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Agrupa todas as métricas de produtividade
  const todasMetricas = metricas

  // 1. Gráfico: Horas Economizada para Execução da Tarefa (HH Antes x HH Depois)
  const dadosHorasEconomizadas = useMemo(() => {
    const labels = []
    const hhAntes = []
    const hhDepois = []
    const hhEconomizadas = []

    todasMetricas.forEach(metrica => {
      metrica.horasEconomizadasExecucao.forEach(item => {
        labels.push(`${metrica.indicadorNome} - ${item.pessoa}`)
        hhAntes.push(item.hhAntes)
        hhDepois.push(item.hhDepois)
        hhEconomizadas.push(item.hhEconomizadas)
      })
    })

    return {
      labels,
      datasets: [
        {
          label: 'HH Antes',
          data: hhAntes,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'HH Depois',
          data: hhDepois,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        },
        {
          label: 'HH Economizadas',
          data: hhEconomizadas,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }
      ]
    }
  }, [todasMetricas])

  // 2. Gráfico: Custo de Horas Economizada (HH Antes x Custo HH - HH Depois x Custo da Hora)
  const dadosCustoHorasEconomizadas = useMemo(() => {
    const labels = []
    const custoAntes = []
    const custoDepois = []
    const custoEconomizado = []

    todasMetricas.forEach(metrica => {
      metrica.custoHorasEconomizadas.forEach(item => {
        labels.push(`${metrica.indicadorNome} - ${item.pessoa}`)
        custoAntes.push(item.custoAntes)
        custoDepois.push(item.custoDepois)
        custoEconomizado.push(item.custoEconomizado)
      })
    })

    return {
      labels,
      datasets: [
        {
          label: 'Custo Antes (R$)',
          data: custoAntes,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Custo Depois (R$)',
          data: custoDepois,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        },
        {
          label: 'Custo Economizado (R$)',
          data: custoEconomizado,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }
      ]
    }
  }, [todasMetricas])

  // 3. Gráfico: Tempo Economizado para Realização da Atividade Considerando a Frequência que a tarefa deveria ser feita
  const dadosTempoEconomizadoFrequenciaDesejada = useMemo(() => {
    const labels = []
    const hhAntesDesejada = []
    const hhDepoisDesejada = []
    const hhEconomizadasDesejada = []

    todasMetricas.forEach(metrica => {
      metrica.tempoEconomizadoFrequenciaDesejada.forEach(item => {
        labels.push(`${metrica.indicadorNome} - ${item.pessoa}`)
        hhAntesDesejada.push(item.hhAntesDesejada)
        hhDepoisDesejada.push(item.hhDepoisDesejada)
        hhEconomizadasDesejada.push(item.hhEconomizadasDesejada)
      })
    })

    return {
      labels,
      datasets: [
        {
          label: 'HH Antes (Freq. Desejada)',
          data: hhAntesDesejada,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'HH Depois (Freq. Desejada)',
          data: hhDepoisDesejada,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        },
        {
          label: 'HH Economizadas (Freq. Desejada)',
          data: hhEconomizadasDesejada,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        }
      ]
    }
  }, [todasMetricas])

  // 4. Gráfico: Custo de Horas Economizada para Realização da Atividade Considerando a Frequência que a tarefa deveria ser feita
  const dadosCustoHorasEconomizadasFrequenciaDesejada = useMemo(() => {
    const labels = []
    const custoAntesDesejada = []
    const custoDepoisDesejada = []
    const custoEconomizadoDesejada = []

    todasMetricas.forEach(metrica => {
      metrica.custoHorasEconomizadasFrequenciaDesejada.forEach(item => {
        labels.push(`${metrica.indicadorNome} - ${item.pessoa}`)
        custoAntesDesejada.push(item.custoAntesDesejada)
        custoDepoisDesejada.push(item.custoDepoisDesejada)
        custoEconomizadoDesejada.push(item.custoEconomizadoDesejada)
      })
    })

    return {
      labels,
      datasets: [
        {
          label: 'Custo Antes - Freq. Desejada (R$)',
          data: custoAntesDesejada,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        },
        {
          label: 'Custo Depois - Freq. Desejada (R$)',
          data: custoDepoisDesejada,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        },
        {
          label: 'Custo Economizado - Freq. Desejada (R$)',
          data: custoEconomizadoDesejada,
          backgroundColor: 'rgba(168, 85, 247, 0.8)'
        }
      ]
    }
  }, [todasMetricas])

  // Totais consolidados
  const totalHorasEconomizadas = todasMetricas.reduce((sum, m) => sum + (m.totalHorasEconomizadas || 0), 0)
  const totalCustoEconomizado = todasMetricas.reduce((sum, m) => sum + (m.totalCustoEconomizado || 0), 0)
  const totalHorasEconomizadasDesejada = todasMetricas.reduce((sum, m) => sum + (m.totalHorasEconomizadasDesejada || 0), 0)
  const totalCustoEconomizadoDesejada = todasMetricas.reduce((sum, m) => sum + (m.totalCustoEconomizadoDesejada || 0), 0)

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Horas Economizadas</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatarHoras(totalHorasEconomizadas)}
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Custo Economizado</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatarMoeda(totalCustoEconomizado)}
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">HH Economizadas (Freq. Desejada)</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatarHoras(totalHorasEconomizadasDesejada)}
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Custo Economizado (Freq. Desejada)</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatarMoeda(totalCustoEconomizadoDesejada)}
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico 1: Horas Economizada para Execução da Tarefa */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Horas Economizada para Execução da Tarefa
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comparação entre HH Antes e HH Depois
            </p>
          </div>
          <i className="fas fa-chart-bar text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosHorasEconomizadas} />
      </Card>

      {/* Gráfico 2: Custo de Horas Economizada */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Custo de Horas Economizada
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              HH Antes × Custo HH - HH Depois × Custo da Hora
            </p>
          </div>
          <i className="fas fa-dollar-sign text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosCustoHorasEconomizadas} />
      </Card>

      {/* Gráfico 3: Tempo Economizado (Frequência Desejada) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Tempo Economizado (Frequência Desejada)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Considerando a frequência que a tarefa deveria ser feita
            </p>
          </div>
          <i className="fas fa-clock text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosTempoEconomizadoFrequenciaDesejada} />
      </Card>

      {/* Gráfico 4: Custo de Horas Economizada (Frequência Desejada) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Custo de Horas Economizada (Frequência Desejada)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Considerando a frequência que a tarefa deveria ser feita
            </p>
          </div>
          <i className="fas fa-chart-line text-slate-400 text-2xl"></i>
        </div>
        <BarChart data={dadosCustoHorasEconomizadasFrequenciaDesejada} />
      </Card>
    </div>
  )
}

export default ProdutividadeCharts

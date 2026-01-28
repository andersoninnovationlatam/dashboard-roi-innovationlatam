import React from 'react'
import Card from '../common/Card'
import { formatarMoeda } from '../../utils/formatters'

/**
 * Componente que renderiza card/gráfico específico para indicadores de INCREMENTO RECEITA
 */
const IncrementoReceitaCard = ({ metricas }) => {
  if (!metricas || metricas.length === 0) {
    return null
  }

  // Calcula totais
  const totalReceitaAntes = metricas.reduce((sum, m) => sum + (m.valorReceitaAntes || 0), 0)
  const totalReceitaDepois = metricas.reduce((sum, m) => sum + (m.valorReceitaDepois || 0), 0)
  const totalDeltaReceita = metricas.reduce((sum, m) => sum + (m.deltaReceita || 0), 0)

  return (
    <div className="space-y-6">
      {/* Card de Resumo Total */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Incremento de Receita - Resumo Geral
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Comparação entre Receita Antes e Depois da implementação
              </p>
            </div>
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-chart-line text-3xl text-green-600 dark:text-green-400"></i>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Receita Antes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatarMoeda(totalReceitaAntes)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Receita Depois</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatarMoeda(totalReceitaDepois)}
              </p>
            </div>

            <div className={`bg-white dark:bg-slate-800 rounded-lg p-4 border-2 ${
              totalDeltaReceita >= 0 
                ? 'border-green-500 dark:border-green-400' 
                : 'border-red-500 dark:border-red-400'
            }`}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Delta Receita</p>
              <p className={`text-2xl font-bold ${
                totalDeltaReceita >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatarMoeda(totalDeltaReceita)}
              </p>
              {totalDeltaReceita >= 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  Incremento positivo
                </p>
              )}
              {totalDeltaReceita < 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  <i className="fas fa-arrow-down mr-1"></i>
                  Redução de receita
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Cards individuais por indicador */}
      {metricas.map((metrica, index) => (
        <Card key={index}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {metrica.indicadorNome}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Delta Receita: {formatarMoeda(metrica.deltaReceita)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-dollar-sign text-green-600 dark:text-green-400"></i>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Receita Antes</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatarMoeda(metrica.valorReceitaAntes)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Receita Depois</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatarMoeda(metrica.valorReceitaDepois)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Delta Receita (Depois - Antes):
              </span>
              <span className={`text-xl font-bold ${
                metrica.deltaReceita >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatarMoeda(metrica.deltaReceita)}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default IncrementoReceitaCard

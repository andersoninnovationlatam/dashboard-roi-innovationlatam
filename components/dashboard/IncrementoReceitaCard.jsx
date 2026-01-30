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

  // Se há apenas uma métrica, usa valores individuais; senão calcula totais
  const isSingle = metricas.length === 1
  const metrica = isSingle ? metricas[0] : null
  
  const totalReceitaAntes = isSingle 
    ? (metrica?.valorReceitaAntes || 0)
    : metricas.reduce((sum, m) => sum + (m.valorReceitaAntes || 0), 0)
  const totalReceitaDepois = isSingle
    ? (metrica?.valorReceitaDepois || 0)
    : metricas.reduce((sum, m) => sum + (m.valorReceitaDepois || 0), 0)
  const totalDeltaReceita = isSingle
    ? (metrica?.deltaReceita || 0)
    : metricas.reduce((sum, m) => sum + (m.deltaReceita || 0), 0)

  const titulo = isSingle 
    ? `${metrica?.indicadorNome || 'Incremento de Receita'}`
    : 'Incremento de Receita - Resumo Geral'

  return (
    <div className="space-y-6">
      {/* Card de Resumo */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {titulo}
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

            <div className={`bg-white dark:bg-slate-800 rounded-lg p-4 border-2 ${totalDeltaReceita >= 0
                ? 'border-green-500 dark:border-green-400'
                : 'border-red-500 dark:border-red-400'
              }`}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Delta Receita</p>
              <p className={`text-2xl font-bold ${totalDeltaReceita >= 0
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


    </div>
  )
}

export default IncrementoReceitaCard

/**
 * Exemplo de uso do componente IndicatorSelector
 */

import { IndicatorSelector } from './IndicatorSelector'
import { useState } from 'react'

export const IndicatorSelectorExample = () => {
  const [indicatorData, setIndicatorData] = useState({
    category: '' as const,
    name: '',
    baselineValue: '',
  })

  const handleChange = (value: {
    category: string
    name: string
    baselineValue: string
  }) => {
    setIndicatorData(value)
    console.log('Dados do indicador:', value)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
        Seletor de Indicador
      </h2>
      
      <IndicatorSelector
        value={indicatorData}
        onChange={handleChange}
      />

      {/* Exemplo de exibição dos dados */}
      <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">
          Dados Selecionados:
        </h3>
        <pre className="text-sm text-slate-600 dark:text-slate-400">
          {JSON.stringify(indicatorData, null, 2)}
        </pre>
      </div>
    </div>
  )
}

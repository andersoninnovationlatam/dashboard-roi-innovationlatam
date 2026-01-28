/**
 * Exemplo de uso do componente BaselineForm
 */

import { BaselineForm } from './BaselineForm'
import { useBaseline } from '../../hooks/useBaseline'
import { BaselineData } from '../../types/baseline'
import { useState } from 'react'

export const BaselineFormExample = () => {
  const indicatorId = 'indicator-123' // ID do indicador no Supabase
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null)

  const { saveBaseline, loading, error } = useBaseline({
    indicatorId,
    onSuccess: () => {
      console.log('Baseline salvo com sucesso!')
      alert('Baseline salvo com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao salvar:', error)
      alert(`Erro: ${error.message}`)
    }
  })

  const handleSubmit = async (data: BaselineData) => {
    try {
      await saveBaseline(data)
    } catch (err) {
      // Erro já é tratado no onError do hook
      console.error(err)
    }
  }

  const handleChange = (data: BaselineData) => {
    setBaselineData(data)
    console.log('Dados atualizados:', data)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
        Formulário de Baseline
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          <strong>Erro:</strong> {error.message}
        </div>
      )}

      <BaselineForm
        value={baselineData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      {/* Preview dos dados (opcional, para debug) */}
      {baselineData && (
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Preview dos Dados:
          </h3>
          <pre className="text-sm text-slate-600 dark:text-slate-400 overflow-auto">
            {JSON.stringify(baselineData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

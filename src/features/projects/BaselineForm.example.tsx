/**
 * Exemplo de uso do componente BaselineForm
 * ATUALIZADO: Agora usa a estrutura normalizada via indicatorServiceSupabase
 */

import { BaselineForm } from './BaselineForm'
import { BaselineData } from '../../types/baseline'
import { useState } from 'react'

export const BaselineFormExample = () => {
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = async (data: BaselineData) => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Integrar com indicatorServiceSupabase para salvar dados normalizados
      // Por enquanto, apenas demonstra o uso do componente
      console.log('Dados do baseline:', data)
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Baseline salvo com sucesso!')
      alert('Baseline salvo com sucesso!')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao salvar baseline')
      setError(error)
      console.error('Erro ao salvar:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
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

      {loading && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200">
          Salvando...
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

/**
 * Componente de Indicador de Incremento Receita
 * Gerencia Baseline e Pós-IA para indicadores de incremento de receita
 */

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

const IndicatorIncrementoReceita = ({ 
  indicatorId, 
  baselineData, 
  postIAData, 
  onBaselineChange, 
  onPostIAChange,
  mode = 'baseline' // 'baseline' ou 'postia'
}) => {
  const [baselineReceita, setBaselineReceita] = useState(0)
  const [postIAReceita, setPostIAReceita] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (baselineData && baselineData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaAntes' in baselineData) {
      setBaselineReceita(baselineData.valorReceitaAntes || 0)
    }
    if (postIAData && postIAData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaDepois' in postIAData) {
      setPostIAReceita(postIAData.valorReceitaDepois || 0)
    }
  }, [baselineData, postIAData])

  const formatNumberValue = (value) => {
    if (value === null || value === undefined) return ''
    if (value === 0) return '0'
    return value.toString().replace(/^0+/, '')
  }

  const handleBaselineChange = (value) => {
    setBaselineReceita(value)
    if (onBaselineChange) {
      onBaselineChange({
        tipo: 'INCREMENTO RECEITA',
        valorReceitaAntes: value
      })
    }
  }

  const handlePostIAChange = (value) => {
    setPostIAReceita(value)
    const delta = value - baselineReceita
    if (onPostIAChange) {
      onPostIAChange({
        tipo: 'INCREMENTO RECEITA',
        valorReceitaDepois: value,
        deltaReceita: delta
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600 dark:text-slate-400">Carregando...</div>
      </div>
    )
  }

  // Renderizar apenas o conteúdo baseado no mode
  if (mode === 'baseline') {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
          Valor da Receita Antes (R$)
        </label>
        <input
          type="number"
          step="0.01"
          value={formatNumberValue(baselineReceita)}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
            handleBaselineChange(val)
          }}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="0.00"
        />
      </div>
    )
  }

  // Pós-IA mode
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
      <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
        Valor da Receita Depois (R$)
      </label>
      <input
        type="number"
        step="0.01"
        value={formatNumberValue(postIAReceita)}
        onChange={(e) => {
          const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
          handlePostIAChange(val)
        }}
        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="0.00"
      />

      {baselineReceita > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 dark:text-white">
              Delta Receita:
            </span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              R$ {(postIAReceita - baselineReceita).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Receita Depois - Receita Antes
          </p>
        </div>
      )}
    </div>
  )
}

export default IndicatorIncrementoReceita

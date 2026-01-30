/**
 * Componente de Indicador de Melhoria Margem
 * Gerencia Baseline e Pós-IA para indicadores de melhoria de margem
 */

import { useState, useEffect } from 'react'

const IndicatorMelhoriaMargem = ({ 
  indicatorId, 
  baselineData, 
  postIAData, 
  onBaselineChange, 
  onPostIAChange,
  mode = 'baseline' // 'baseline' ou 'postia'
}) => {
  const [baseline, setBaseline] = useState({
    receitaBrutaMensal: 0,
    custoTotalMensal: 0,
    margemBrutaAtual: 0,
    volumeTransacoes: 0
  })
  const [postIA, setPostIA] = useState({
    receitaBrutaMensalEstimada: 0,
    custoTotalMensalEstimado: 0,
    margemBrutaEstimada: 0,
    volumeTransacoesEstimado: 0
  })

  useEffect(() => {
    if (baselineData && baselineData.tipo === 'MELHORIA MARGEM') {
      setBaseline({
        receitaBrutaMensal: baselineData.receitaBrutaMensal || 0,
        custoTotalMensal: baselineData.custoTotalMensal || 0,
        margemBrutaAtual: baselineData.margemBrutaAtual || 0,
        volumeTransacoes: baselineData.volumeTransacoes || 0
      })
    }
    if (postIAData && postIAData.tipo === 'MELHORIA MARGEM') {
      setPostIA({
        receitaBrutaMensalEstimada: postIAData.receitaBrutaMensalEstimada || 0,
        custoTotalMensalEstimado: postIAData.custoTotalMensalEstimado || 0,
        margemBrutaEstimada: postIAData.margemBrutaEstimada || 0,
        volumeTransacoesEstimado: postIAData.volumeTransacoesEstimado || 0
      })
    }
  }, [baselineData, postIAData])

  const formatNumberValue = (value) => {
    if (value === null || value === undefined) return ''
    if (value === 0) return '0'
    return value.toString().replace(/^0+/, '')
  }

  const calculateMetrics = () => {
    const deltaMargem = postIA.margemBrutaEstimada - baseline.margemBrutaAtual
    const lucroBrutoBaseline = baseline.receitaBrutaMensal - baseline.custoTotalMensal
    const lucroBrutoEstimado = postIA.receitaBrutaMensalEstimada - postIA.custoTotalMensalEstimado
    const deltaMargemReais = lucroBrutoEstimado - lucroBrutoBaseline
    const economiaMensal = deltaMargemReais
    const economiaAnual = economiaMensal * 12

    return { deltaMargem, deltaMargemReais, economiaMensal, economiaAnual }
  }

  const handleBaselineChange = (field, value) => {
    const updated = { ...baseline, [field]: value }
    setBaseline(updated)
    if (onBaselineChange) {
      onBaselineChange({
        tipo: 'MELHORIA MARGEM',
        ...updated
      })
    }
  }

  const handlePostIAChange = (field, value) => {
    const updated = { ...postIA, [field]: value }
    setPostIA(updated)
    const metrics = calculateMetrics()
    if (onPostIAChange) {
      onPostIAChange({
        tipo: 'MELHORIA MARGEM',
        ...updated,
        ...metrics
      })
    }
  }

  const metrics = calculateMetrics()

  // Renderizar apenas o conteúdo baseado no mode
  if (mode === 'baseline') {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Dados de Baseline - Melhoria de Margem
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Receita Bruta Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formatNumberValue(baseline.receitaBrutaMensal)}
              onChange={(e) => handleBaselineChange('receitaBrutaMensal', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Custo Total Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formatNumberValue(baseline.custoTotalMensal)}
              onChange={(e) => handleBaselineChange('custoTotalMensal', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Margem Bruta Atual (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formatNumberValue(baseline.margemBrutaAtual)}
              onChange={(e) => handleBaselineChange('margemBrutaAtual', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Volume de Transações/Mês
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={formatNumberValue(baseline.volumeTransacoes)}
              onChange={(e) => handleBaselineChange('volumeTransacoes', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    )
  }

  // Pós-IA mode
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Dados Pós-IA - Melhoria de Margem
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Receita Bruta Mensal Estimada (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={formatNumberValue(postIA.receitaBrutaMensalEstimada)}
            onChange={(e) => handlePostIAChange('receitaBrutaMensalEstimada', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Custo Total Mensal Estimado (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={formatNumberValue(postIA.custoTotalMensalEstimado)}
            onChange={(e) => handlePostIAChange('custoTotalMensalEstimado', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Margem Bruta Estimada (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formatNumberValue(postIA.margemBrutaEstimada)}
            onChange={(e) => handlePostIAChange('margemBrutaEstimada', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Volume de Transações/Mês Estimado
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formatNumberValue(postIA.volumeTransacoesEstimado)}
            onChange={(e) => handlePostIAChange('volumeTransacoesEstimado', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="0"
          />
        </div>
      </div>

      {baseline.receitaBrutaMensal > 0 && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">
                Delta Margem:
              </span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {metrics.deltaMargem > 0 ? '+' : ''}{metrics.deltaMargem.toFixed(2)}%
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              R$ {metrics.deltaMargemReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Economia Mensal</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                R$ {metrics.economiaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Economia Anual</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                R$ {metrics.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndicatorMelhoriaMargem

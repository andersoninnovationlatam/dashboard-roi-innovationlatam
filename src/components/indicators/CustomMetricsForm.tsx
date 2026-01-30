/**
 * Componente CustomMetricsForm
 * Formulário para métricas customizadas (aparece apenas para tipos específicos)
 */

import React, { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { CustomMetric, ImprovementType } from '../../../src/types'

interface CustomMetricsFormProps {
  metrics: CustomMetric[]
  improvementType: ImprovementType
  onChange: (metrics: CustomMetric[]) => void
  disabled?: boolean
}

// Tipos de melhoria que usam métricas customizadas
const TYPES_WITH_CUSTOM_METRICS = [
  ImprovementType.ANALYTICAL_CAPACITY,
  ImprovementType.REVENUE_INCREASE,
  ImprovementType.RISK_REDUCTION,
  ImprovementType.DECISION_QUALITY,
  ImprovementType.SATISFACTION
]

export const CustomMetricsForm: React.FC<CustomMetricsFormProps> = ({
  metrics,
  improvementType,
  onChange,
  disabled = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingMetric, setEditingMetric] = useState<Partial<CustomMetric> | null>(null)

  // Não mostrar se o tipo não usa métricas customizadas
  if (!TYPES_WITH_CUSTOM_METRICS.includes(improvementType)) {
    return null
  }

  const handleAdd = () => {
    const newMetric: Partial<CustomMetric> = {
      id: `temp-${Date.now()}`,
      indicator_id: '',
      metric_name: '',
      metric_unit: '',
      baseline_value: 0,
      post_ia_value: 0,
      target_value: null,
      is_higher_better: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setEditingMetric(newMetric)
    setEditingId(newMetric.id!)
  }

  const handleEdit = (metric: CustomMetric) => {
    setEditingMetric({ ...metric })
    setEditingId(metric.id)
  }

  const handleSave = () => {
    if (!editingMetric || !editingId) return

    const updatedMetrics = editingId.startsWith('temp-')
      ? [...metrics, editingMetric as CustomMetric]
      : metrics.map(m => m.id === editingId ? { ...m, ...editingMetric } : m)

    onChange(updatedMetrics as CustomMetric[])
    setEditingId(null)
    setEditingMetric(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingMetric(null)
  }

  const handleDelete = (id: string) => {
    onChange(metrics.filter(m => m.id !== id))
  }

  const handleFieldChange = (field: keyof CustomMetric, value: any) => {
    if (!editingMetric) return
    setEditingMetric({ ...editingMetric, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Métricas Customizadas
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Métrica
          </button>
        )}
      </div>

      {metrics.length === 0 && !editingId && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Nenhuma métrica customizada adicionada. Clique em "Adicionar Métrica" para começar.
        </p>
      )}

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {editingId === metric.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome da Métrica</label>
                    <input
                      type="text"
                      value={editingMetric?.metric_name || ''}
                      onChange={(e) => handleFieldChange('metric_name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Relatórios gerados"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unidade de Medida</label>
                    <input
                      type="text"
                      value={editingMetric?.metric_unit || ''}
                      onChange={(e) => handleFieldChange('metric_unit', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: unidades, %, R$"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor Antes (Baseline)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editingMetric?.baseline_value || 0}
                      onChange={(e) => handleFieldChange('baseline_value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor Depois (Pós-IA)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editingMetric?.post_ia_value || 0}
                      onChange={(e) => handleFieldChange('post_ia_value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta (Opcional)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editingMetric?.target_value || ''}
                      onChange={(e) => handleFieldChange('target_value', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingMetric?.is_higher_better !== false}
                        onChange={(e) => handleFieldChange('is_higher_better', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Maior valor é melhor?</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {metric.metric_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {metric.metric_unit} • Antes: {metric.baseline_value.toFixed(2)} • Depois: {metric.post_ia_value.toFixed(2)}
                    {metric.target_value && (
                      <span> • Meta: {metric.target_value.toFixed(2)}</span>
                    )}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      metric.is_higher_better
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {metric.is_higher_better ? '↑ Maior melhor' : '↓ Menor melhor'}
                    </span>
                  </div>
                </div>
                {!disabled && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(metric)}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(metric.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {editingId && editingId.startsWith('temp-') && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Métrica</label>
                  <input
                    type="text"
                    value={editingMetric?.metric_name || ''}
                    onChange={(e) => handleFieldChange('metric_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Relatórios gerados"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidade de Medida</label>
                  <input
                    type="text"
                    value={editingMetric?.metric_unit || ''}
                    onChange={(e) => handleFieldChange('metric_unit', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: unidades, %, R$"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Antes (Baseline)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editingMetric?.baseline_value || 0}
                    onChange={(e) => handleFieldChange('baseline_value', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Depois (Pós-IA)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editingMetric?.post_ia_value || 0}
                    onChange={(e) => handleFieldChange('post_ia_value', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta (Opcional)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editingMetric?.target_value || ''}
                    onChange={(e) => handleFieldChange('target_value', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Opcional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingMetric?.is_higher_better !== false}
                      onChange={(e) => handleFieldChange('is_higher_better', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Maior valor é melhor?</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

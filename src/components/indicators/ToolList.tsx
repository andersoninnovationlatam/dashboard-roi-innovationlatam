/**
 * Componente ToolList
 * Lista de ferramentas/custos (baseline ou pós-IA)
 */

import React, { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { ToolCost, ScenarioType, ToolCategory } from '../../../src/types'

interface ToolListProps {
  tools: ToolCost[]
  scenario: ScenarioType
  onChange: (tools: ToolCost[]) => void
  disabled?: boolean
}

const TOOL_CATEGORIES = [
  { value: ToolCategory.LLM_API, label: 'API de LLM' },
  { value: ToolCategory.AUTOMATION, label: 'Automação' },
  { value: ToolCategory.ANALYTICS, label: 'BI e Analytics' },
  { value: ToolCategory.DATABASE, label: 'Banco de Dados' },
  { value: ToolCategory.CLOUD_INFRA, label: 'Infraestrutura Cloud' },
  { value: ToolCategory.SAAS, label: 'SaaS' },
  { value: ToolCategory.CUSTOM, label: 'Desenvolvimento Customizado' },
  { value: ToolCategory.OTHER, label: 'Outros' },
]

export const ToolList: React.FC<ToolListProps> = ({
  tools,
  scenario,
  onChange,
  disabled = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTool, setEditingTool] = useState<Partial<ToolCost> | null>(null)

  const handleAdd = () => {
    const newTool: Partial<ToolCost> = {
      id: `temp-${Date.now()}`,
      indicator_id: '',
      scenario,
      tool_name: '',
      tool_category: ToolCategory.OTHER,
      monthly_cost: 0,
      cost_per_execution: null,
      execution_time_seconds: null,
      notes: null,
      created_at: new Date().toISOString()
    }
    setEditingTool(newTool)
    setEditingId(newTool.id!)
  }

  const handleEdit = (tool: ToolCost) => {
    setEditingTool({ ...tool })
    setEditingId(tool.id)
  }

  const handleSave = () => {
    if (!editingTool || !editingId) return

    const updatedTools = editingId.startsWith('temp-')
      ? [...tools, editingTool as ToolCost]
      : tools.map(t => t.id === editingId ? { ...t, ...editingTool } : t)

    onChange(updatedTools as ToolCost[])
    setEditingId(null)
    setEditingTool(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingTool(null)
  }

  const handleDelete = (id: string) => {
    onChange(tools.filter(t => t.id !== id))
  }

  const handleFieldChange = (field: keyof ToolCost, value: any) => {
    if (!editingTool) return
    setEditingTool({ ...editingTool, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {scenario === ScenarioType.BASELINE ? 'Ferramentas Utilizadas (Baseline)' : 'Ferramentas e APIs de IA (Pós-IA)'}
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Ferramenta
          </button>
        )}
      </div>

      {tools.length === 0 && !editingId && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Nenhuma ferramenta adicionada. Clique em "Adicionar Ferramenta" para começar.
        </p>
      )}

      <div className="space-y-3">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {editingId === tool.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome da Ferramenta</label>
                    <input
                      type="text"
                      value={editingTool?.tool_name || ''}
                      onChange={(e) => handleFieldChange('tool_name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: API Gemini, N8N"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <select
                      value={editingTool?.tool_category || ToolCategory.OTHER}
                      onChange={(e) => handleFieldChange('tool_category', e.target.value as ToolCategory)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {TOOL_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Custo Mensal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingTool?.monthly_cost || 0}
                      onChange={(e) => handleFieldChange('monthly_cost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Custo por Execução (R$)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editingTool?.cost_per_execution || ''}
                      onChange={(e) => handleFieldChange('cost_per_execution', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tempo de Execução (seg)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editingTool?.execution_time_seconds || ''}
                      onChange={(e) => handleFieldChange('execution_time_seconds', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <input
                      type="text"
                      value={editingTool?.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value || null)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Opcional"
                    />
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
                    {tool.tool_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {TOOL_CATEGORIES.find(c => c.value === tool.tool_category)?.label || 'Outros'} • 
                    R$ {tool.monthly_cost.toFixed(2)}/mês
                    {tool.cost_per_execution && (
                      <span> • R$ {tool.cost_per_execution.toFixed(4)}/exec</span>
                    )}
                    {tool.execution_time_seconds && (
                      <span> • {tool.execution_time_seconds}s/exec</span>
                    )}
                  </div>
                  {tool.notes && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {tool.notes}
                    </div>
                  )}
                </div>
                {!disabled && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(tool)}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tool.id)}
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
                  <label className="block text-sm font-medium mb-1">Nome da Ferramenta</label>
                  <input
                    type="text"
                    value={editingTool?.tool_name || ''}
                    onChange={(e) => handleFieldChange('tool_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: API Gemini, N8N"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={editingTool?.tool_category || ToolCategory.OTHER}
                    onChange={(e) => handleFieldChange('tool_category', e.target.value as ToolCategory)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {TOOL_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Custo Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingTool?.monthly_cost || 0}
                    onChange={(e) => handleFieldChange('monthly_cost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Custo por Execução (R$)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editingTool?.cost_per_execution || ''}
                    onChange={(e) => handleFieldChange('cost_per_execution', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempo de Execução (seg)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editingTool?.execution_time_seconds || ''}
                    onChange={(e) => handleFieldChange('execution_time_seconds', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Opcional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <input
                    type="text"
                    value={editingTool?.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Opcional"
                  />
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

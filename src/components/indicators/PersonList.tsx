/**
 * Componente PersonList
 * Lista de pessoas envolvidas (baseline ou pós-IA)
 */

import React, { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { PersonInvolved, ScenarioType } from '../../../src/types'

interface PersonListProps {
  persons: PersonInvolved[]
  scenario: ScenarioType
  onChange: (persons: PersonInvolved[]) => void
  disabled?: boolean
}

export const PersonList: React.FC<PersonListProps> = ({
  persons,
  scenario,
  onChange,
  disabled = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<Partial<PersonInvolved> | null>(null)

  const handleAdd = () => {
    const newPerson: Partial<PersonInvolved> = {
      id: `temp-${Date.now()}`,
      indicator_id: '',
      scenario,
      person_name: '',
      role: '',
      hourly_rate: 0,
      time_spent_minutes: 0,
      is_validation_only: scenario === ScenarioType.POST_IA ? false : undefined,
      created_at: new Date().toISOString()
    }
    setEditingPerson(newPerson)
    setEditingId(newPerson.id!)
  }

  const handleEdit = (person: PersonInvolved) => {
    setEditingPerson({ ...person })
    setEditingId(person.id)
  }

  const handleSave = () => {
    if (!editingPerson || !editingId) return

    const updatedPersons = editingId.startsWith('temp-')
      ? [...persons, editingPerson as PersonInvolved]
      : persons.map(p => p.id === editingId ? { ...p, ...editingPerson } : p)

    onChange(updatedPersons as PersonInvolved[])
    setEditingId(null)
    setEditingPerson(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingPerson(null)
  }

  const handleDelete = (id: string) => {
    onChange(persons.filter(p => p.id !== id))
  }

  const handleFieldChange = (field: keyof PersonInvolved, value: any) => {
    if (!editingPerson) return
    setEditingPerson({ ...editingPerson, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {scenario === ScenarioType.BASELINE ? 'Pessoas Envolvidas (Baseline)' : 'Pessoas Envolvidas (Pós-IA)'}
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pessoa
          </button>
        )}
      </div>

      {persons.length === 0 && !editingId && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Nenhuma pessoa adicionada. Clique em "Adicionar Pessoa" para começar.
        </p>
      )}

      <div className="space-y-3">
        {persons.map((person) => (
          <div
            key={person.id}
            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {editingId === person.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome</label>
                    <input
                      type="text"
                      value={editingPerson?.person_name || ''}
                      onChange={(e) => handleFieldChange('person_name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Nome da pessoa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cargo/Função</label>
                    <input
                      type="text"
                      value={editingPerson?.role || ''}
                      onChange={(e) => handleFieldChange('role', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Analista de Dados"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor da Hora (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPerson?.hourly_rate || 0}
                      onChange={(e) => handleFieldChange('hourly_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tempo por Execução (min)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={editingPerson?.time_spent_minutes || 0}
                      onChange={(e) => handleFieldChange('time_spent_minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  {scenario === ScenarioType.POST_IA && (
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingPerson?.is_validation_only || false}
                          onChange={(e) => handleFieldChange('is_validation_only', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Apenas validação?</span>
                      </label>
                    </div>
                  )}
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
                    {person.person_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {person.role} • R$ {person.hourly_rate.toFixed(2)}/h • {person.time_spent_minutes} min/exec
                    {scenario === ScenarioType.POST_IA && person.is_validation_only && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                        Validação
                      </span>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(person)}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(person.id)}
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
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    value={editingPerson?.person_name || ''}
                    onChange={(e) => handleFieldChange('person_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nome da pessoa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cargo/Função</label>
                  <input
                    type="text"
                    value={editingPerson?.role || ''}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Analista de Dados"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor da Hora (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPerson?.hourly_rate || 0}
                    onChange={(e) => handleFieldChange('hourly_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempo por Execução (min)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editingPerson?.time_spent_minutes || 0}
                    onChange={(e) => handleFieldChange('time_spent_minutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                {scenario === ScenarioType.POST_IA && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPerson?.is_validation_only || false}
                        onChange={(e) => handleFieldChange('is_validation_only', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Apenas validação?</span>
                    </label>
                  </div>
                )}
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

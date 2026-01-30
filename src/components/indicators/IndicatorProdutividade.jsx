/**
 * Componente de Indicador de Produtividade
 * Gerencia Baseline e Pós-IA para indicadores de produtividade
 */

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { IndicatorBase } from './IndicatorBase'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

const IndicatorProdutividade = ({ 
  indicatorId, 
  baselineData, 
  postIAData, 
  onBaselineChange, 
  onPostIAChange,
  mode = 'baseline' // 'baseline' ou 'postia'
}) => {
  const [baselinePersons, setBaselinePersons] = useState([])
  const [postIAPersons, setPostIAPersons] = useState([])
  const [loading, setLoading] = useState(false)

  // Inicializar dados
  useEffect(() => {
    if (baselineData && baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData) {
      setBaselinePersons(baselineData.pessoas || [])
    }
    if (postIAData && postIAData.tipo === 'PRODUTIVIDADE' && 'pessoas' in postIAData) {
      setPostIAPersons(postIAData.pessoas || [])
    }
  }, [baselineData, postIAData])

  // Carregar dados do Supabase
  useEffect(() => {
    if (indicatorId && isSupabaseConfigured) {
      loadData()
    }
  }, [indicatorId])

  // Salvar pessoas baseline no Supabase quando mudarem
  useEffect(() => {
    if (indicatorId && isSupabaseConfigured && baselinePersons.length >= 0) {
      IndicatorBase.savePersons(indicatorId, baselinePersons, 'baseline').catch(err => {
        console.error('Erro ao salvar pessoas baseline:', err)
      })
    }
  }, [indicatorId, baselinePersons])

  // Salvar pessoas pós-IA no Supabase quando mudarem
  useEffect(() => {
    if (indicatorId && isSupabaseConfigured && postIAPersons.length >= 0) {
      IndicatorBase.savePersons(indicatorId, postIAPersons, 'post_ia').catch(err => {
        console.error('Erro ao salvar pessoas pós-IA:', err)
      })
    }
  }, [indicatorId, postIAPersons])

  const loadData = async () => {
    if (!indicatorId) return
    
    setLoading(true)
    try {
      const [baseline, postIA] = await Promise.all([
        IndicatorBase.loadPersons(indicatorId, 'baseline'),
        IndicatorBase.loadPersons(indicatorId, 'post_ia')
      ])
      
      if (baseline.length > 0) {
        setBaselinePersons(baseline)
        if (onBaselineChange) {
          onBaselineChange({
            tipo: 'PRODUTIVIDADE',
            pessoas: baseline,
            custoTotalBaseline: calculateBaselineCost(baseline)
          })
        }
      }
      
      if (postIA.length > 0) {
        setPostIAPersons(postIA)
        if (onPostIAChange) {
          onPostIAChange({
            tipo: 'PRODUTIVIDADE',
            pessoas: postIA,
            custoTotalPostIA: calculatePostIACost(postIA)
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumberValue = (value) => {
    if (value === null || value === undefined) return ''
    if (value === 0) return '0'
    return value.toString().replace(/^0+/, '')
  }

  const calcularHorasPorMes = (quantidade, periodo) => {
    switch (periodo) {
      case 'Diário':
        return quantidade * 30
      case 'Semanal':
        return quantidade * 4.33
      case 'Mensal':
        return quantidade
      default:
        return quantidade
    }
  }

  const calculateBaselineCost = (pessoas) => {
    return pessoas.reduce((total, pessoa) => {
      const horasPorMes = calcularHorasPorMes(
        pessoa.frequenciaReal?.quantidade || 0,
        pessoa.frequenciaReal?.periodo || 'Mensal'
      )
      const custoMensal = (pessoa.valorHora * (pessoa.tempoGasto / 60)) * horasPorMes
      return total + custoMensal
    }, 0)
  }

  const calculatePostIACost = (pessoas) => {
    return pessoas.reduce((total, pessoa) => {
      const horasPorMes = calcularHorasPorMes(
        pessoa.frequenciaReal?.quantidade || 0,
        pessoa.frequenciaReal?.periodo || 'Mensal'
      )
      const custoMensal = (pessoa.valorHora * (pessoa.tempoGasto / 60)) * horasPorMes
      return total + custoMensal
    }, 0)
  }

  // Baseline functions
  const addBaselinePerson = () => {
    const novaPessoa = {
      id: `baseline-${Date.now()}`,
      nome: '',
      cargo: '',
      valorHora: 0,
      tempoGasto: 0,
      frequenciaReal: { quantidade: 0, periodo: 'Mensal' },
      frequenciaDesejada: { quantidade: 0, periodo: 'Mensal' }
    }
    const updated = [...baselinePersons, novaPessoa]
    setBaselinePersons(updated)
    const cost = calculateBaselineCost(updated)
    if (onBaselineChange) {
      onBaselineChange({
        tipo: 'PRODUTIVIDADE',
        pessoas: updated,
        custoTotalBaseline: cost
      })
    }
  }

  const removeBaselinePerson = (id) => {
    const updated = baselinePersons.filter(p => p.id !== id)
    setBaselinePersons(updated)
    const cost = calculateBaselineCost(updated)
    if (onBaselineChange) {
      onBaselineChange({
        tipo: 'PRODUTIVIDADE',
        pessoas: updated,
        custoTotalBaseline: cost
      })
    }
  }

  const updateBaselinePerson = (id, field, value) => {
    const updated = baselinePersons.map(p => {
      if (p.id === id) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.')
          return {
            ...p,
            [parent]: {
              ...(p[parent] || {}),
              [child]: value
            }
          }
        }
        return { ...p, [field]: value }
      }
      return p
    })
    setBaselinePersons(updated)
    const cost = calculateBaselineCost(updated)
    if (onBaselineChange) {
      onBaselineChange({
        tipo: 'PRODUTIVIDADE',
        pessoas: updated,
        custoTotalBaseline: cost
      })
    }
  }

  // Post-IA functions
  const addPostIAPerson = () => {
    const novaPessoa = {
      id: `postia-${Date.now()}`,
      nome: '',
      cargo: '',
      valorHora: 0,
      tempoGasto: 0,
      frequenciaReal: { quantidade: 0, periodo: 'Mensal' },
      frequenciaDesejada: { quantidade: 0, periodo: 'Mensal' }
    }
    const updated = [...postIAPersons, novaPessoa]
    setPostIAPersons(updated)
    const cost = calculatePostIACost(updated)
    if (onPostIAChange) {
      onPostIAChange({
        tipo: 'PRODUTIVIDADE',
        pessoas: updated,
        custoTotalPostIA: cost
      })
    }
  }

  const removePostIAPerson = (id) => {
    const updated = postIAPersons.filter(p => p.id !== id)
    setPostIAPersons(updated)
    const cost = calculatePostIACost(updated)
    if (onPostIAChange) {
      onPostIAChange({
        tipo: 'PRODUTIVIDADE',
        pessoas: updated,
        custoTotalPostIA: cost
      })
    }
  }

  const updatePostIAPerson = (id, field, value) => {
    const updated = postIAPersons.map(p => {
      if (p.id === id) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.')
          return {
            ...p,
            [parent]: {
              ...(p[parent] || {}),
              [child]: value
            }
          }
        }
        return { ...p, [field]: value }
      }
      return p
    })
    setPostIAPersons(updated)
    const cost = calculatePostIACost(updated)
    if (onPostIAChange) {
      onPostIAChange({
        tipo: 'PRODUTIVIDADE',
        pessoas: updated,
        custoTotalPostIA: cost
      })
    }
  }

  const renderPersonForm = (person, index, isBaseline, onUpdate, onRemove) => {
    const isManual = person.id?.startsWith('baseline-') || person.id?.startsWith('postia-')
    
    return (
      <div
        key={person.id || index}
        className={`p-4 border rounded-lg ${
          isBaseline
            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-slate-900 dark:text-white">
            {person.nome || `Pessoa ${index + 1}`}
          </h4>
          <button
            type="button"
            onClick={() => onRemove(person.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Nome
            </label>
            <input
              type="text"
              value={person.nome || ''}
              onChange={(e) => onUpdate(person.id, 'nome', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Nome da pessoa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Cargo
            </label>
            <input
              type="text"
              value={person.cargo || ''}
              onChange={(e) => onUpdate(person.id, 'cargo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Cargo/Função"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Valor da Hora (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formatNumberValue(person.valorHora)}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                onUpdate(person.id, 'valorHora', val)
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Tempo Gasto (min) {!isBaseline && <span className="text-green-600 dark:text-green-400">- Pós IA</span>}
            </label>
            <input
              type="number"
              step="0.01"
              value={formatNumberValue(person.tempoGasto)}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                onUpdate(person.id, 'tempoGasto', val)
              }}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                !isBaseline ? 'border-green-300 dark:border-green-600' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="0"
            />
          </div>
        </div>

        {/* Frequências */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Frequência Real
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={formatNumberValue(person.frequenciaReal?.quantidade || 0)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    onUpdate(person.id, 'frequenciaReal.quantidade', val)
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Período
                </label>
                <select
                  value={person.frequenciaReal?.periodo || 'Mensal'}
                  onChange={(e) => onUpdate(person.id, 'frequenciaReal.periodo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Diário">Diário</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Frequência Desejada
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={formatNumberValue(person.frequenciaDesejada?.quantidade || 0)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    onUpdate(person.id, 'frequenciaDesejada.quantidade', val)
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Período
                </label>
                <select
                  value={person.frequenciaDesejada?.periodo || 'Mensal'}
                  onChange={(e) => onUpdate(person.id, 'frequenciaDesejada.periodo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Diário">Diário</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
      <div className="space-y-6">
        {/* Baseline Content */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Pessoas (Baseline)
            </h3>
            <button
              type="button"
              onClick={addBaselinePerson}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar Pessoa
            </button>
          </div>

          {baselinePersons.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
              Nenhuma pessoa adicionada. Clique em "Adicionar Pessoa" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {baselinePersons.map((person, index) =>
                renderPersonForm(person, index, true, updateBaselinePerson, removeBaselinePerson)
              )}
            </div>
          )}

          {baselinePersons.length > 0 && (
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Custo Total Baseline (Mensal):
                </span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  R$ {calculateBaselineCost(baselinePersons).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Pós-IA mode
  return (
    <div className="space-y-6">
      {/* Pós-IA Content */}
      {mode === 'postia' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Pessoas (Baseline)
            </h3>
            <button
              type="button"
              onClick={addBaselinePerson}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar Pessoa
            </button>
          </div>

          {baselinePersons.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
              Nenhuma pessoa adicionada. Clique em "Adicionar Pessoa" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {baselinePersons.map((person, index) =>
                renderPersonForm(person, index, true, updateBaselinePerson, removeBaselinePerson)
              )}
            </div>
          )}

          {baselinePersons.length > 0 && (
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Custo Total Baseline (Mensal):
                </span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  R$ {calculateBaselineCost(baselinePersons).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Pessoas (Pós-IA)
            </h3>
            <button
              type="button"
              onClick={addPostIAPerson}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar Métrica
            </button>
          </div>

          {postIAPersons.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
              Clique em "Adicionar Métrica" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {postIAPersons.map((person, index) =>
                renderPersonForm(person, index, false, updatePostIAPerson, removePostIAPerson)
              )}
            </div>
          )}

          {postIAPersons.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Custo Total Pós-IA (Mensal):
                </span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  R$ {calculatePostIACost(postIAPersons).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IndicatorProdutividade

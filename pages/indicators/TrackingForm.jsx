/**
 * Formulário de Acompanhamento Mensal (Tracking)
 * Permite registrar resultados reais mensais para comparação com projeções
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { trackingService } from '../../services/trackingService'
import { useData } from '../../contexts/DataContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const TrackingForm = () => {
  const { indicatorId } = useParams()
  const navigate = useNavigate()
  const { getTrackingByIndicatorId } = useData()
  
  const [existingTracking, setExistingTracking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      tracking_month: '',
      actual_executions: 0,
      actual_hours_saved: 0,
      actual_cost_ia: 0,
      notes: ''
    }
  })

  useEffect(() => {
    const loadTracking = async () => {
      if (!indicatorId) return
      
      try {
        setLoading(true)
        const tracking = await getTrackingByIndicatorId(indicatorId)
        setExistingTracking(tracking || [])
      } catch (error) {
        console.error('Erro ao carregar tracking:', error)
        setError('Erro ao carregar histórico de acompanhamento')
      } finally {
        setLoading(false)
      }
    }

    loadTracking()
  }, [indicatorId, getTrackingByIndicatorId])

  const onSubmit = async (data) => {
    if (!indicatorId) {
      setError('ID do indicador não encontrado')
      return
    }

    try {
      setError('')
      setSuccess('')

      // Garantir que tracking_month está no formato correto (primeiro dia do mês)
      const monthDate = new Date(data.tracking_month + '-01')
      monthDate.setDate(1)
      const formattedMonth = monthDate.toISOString().split('T')[0]

      // Verificar se já existe registro para este mês
      const existing = existingTracking.find(
        t => t.tracking_month.startsWith(data.tracking_month.substring(0, 7))
      )

      if (existing) {
        setError('Já existe um registro de acompanhamento para este mês')
        return
      }

      const result = await trackingService.create({
        indicator_id: indicatorId,
        tracking_month: formattedMonth,
        actual_executions: parseInt(data.actual_executions) || 0,
        actual_hours_saved: parseFloat(data.actual_hours_saved) || 0,
        actual_cost_ia: parseFloat(data.actual_cost_ia) || 0,
        notes: data.notes || null
      })

      if (result.success) {
        setSuccess('Registro de acompanhamento criado com sucesso!')
        reset()
        // Recarregar histórico
        const tracking = await getTrackingByIndicatorId(indicatorId)
        setExistingTracking(tracking || [])
      } else {
        setError(result.error || 'Erro ao criar registro de acompanhamento')
      }
    } catch (error) {
      console.error('Erro ao salvar tracking:', error)
      setError(error.message || 'Erro ao salvar registro de acompanhamento')
    }
  }

  const formatMonth = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600 dark:text-slate-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Acompanhamento Mensal
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Mês de Referência <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              {...register('tracking_month', {
                required: 'Mês de referência é obrigatório',
                validate: (value) => {
                  const selectedDate = new Date(value + '-01')
                  const today = new Date()
                  if (selectedDate > today) {
                    return 'Não é possível registrar acompanhamento para meses futuros'
                  }
                  return true
                }
              })}
              className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.tracking_month
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {errors.tracking_month && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.tracking_month.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Execuções Reais <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('actual_executions', {
                  required: 'Número de execuções é obrigatório',
                  min: { value: 0, message: 'Não pode ser negativo' }
                })}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.actual_executions
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="0"
              />
              {errors.actual_executions && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.actual_executions.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Horas Economizadas Reais <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('actual_hours_saved', {
                  required: 'Horas economizadas é obrigatório',
                  min: { value: 0, message: 'Não pode ser negativo' }
                })}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.actual_hours_saved
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="0.00"
              />
              {errors.actual_hours_saved && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.actual_hours_saved.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Custo Real da IA (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('actual_cost_ia', {
                  required: 'Custo real da IA é obrigatório',
                  min: { value: 0, message: 'Não pode ser negativo' }
                })}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.actual_cost_ia
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="0.00"
              />
              {errors.actual_cost_ia && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.actual_cost_ia.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Observações
            </label>
            <textarea
              rows={4}
              {...register('notes')}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Comentários sobre o mês..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Acompanhamento'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Histórico de Acompanhamento */}
      {existingTracking.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
            Histórico de Acompanhamento
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mês
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Execuções
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Horas Economizadas
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Custo IA (R$)
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody>
                {existingTracking.map((tracking) => (
                  <tr
                    key={tracking.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="py-3 px-4 text-slate-900 dark:text-white">
                      {formatMonth(tracking.tracking_month)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {tracking.actual_executions}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {tracking.actual_hours_saved.toFixed(2)}h
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      R$ {tracking.actual_cost_ia.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {tracking.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TrackingForm

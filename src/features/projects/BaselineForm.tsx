import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HelpCircle, Plus, Trash2 } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { 
  IndicatorType, 
  BaselineData,
  INDICATOR_TYPE_INFO,
  ProdutividadePerson,
  CustosRelacionadosTool
} from '../../types/baseline'

// Schema base para validação
const baselineSchema = z.object({
  tipoIndicador: z.enum(['PRODUTIVIDADE', 'INCREMENTO RECEITA', 'CUSTOS RELACIONADOS', 'OUTROS']),
  data: z.any() // Será validado dinamicamente baseado no tipo
})

type BaselineFormData = z.infer<typeof baselineSchema>

interface BaselineFormProps {
  value?: BaselineData | null
  onChange?: (data: BaselineData) => void
  onSubmit?: (data: BaselineData) => Promise<void>
  className?: string
}

export const BaselineForm = ({ 
  value, 
  onChange, 
  onSubmit,
  className = '' 
}: BaselineFormProps) => {
  const { 
    register, 
    watch, 
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<BaselineFormData>({
    resolver: zodResolver(baselineSchema),
    defaultValues: {
      tipoIndicador: value?.tipo || 'PRODUTIVIDADE',
      data: value || null
    }
  })

  const tipoIndicador = watch('tipoIndicador') as IndicatorType

  // Field arrays para listas dinâmicas - só inicializa se o tipo for apropriado
  const pessoasData = watch('data') as BaselineData
  const pessoasArray = pessoasData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in pessoasData 
    ? pessoasData.pessoas 
    : []

  const ferramentasData = watch('data') as BaselineData
  const ferramentasArray = ferramentasData?.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in ferramentasData
    ? ferramentasData.ferramentas
    : []

  // Inicializa campos baseado no tipo
  const handleTipoChange = (newTipo: IndicatorType) => {
    setValue('tipoIndicador', newTipo)
    
    switch (newTipo) {
      case 'PRODUTIVIDADE':
        setValue('data', {
          tipo: 'PRODUTIVIDADE',
          pessoas: [],
          custoTotalBaseline: 0
        })
        break
      case 'INCREMENTO RECEITA':
        setValue('data', {
          tipo: 'INCREMENTO RECEITA',
          valorReceitaAntes: 0
        })
        break
      case 'CUSTOS RELACIONADOS':
        setValue('data', {
          tipo: 'CUSTOS RELACIONADOS',
          ferramentas: []
        })
        break
      case 'OUTROS':
        setValue('data', {
          tipo: 'OUTROS',
          nomeIndicador: '',
          valorIndicador: 0
        })
        break
    }
    
    onChange?.(getFormData())
  }

  const getFormData = (): BaselineData => {
    const formValues = watch()
    return formValues.data as BaselineData
  }

  // Calcula custo total baseline para PRODUTIVIDADE
  const calcularCustoTotalBaseline = (pessoas: ProdutividadePerson[]): number => {
    return pessoas.reduce((total, pessoa) => {
      const horasPorMes = calcularHorasPorMes(
        pessoa.frequenciaReal.quantidade,
        pessoa.frequenciaReal.periodo
      )
      const custoMensal = (pessoa.valorHora * (pessoa.tempoGasto / 60)) * horasPorMes
      return total + custoMensal
    }, 0)
  }

  const calcularHorasPorMes = (quantidade: number, periodo: string): number => {
    switch (periodo) {
      case 'Diário':
        return quantidade * 30 // 30 dias no mês
      case 'Semanal':
        return quantidade * 4.33 // ~4.33 semanas no mês
      case 'Mensal':
        return quantidade
      default:
        return quantidade
    }
  }

  const onFormSubmit = async (data: BaselineFormData) => {
    const baselineData = data.data as BaselineData
    
    // Calcula custo total se for PRODUTIVIDADE
    if (baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData) {
      baselineData.custoTotalBaseline = calcularCustoTotalBaseline(baselineData.pessoas)
    }
    
    if (onSubmit) {
      await onSubmit(baselineData)
    } else {
      onChange?.(baselineData)
    }
  }

  const addPessoa = () => {
    const novaPessoa: ProdutividadePerson = {
      id: Date.now().toString(),
      nome: '',
      cargo: '',
      valorHora: 0,
      tempoGasto: 0,
      frequenciaReal: {
        quantidade: 0,
        periodo: 'Mensal'
      },
      frequenciaDesejada: {
        quantidade: 0,
        periodo: 'Mensal'
      }
    }
    const currentData = watch('data') as BaselineData
    if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
      const updatedData: BaselineData = {
        ...currentData,
        pessoas: [...currentData.pessoas, novaPessoa]
      }
      setValue('data', updatedData)
      onChange?.(updatedData)
    }
  }

  const removePessoa = (index: number) => {
    const currentData = watch('data') as BaselineData
    if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
      const updatedData: BaselineData = {
        ...currentData,
        pessoas: currentData.pessoas.filter((_, i) => i !== index)
      }
      setValue('data', updatedData)
      onChange?.(updatedData)
    }
  }

  const addFerramenta = () => {
    const novaFerramenta: CustosRelacionadosTool = {
      id: Date.now().toString(),
      nomeFerramenta: '',
      custoMensal: 0,
      outrosCustos: 0
    }
    const currentData = watch('data') as BaselineData
    if (currentData?.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in currentData) {
      const updatedData: BaselineData = {
        ...currentData,
        ferramentas: [...currentData.ferramentas, novaFerramenta]
      }
      setValue('data', updatedData)
      onChange?.(updatedData)
    }
  }

  const removeFerramenta = (index: number) => {
    const currentData = watch('data') as BaselineData
    if (currentData?.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in currentData) {
      const updatedData: BaselineData = {
        ...currentData,
        ferramentas: currentData.ferramentas.filter((_, i) => i !== index)
      }
      setValue('data', updatedData)
      onChange?.(updatedData)
    }
  }

  const currentData = watch('data') as BaselineData

  return (
    <Tooltip.Provider>
      <form onSubmit={handleSubmit(onFormSubmit)} className={`space-y-6 ${className}`}>
        {/* Card: Tipo de Indicador */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <label
              htmlFor="tipo-indicador"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Tipo de Indicador
            </label>
            <Tooltip.Root delayDuration={300}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  aria-label="Informações sobre tipos de indicador"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg px-3 py-2 max-w-md shadow-lg z-50"
                  sideOffset={5}
                >
                  {tipoIndicador && INDICATOR_TYPE_INFO[tipoIndicador] ? (
                    <div className="space-y-2">
                      <p className="font-semibold">Descrição:</p>
                      <p>{INDICATOR_TYPE_INFO[tipoIndicador].descricao}</p>
                      <p className="font-semibold mt-2">Métrica Principal:</p>
                      <p className="text-xs">{INDICATOR_TYPE_INFO[tipoIndicador].metricaPrincipal}</p>
                    </div>
                  ) : (
                    <p>Selecione um tipo de indicador para ver informações</p>
                  )}
                  <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-700" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
          <select
            id="tipo-indicador"
            {...register('tipoIndicador')}
            onChange={(e) => handleTipoChange(e.target.value as IndicatorType)}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-400 dark:hover:border-slate-500"
          >
            <option value="PRODUTIVIDADE">Produtividade</option>
            <option value="INCREMENTO RECEITA">Incremento Receita</option>
            <option value="CUSTOS RELACIONADOS">Custos Relacionados</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        {/* Renderização condicional baseada no tipo */}
        {tipoIndicador === 'PRODUTIVIDADE' && (
          <div className="space-y-6">
            {/* Lista de Pessoas */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pessoas
                </h3>
                <button
                  type="button"
                  onClick={addPessoa}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Pessoa
                </button>
              </div>

              {pessoasArray.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                  Nenhuma pessoa adicionada. Clique em "Adicionar Pessoa" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {pessoasArray.map((pessoa, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Pessoa {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removePessoa(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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
                            {...register(`data.pessoas.${index}.nome` as any)}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                const updatedPessoas = [...currentData.pessoas]
                                updatedPessoas[index] = { ...updatedPessoas[index], nome: e.target.value }
                                const updatedData = { ...currentData, pessoas: updatedPessoas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={pessoa.nome}
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
                            {...register(`data.pessoas.${index}.cargo` as any)}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                const updatedPessoas = [...currentData.pessoas]
                                updatedPessoas[index] = { ...updatedPessoas[index], cargo: e.target.value }
                                const updatedData = { ...currentData, pessoas: updatedPessoas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={pessoa.cargo}
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
                            {...register(`data.pessoas.${index}.valorHora` as any, { valueAsNumber: true })}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                const updatedPessoas = [...currentData.pessoas]
                                updatedPessoas[index] = { ...updatedPessoas[index], valorHora: parseFloat(e.target.value) || 0 }
                                const updatedData = { ...currentData, pessoas: updatedPessoas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={pessoa.valorHora}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Tempo Gasto (min)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`data.pessoas.${index}.tempoGasto` as any, { valueAsNumber: true })}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                const updatedPessoas = [...currentData.pessoas]
                                updatedPessoas[index] = { ...updatedPessoas[index], tempoGasto: parseFloat(e.target.value) || 0 }
                                const updatedData = { ...currentData, pessoas: updatedPessoas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={pessoa.tempoGasto}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Frequência Real */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                          Frequência Real (É realizada)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Quantidade
                            </label>
                            <input
                              type="number"
                              {...register(`data.pessoas.${index}.frequenciaReal.quantidade` as any, { valueAsNumber: true })}
                              onChange={(e) => {
                                const currentData = watch('data') as BaselineData
                                if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                  const updatedPessoas = [...currentData.pessoas]
                                  updatedPessoas[index] = {
                                    ...updatedPessoas[index],
                                    frequenciaReal: {
                                      ...updatedPessoas[index].frequenciaReal,
                                      quantidade: parseFloat(e.target.value) || 0
                                    }
                                  }
                                  const updatedData = { ...currentData, pessoas: updatedPessoas }
                                  setValue('data', updatedData)
                                  onChange?.(updatedData)
                                }
                              }}
                              defaultValue={pessoa.frequenciaReal.quantidade}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Período
                            </label>
                            <select
                              {...register(`data.pessoas.${index}.frequenciaReal.periodo` as any)}
                              onChange={(e) => {
                                const currentData = watch('data') as BaselineData
                                if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                  const updatedPessoas = [...currentData.pessoas]
                                  updatedPessoas[index] = {
                                    ...updatedPessoas[index],
                                    frequenciaReal: {
                                      ...updatedPessoas[index].frequenciaReal,
                                      periodo: e.target.value as 'Diário' | 'Semanal' | 'Mensal'
                                    }
                                  }
                                  const updatedData = { ...currentData, pessoas: updatedPessoas }
                                  setValue('data', updatedData)
                                  onChange?.(updatedData)
                                }
                              }}
                              defaultValue={pessoa.frequenciaReal.periodo}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value="Diário">Diário</option>
                              <option value="Semanal">Semanal</option>
                              <option value="Mensal">Mensal</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Frequência Desejada */}
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                          Frequência Desejada (DEVERIA ser realizada)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Quantidade
                            </label>
                            <input
                              type="number"
                              {...register(`data.pessoas.${index}.frequenciaDesejada.quantidade` as any, { valueAsNumber: true })}
                              onChange={(e) => {
                                const currentData = watch('data') as BaselineData
                                if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                  const updatedPessoas = [...currentData.pessoas]
                                  updatedPessoas[index] = {
                                    ...updatedPessoas[index],
                                    frequenciaDesejada: {
                                      ...updatedPessoas[index].frequenciaDesejada,
                                      quantidade: parseFloat(e.target.value) || 0
                                    }
                                  }
                                  const updatedData = { ...currentData, pessoas: updatedPessoas }
                                  setValue('data', updatedData)
                                  onChange?.(updatedData)
                                }
                              }}
                              defaultValue={pessoa.frequenciaDesejada.quantidade}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Período
                            </label>
                            <select
                              {...register(`data.pessoas.${index}.frequenciaDesejada.periodo` as any)}
                              onChange={(e) => {
                                const currentData = watch('data') as BaselineData
                                if (currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData) {
                                  const updatedPessoas = [...currentData.pessoas]
                                  updatedPessoas[index] = {
                                    ...updatedPessoas[index],
                                    frequenciaDesejada: {
                                      ...updatedPessoas[index].frequenciaDesejada,
                                      periodo: e.target.value as 'Diário' | 'Semanal' | 'Mensal'
                                    }
                                  }
                                  const updatedData = { ...currentData, pessoas: updatedPessoas }
                                  setValue('data', updatedData)
                                  onChange?.(updatedData)
                                }
                              }}
                              defaultValue={pessoa.frequenciaDesejada.periodo}
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
                  ))}
                </div>
              )}

              {/* Custo Total Baseline Calculado */}
              {currentData?.tipo === 'PRODUTIVIDADE' && 'pessoas' in currentData && currentData.pessoas.length > 0 && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Custo Total Baseline (Mensal):
                    </span>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      R$ {calcularCustoTotalBaseline(currentData.pessoas).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tipoIndicador === 'INCREMENTO RECEITA' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
              Valor da Receita Antes (R$)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('data.valorReceitaAntes' as any, { valueAsNumber: true })}
              onChange={(e) => {
                const currentData = watch('data') as BaselineData
                if (currentData?.tipo === 'INCREMENTO RECEITA') {
                  const updatedData: BaselineData = {
                    ...currentData,
                    valorReceitaAntes: parseFloat(e.target.value) || 0
                  }
                  setValue('data', updatedData)
                  onChange?.(updatedData)
                }
              }}
              defaultValue={currentData?.tipo === 'INCREMENTO RECEITA' ? currentData.valorReceitaAntes : 0}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        )}

        {tipoIndicador === 'CUSTOS RELACIONADOS' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Ferramentas
                </h3>
                <button
                  type="button"
                  onClick={addFerramenta}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Ferramenta
                </button>
              </div>

              {ferramentasArray.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                  Nenhuma ferramenta adicionada. Clique em "Adicionar Ferramenta" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {ferramentasArray.map((ferramenta, index) => (
                    <div
                      key={ferramenta.id || index}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Ferramenta {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFerramenta(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Nome da Ferramenta
                          </label>
                          <input
                            type="text"
                            {...register(`data.ferramentas.${index}.nomeFerramenta` as any)}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in currentData) {
                                const updatedFerramentas = [...currentData.ferramentas]
                                updatedFerramentas[index] = { ...updatedFerramentas[index], nomeFerramenta: e.target.value }
                                const updatedData = { ...currentData, ferramentas: updatedFerramentas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={ferramenta.nomeFerramenta}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="Nome da ferramenta"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Custo Mensal (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`data.ferramentas.${index}.custoMensal` as any, { valueAsNumber: true })}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in currentData) {
                                const updatedFerramentas = [...currentData.ferramentas]
                                updatedFerramentas[index] = { ...updatedFerramentas[index], custoMensal: parseFloat(e.target.value) || 0 }
                                const updatedData = { ...currentData, ferramentas: updatedFerramentas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={ferramenta.custoMensal}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Outros Custos (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`data.ferramentas.${index}.outrosCustos` as any, { valueAsNumber: true })}
                            onChange={(e) => {
                              const currentData = watch('data') as BaselineData
                              if (currentData?.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in currentData) {
                                const updatedFerramentas = [...currentData.ferramentas]
                                updatedFerramentas[index] = { ...updatedFerramentas[index], outrosCustos: parseFloat(e.target.value) || 0 }
                                const updatedData = { ...currentData, ferramentas: updatedFerramentas }
                                setValue('data', updatedData)
                                onChange?.(updatedData)
                              }
                            }}
                            defaultValue={ferramenta.outrosCustos}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tipoIndicador === 'OUTROS' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                Nome do Indicador
              </label>
              <input
                type="text"
                {...register('data.nomeIndicador' as any)}
                onChange={(e) => {
                  const currentData = watch('data') as BaselineData
                  if (currentData?.tipo === 'OUTROS') {
                    const updatedData: BaselineData = {
                      ...currentData,
                      nomeIndicador: e.target.value
                    }
                    setValue('data', updatedData)
                    onChange?.(updatedData)
                  }
                }}
                defaultValue={currentData?.tipo === 'OUTROS' ? currentData.nomeIndicador : ''}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nome do indicador"
              />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                Valor do Indicador
              </label>
              <input
                type="number"
                step="0.01"
                {...register('data.valorIndicador' as any, { valueAsNumber: true })}
                onChange={(e) => {
                  const currentData = watch('data') as BaselineData
                  if (currentData?.tipo === 'OUTROS') {
                    const updatedData: BaselineData = {
                      ...currentData,
                      valorIndicador: parseFloat(e.target.value) || 0
                    }
                    setValue('data', updatedData)
                    onChange?.(updatedData)
                  }
                }}
                defaultValue={currentData?.tipo === 'OUTROS' ? currentData.valorIndicador : 0}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Botão de Submit (se fornecido) */}
        {onSubmit && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Baseline'}
            </button>
          </div>
        )}
      </form>
    </Tooltip.Provider>
  )
}

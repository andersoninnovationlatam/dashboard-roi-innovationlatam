import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { 
  IndicatorType, 
  BaselineData,
  ProdutividadePerson,
  CustosRelacionadosTool
} from '../../types/baseline'
import {
  PostIAData,
  PostIAProdutividadePerson,
  PostIACustosRelacionadosTool
} from '../../types/postIA'

// Mapeamento dos tipos do sistema antigo para os novos tipos
const TIPO_MAPPING: Record<string, IndicatorType> = {
  'Produtividade': 'PRODUTIVIDADE',
  'Capacidade Analítica': 'CAPACIDADE ANALÍTICA',
  'Incremento Receita': 'INCREMENTO RECEITA',
  'Melhoria Margem': 'MELHORIA MARGEM',
  'Redução de Risco': 'REDUÇÃO DE RISCO',
  'Qualidade Decisão': 'QUALIDADE DECISÃO',
  'Velocidade': 'VELOCIDADE',
  'Satisfação': 'SATISFAÇÃO'
}

interface PostIATabProps {
  tipoIndicador: string
  baselineData?: BaselineData | null
  postIAData?: PostIAData | null
  onPostIAChange?: (data: PostIAData) => void
}

export const PostIATab = ({
  tipoIndicador,
  baselineData,
  postIAData,
  onPostIAChange
}: PostIATabProps) => {
  const tipoPostIA = TIPO_MAPPING[tipoIndicador] || 'PRODUTIVIDADE'

  // Helper para formatar valor numérico (remove zero à esquerda)
  const formatNumberValue = (value: number): string => {
    if (value === 0 || value === null || value === undefined) return ''
    return value.toString()
  }

  // Inicializa dados herdando do Baseline
  const [data, setData] = useState<PostIAData>(() => {
    if (postIAData) {
      return postIAData
    }

    // Herda dados do Baseline
    if (baselineData) {
      if (baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData) {
        return {
          tipo: 'PRODUTIVIDADE',
          pessoas: baselineData.pessoas.map(p => ({
            id: p.id,
            nome: p.nome,
            cargo: p.cargo,
            valorHora: p.valorHora,
            tempoGasto: p.tempoGasto, // Usuário pode alterar
            frequenciaReal: { ...p.frequenciaReal },
            frequenciaDesejada: { ...p.frequenciaDesejada }
          })),
          custoTotalPostIA: 0,
          deltaProdutividade: 0
        }
      } else if (baselineData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaAntes' in baselineData) {
        return {
          tipo: 'INCREMENTO RECEITA',
          valorReceitaDepois: baselineData.valorReceitaAntes,
          deltaReceita: 0
        }
      } else if (baselineData.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in baselineData) {
        return {
          tipo: 'CUSTOS RELACIONADOS',
          ferramentas: baselineData.ferramentas.map(f => ({
            id: f.id,
            nomeFerramenta: f.nomeFerramenta,
            custoMensal: f.custoMensal,
            outrosCustos: f.outrosCustos,
            custoImplementacao: 0 // Campo exclusivo do Pós-IA
          })),
          custoTotalImplementacao: 0
        }
      } else if (baselineData.tipo === 'OUTROS' && 'nomeIndicador' in baselineData) {
        return {
          tipo: 'OUTROS',
          nomeIndicador: baselineData.nomeIndicador,
          valorIndicadorDepois: baselineData.valorIndicador,
          deltaIndicador: 0
        }
      }
    }

    // Se não há baseline, inicializa vazio
    switch (tipoPostIA) {
      case 'PRODUTIVIDADE':
        return {
          tipo: 'PRODUTIVIDADE',
          pessoas: [],
          custoTotalPostIA: 0,
          deltaProdutividade: 0
        }
      case 'INCREMENTO RECEITA':
        return {
          tipo: 'INCREMENTO RECEITA',
          valorReceitaDepois: 0,
          deltaReceita: 0
        }
      case 'CUSTOS RELACIONADOS':
        return {
          tipo: 'CUSTOS RELACIONADOS',
          ferramentas: [],
          custoTotalImplementacao: 0
        }
      default:
        return {
          tipo: 'OUTROS',
          nomeIndicador: '',
          valorIndicadorDepois: 0,
          deltaIndicador: 0
        }
    }
  })

  // Atualiza quando baselineData ou postIAData mudam
  useEffect(() => {
    if (postIAData) {
      setData(postIAData)
      return
    }
    
    if (!baselineData) return
    
    const novoTipo = TIPO_MAPPING[tipoIndicador] || 'PRODUTIVIDADE'
    
    // Só re-herda se o tipo do baseline corresponde ao tipo atual
    if (baselineData.tipo === novoTipo) {
      if (baselineData.tipo === 'PRODUTIVIDADE' && 'pessoas' in baselineData) {
        // Preserva valores já preenchidos se existirem
        setData(prevData => {
          const pessoasExistentes = prevData.tipo === 'PRODUTIVIDADE' && 'pessoas' in prevData ? prevData.pessoas : []
          const novasPessoas = baselineData.pessoas.map(p => {
            const existente = pessoasExistentes.find(pp => pp.id === p.id)
            return {
              id: p.id,
              nome: p.nome,
              cargo: p.cargo,
              valorHora: existente?.valorHora ?? p.valorHora,
              tempoGasto: existente?.tempoGasto ?? p.tempoGasto,
              frequenciaReal: existente?.frequenciaReal ?? { ...p.frequenciaReal },
              frequenciaDesejada: existente?.frequenciaDesejada ?? { ...p.frequenciaDesejada }
            }
          })
          return {
            tipo: 'PRODUTIVIDADE',
            pessoas: novasPessoas,
            custoTotalPostIA: 0,
            deltaProdutividade: 0
          }
        })
      } else if (baselineData.tipo === 'INCREMENTO RECEITA' && 'valorReceitaAntes' in baselineData) {
        setData(prevData => ({
          tipo: 'INCREMENTO RECEITA',
          valorReceitaDepois: prevData.tipo === 'INCREMENTO RECEITA' ? prevData.valorReceitaDepois : baselineData.valorReceitaAntes,
          deltaReceita: 0
        }))
      } else if (baselineData.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in baselineData) {
        setData(prevData => {
          const ferramentasExistentes = prevData.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in prevData ? prevData.ferramentas : []
          const novasFerramentas = baselineData.ferramentas.map(f => {
            const existente = ferramentasExistentes.find(ff => ff.id === f.id)
            return {
              id: f.id,
              nomeFerramenta: f.nomeFerramenta,
              custoMensal: existente?.custoMensal ?? f.custoMensal,
              outrosCustos: existente?.outrosCustos ?? f.outrosCustos,
              custoImplementacao: existente?.custoImplementacao ?? 0
            }
          })
          return {
            tipo: 'CUSTOS RELACIONADOS',
            ferramentas: novasFerramentas,
            custoTotalImplementacao: 0
          }
        })
      } else if (baselineData.tipo === 'OUTROS' && 'nomeIndicador' in baselineData) {
        setData(prevData => ({
          tipo: 'OUTROS',
          nomeIndicador: baselineData.nomeIndicador,
          valorIndicadorDepois: prevData.tipo === 'OUTROS' ? prevData.valorIndicadorDepois : baselineData.valorIndicador,
          deltaIndicador: 0
        }))
      }
    }
  }, [baselineData, tipoIndicador, postIAData])

  const updateData = (newData: PostIAData) => {
    setData(newData)
    onPostIAChange?.(newData)
  }

  // Calcula custo total Pós-IA para PRODUTIVIDADE
  const calcularCustoTotalPostIA = (pessoas: PostIAProdutividadePerson[]): number => {
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
        return quantidade * 30
      case 'Semanal':
        return quantidade * 4.33
      case 'Mensal':
        return quantidade
      default:
        return quantidade
    }
  }

  // Calcula Delta Produtividade: (HH Antes - HH Depois) × Valor Hora
  const calcularDeltaProdutividade = useMemo(() => {
    if (data.tipo !== 'PRODUTIVIDADE' || !baselineData || baselineData.tipo !== 'PRODUTIVIDADE' || !('pessoas' in data) || !('pessoas' in baselineData)) {
      return 0
    }

    const pessoasBaseline = baselineData.pessoas || []
    const pessoasPostIA = data.pessoas || []

    return pessoasPostIA.reduce((total, pessoaPostIA) => {
      const pessoaBaseline = pessoasBaseline.find(p => p.id === pessoaPostIA.id)
      if (!pessoaBaseline) return total

      const horasBaseline = calcularHorasPorMes(
        pessoaBaseline.frequenciaReal.quantidade,
        pessoaBaseline.frequenciaReal.periodo
      )
      const horasPostIA = calcularHorasPorMes(
        pessoaPostIA.frequenciaReal.quantidade,
        pessoaPostIA.frequenciaReal.periodo
      )

      const hhAntes = (pessoaBaseline.tempoGasto / 60) * horasBaseline
      const hhDepois = (pessoaPostIA.tempoGasto / 60) * horasPostIA
      const delta = (hhAntes - hhDepois) * pessoaPostIA.valorHora

      return total + delta
    }, 0)
  }, [data, baselineData])

  // Calcula Delta Receita: Receita Depois - Receita Antes
  const calcularDeltaReceita = useMemo(() => {
    if (data.tipo !== 'INCREMENTO RECEITA' || !baselineData || baselineData.tipo !== 'INCREMENTO RECEITA' || !('valorReceitaAntes' in baselineData)) {
      return 0
    }
    return data.valorReceitaDepois - (baselineData.valorReceitaAntes || 0)
  }, [data, baselineData])

  // Atualiza cálculos quando dados mudam
  useEffect(() => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const custoTotal = calcularCustoTotalPostIA(data.pessoas)
      const updatedData: PostIAData = {
        ...data,
        custoTotalPostIA: custoTotal,
        deltaProdutividade: calcularDeltaProdutividade
      }
      if (updatedData.custoTotalPostIA !== data.custoTotalPostIA || updatedData.deltaProdutividade !== data.deltaProdutividade) {
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    } else if (data.tipo === 'INCREMENTO RECEITA') {
      const updatedData: PostIAData = {
        ...data,
        deltaReceita: calcularDeltaReceita
      }
      if (updatedData.deltaReceita !== data.deltaReceita) {
        setData(updatedData)
        onPostIAChange?.(updatedData)
      }
    }
  }, [calcularDeltaProdutividade, calcularDeltaReceita, data])

  const updatePessoa = (index: number, field: string, value: any) => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const updatedPessoas = [...data.pessoas]
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        updatedPessoas[index] = {
          ...updatedPessoas[index],
          [parent]: {
            ...updatedPessoas[index][parent as keyof PostIAProdutividadePerson],
            [child]: value
          }
        }
      } else {
        updatedPessoas[index] = {
          ...updatedPessoas[index],
          [field]: value
        }
      }
      const custoTotal = calcularCustoTotalPostIA(updatedPessoas)
      const updatedData: PostIAData = {
        ...data,
        pessoas: updatedPessoas,
        custoTotalPostIA: custoTotal
      }
      updateData(updatedData)
    }
  }

  const updateFerramenta = (index: number, field: string, value: any) => {
    if (data.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in data) {
      const updatedFerramentas = [...data.ferramentas]
      updatedFerramentas[index] = {
        ...updatedFerramentas[index],
        [field]: value
      }
      const custoTotal = updatedFerramentas.reduce((sum, f) => sum + (f.custoImplementacao || 0), 0)
      const updatedData: PostIAData = {
        ...data,
        ferramentas: updatedFerramentas,
        custoTotalImplementacao: custoTotal
      }
      updateData(updatedData)
    }
  }

  return (
    <div className="space-y-6">
      {/* PRODUTIVIDADE */}
      {tipoPostIA === 'PRODUTIVIDADE' && data.tipo === 'PRODUTIVIDADE' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Pessoas (Pós-IA)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Dados herdados do Baseline. Altere apenas os valores que mudaram após a implementação.
              </p>
            </div>

            {data.pessoas.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                Preencha primeiro a aba Baseline para herdar os dados.
              </p>
            ) : (
              <div className="space-y-4">
                {data.pessoas.map((pessoa, index) => (
                  <div
                    key={pessoa.id || index}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {pessoa.nome} - {pessoa.cargo}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Valor da Hora (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(pessoa.valorHora)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updatePessoa(index, 'valorHora', val)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Tempo Gasto (min) - <span className="text-green-600 dark:text-green-400">Novo valor</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(pessoa.tempoGasto)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updatePessoa(index, 'tempoGasto', val)
                          }}
                          className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Frequências (herdadas, mas podem ser alteradas) */}
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
                              value={formatNumberValue(pessoa.frequenciaReal.quantidade)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updatePessoa(index, 'frequenciaReal.quantidade', val)
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Período
                            </label>
                            <select
                              value={pessoa.frequenciaReal.periodo}
                              onChange={(e) => updatePessoa(index, 'frequenciaReal.periodo', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value="Diário">Diário</option>
                              <option value="Semanal">Semanal</option>
                              <option value="Mensal">Mensal</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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
                              value={formatNumberValue(pessoa.frequenciaDesejada.quantidade)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updatePessoa(index, 'frequenciaDesejada.quantidade', val)
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Período
                            </label>
                            <select
                              value={pessoa.frequenciaDesejada.periodo}
                              onChange={(e) => updatePessoa(index, 'frequenciaDesejada.periodo', e.target.value)}
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
                ))}
              </div>
            )}

            {/* Resultados Prévios */}
            {data.pessoas.length > 0 && baselineData && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Custo Total Pós-IA (Mensal):
                    </span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      R$ {data.custoTotalPostIA.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Delta Produtividade:
                      </span>
                    </div>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {calcularDeltaProdutividade.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    (HH Antes - HH Depois) × Valor Hora
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INCREMENTO RECEITA */}
      {tipoPostIA === 'INCREMENTO RECEITA' && data.tipo === 'INCREMENTO RECEITA' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
              Valor da Receita Depois (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={data.tipo === 'INCREMENTO RECEITA' ? formatNumberValue(data.valorReceitaDepois) : ''}
              onChange={(e) => {
                const updatedData: PostIAData = {
                  tipo: 'INCREMENTO RECEITA',
                  valorReceitaDepois: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                  deltaReceita: calcularDeltaReceita
                }
                updateData(updatedData)
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />

            {/* Resultados Prévios */}
            {baselineData && baselineData.tipo === 'INCREMENTO RECEITA' && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Delta Receita:
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    R$ {calcularDeltaReceita.toLocaleString('pt-BR', {
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
        </div>
      )}

      {/* CUSTOS RELACIONADOS */}
      {tipoPostIA === 'CUSTOS RELACIONADOS' && data.tipo === 'CUSTOS RELACIONADOS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Ferramentas (Pós-IA)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Dados herdados do Baseline. Adicione o custo de implementação.
              </p>
            </div>

            {data.ferramentas.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                Preencha primeiro a aba Baseline para herdar os dados.
              </p>
            ) : (
              <div className="space-y-4">
                {data.ferramentas.map((ferramenta, index) => (
                  <div
                    key={ferramenta.id || index}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {ferramenta.nomeFerramenta}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Custo Mensal (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(ferramenta.custoMensal)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateFerramenta(index, 'custoMensal', val)
                          }}
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
                          value={formatNumberValue(ferramenta.outrosCustos)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateFerramenta(index, 'outrosCustos', val)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                          Custo de Implementação (R$) <span className="text-green-600 dark:text-green-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatNumberValue(ferramenta.custoImplementacao)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateFerramenta(index, 'custoImplementacao', val)
                          }}
                          className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Campo exclusivo do Pós-IA
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custo Total Implementação */}
            {data.ferramentas.length > 0 && (
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Custo Total de Implementação:
                  </span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    R$ {data.custoTotalImplementacao.toLocaleString('pt-BR', {
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

      {/* OUTROS */}
      {tipoPostIA === 'OUTROS' && data.tipo === 'OUTROS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
              Valor do Indicador Depois
            </label>
            <input
              type="number"
              step="0.01"
              value={data.tipo === 'OUTROS' ? formatNumberValue(data.valorIndicadorDepois) : ''}
              onChange={(e) => {
                const valorDepois = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                const valorAntes = baselineData && baselineData.tipo === 'OUTROS' ? baselineData.valorIndicador : 0
                const updatedData: PostIAData = {
                  tipo: 'OUTROS',
                  nomeIndicador: data.tipo === 'OUTROS' ? data.nomeIndicador : '',
                  valorIndicadorDepois: valorDepois,
                  deltaIndicador: valorDepois - valorAntes
                }
                updateData(updatedData)
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>
      )}
    </div>
  )
}

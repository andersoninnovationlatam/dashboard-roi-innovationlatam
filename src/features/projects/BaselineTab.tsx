import { useState, useEffect } from 'react'
import { HelpCircle, Plus, Trash2 } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { 
  IndicatorType, 
  BaselineData,
  INDICATOR_TYPE_INFO,
  ProdutividadePerson,
  CustosRelacionadosTool
} from '../../types/baseline'

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

interface BaselineTabProps {
  tipoIndicador: string // Tipo do sistema antigo (ex: 'Produtividade')
  baselineData?: BaselineData | null
  onTipoChange?: (novoTipo: string) => void
  onBaselineChange?: (data: BaselineData) => void
  onSave?: (data: BaselineData) => Promise<void>
}

export const BaselineTab = ({
  tipoIndicador,
  baselineData,
  onTipoChange,
  onBaselineChange,
  onSave
}: BaselineTabProps) => {
  // Converte tipo antigo para novo tipo baseado no tipoIndicador recebido da aba INFO
  const tipoBaseline = TIPO_MAPPING[tipoIndicador] || 'PRODUTIVIDADE'

  // Helper para formatar valor numérico (permite zero mas remove zeros à esquerda)
  const formatNumberValue = (value: number): string => {
    if (value === null || value === undefined) return ''
    if (value === 0) return '0'  // Permite zero
    return value.toString().replace(/^0+/, '')  // Remove zeros à esquerda
  }

  const [data, setData] = useState<BaselineData>(() => {
    // Se já existe baselineData, usa ele
    if (baselineData) {
      return baselineData
    }
    // Senão, inicializa baseado no tipo
    switch (tipoBaseline) {
      case 'PRODUTIVIDADE':
        return {
          tipo: 'PRODUTIVIDADE',
          pessoas: [],
          custoTotalBaseline: 0
        } as BaselineData
      case 'INCREMENTO RECEITA':
        return {
          tipo: 'INCREMENTO RECEITA',
          valorReceitaAntes: 0
        } as BaselineData
      case 'CUSTOS RELACIONADOS':
        return {
          tipo: 'CUSTOS RELACIONADOS',
          ferramentas: []
        } as BaselineData
      case 'CAPACIDADE ANALÍTICA':
        return {
          tipo: 'CAPACIDADE ANALÍTICA',
          camposQualitativos: []
        } as BaselineData
      case 'MELHORIA MARGEM':
        return {
          tipo: 'MELHORIA MARGEM',
          margemAtual: 0,
          margemProjetada: 0,
          tipoMargem: 'percentual'
        } as BaselineData
      case 'REDUÇÃO DE RISCO':
        return {
          tipo: 'REDUÇÃO DE RISCO',
          probabilidade: 0,
          impactoFinanceiro: 0,
          valorEvitado: 0
        } as BaselineData
      case 'QUALIDADE DECISÃO':
        return {
          tipo: 'QUALIDADE DECISÃO',
          criterios: [],
          scoreMedio: 0
        } as BaselineData
      case 'VELOCIDADE':
        return {
          tipo: 'VELOCIDADE',
          tempoInicialProcesso: 0,
          unidadeTempo: 'minutos'
        } as BaselineData
      case 'SATISFAÇÃO':
        return {
          tipo: 'SATISFAÇÃO',
          scoreAtual: 0,
          tipoScore: 'NPS'
        } as BaselineData
      default:
        return {
          tipo: 'OUTROS',
          nomeIndicador: '',
          valorIndicador: 0
        } as BaselineData
    }
  })

  // Atualiza quando baselineData ou tipoIndicador mudam externamente
  useEffect(() => {
    const novoTipo = TIPO_MAPPING[tipoIndicador] || 'PRODUTIVIDADE'
    
    if (baselineData) {
      setData(baselineData)
    } else {
      // Se não há baselineData, inicializa baseado no tipo atual
      switch (novoTipo) {
        case 'PRODUTIVIDADE':
          setData({
            tipo: 'PRODUTIVIDADE',
            pessoas: [],
            custoTotalBaseline: 0
          } as BaselineData)
          break
        case 'INCREMENTO RECEITA':
          setData({
            tipo: 'INCREMENTO RECEITA',
            valorReceitaAntes: 0
          } as BaselineData)
          break
        case 'CUSTOS RELACIONADOS':
          setData({
            tipo: 'CUSTOS RELACIONADOS',
            ferramentas: []
          } as BaselineData)
          break
        case 'CAPACIDADE ANALÍTICA':
          setData({
            tipo: 'CAPACIDADE ANALÍTICA',
            camposQualitativos: []
          } as BaselineData)
          break
        case 'MELHORIA MARGEM':
          setData({
            tipo: 'MELHORIA MARGEM',
            margemAtual: 0,
            margemProjetada: 0,
            tipoMargem: 'percentual'
          } as BaselineData)
          break
        case 'REDUÇÃO DE RISCO':
          setData({
            tipo: 'REDUÇÃO DE RISCO',
            probabilidade: 0,
            impactoFinanceiro: 0,
            valorEvitado: 0
          } as BaselineData)
          break
        case 'QUALIDADE DECISÃO':
          setData({
            tipo: 'QUALIDADE DECISÃO',
            criterios: [],
            scoreMedio: 0
          } as BaselineData)
          break
        case 'VELOCIDADE':
          setData({
            tipo: 'VELOCIDADE',
            tempoInicialProcesso: 0,
            unidadeTempo: 'minutos'
          } as BaselineData)
          break
        case 'SATISFAÇÃO':
          setData({
            tipo: 'SATISFAÇÃO',
            scoreAtual: 0,
            tipoScore: 'NPS'
          } as BaselineData)
          break
        default:
          setData({
            tipo: 'OUTROS',
            nomeIndicador: '',
            valorIndicador: 0
          } as BaselineData)
      }
    }
  }, [baselineData, tipoIndicador])

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
        return quantidade * 30
      case 'Semanal':
        return quantidade * 4.33
      case 'Mensal':
        return quantidade
      default:
        return quantidade
    }
  }

  const updateData = (newData: BaselineData) => {
    setData(newData)
    onBaselineChange?.(newData)
  }

  const addPessoa = () => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const novaPessoa: ProdutividadePerson = {
        id: Date.now().toString(),
        nome: '',
        cargo: '',
        valorHora: 0,
        tempoGasto: 0,
        frequenciaReal: { quantidade: 0, periodo: 'Mensal' },
        frequenciaDesejada: { quantidade: 0, periodo: 'Mensal' }
      }
      const updatedData: BaselineData = {
        ...data,
        pessoas: [...data.pessoas, novaPessoa]
      }
      updateData(updatedData)
    }
  }

  const removePessoa = (index: number) => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const updatedData: BaselineData = {
        ...data,
        pessoas: data.pessoas.filter((_, i) => i !== index)
      }
      updateData(updatedData)
    }
  }

  const updatePessoa = (index: number, field: string, value: any) => {
    if (data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data) {
      const updatedPessoas = [...data.pessoas]
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        updatedPessoas[index] = {
          ...updatedPessoas[index],
          [parent]: {
            ...updatedPessoas[index][parent as keyof ProdutividadePerson],
            [child]: value
          }
        } as ProdutividadePerson
      } else {
        updatedPessoas[index] = {
          ...updatedPessoas[index],
          [field]: value
        }
      }
      const updatedData: BaselineData = {
        ...data,
        pessoas: updatedPessoas,
        custoTotalBaseline: calcularCustoTotalBaseline(updatedPessoas)
      }
      updateData(updatedData)
    }
  }

  const addFerramenta = () => {
    if (data.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in data) {
      const novaFerramenta: CustosRelacionadosTool = {
        id: Date.now().toString(),
        nomeFerramenta: '',
        custoMensal: 0,
        outrosCustos: 0
      }
      const updatedData: BaselineData = {
        ...data,
        ferramentas: [...data.ferramentas, novaFerramenta]
      }
      updateData(updatedData)
    }
  }

  const removeFerramenta = (index: number) => {
    if (data.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in data) {
      const updatedData: BaselineData = {
        ...data,
        ferramentas: data.ferramentas.filter((_, i) => i !== index)
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
      const updatedData: BaselineData = {
        ...data,
        ferramentas: updatedFerramentas
      }
      updateData(updatedData)
    }
  }

  // Funções para CAPACIDADE ANALÍTICA
  const addCampoQualitativo = () => {
    if (data.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in data) {
      const novoCampo = {
        id: Date.now().toString(),
        criterio: '',
        valor: ''
      }
      const updatedData: BaselineData = {
        ...data,
        camposQualitativos: [...data.camposQualitativos, novoCampo]
      }
      updateData(updatedData)
    }
  }

  const removeCampoQualitativo = (index: number) => {
    if (data.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in data) {
      const updatedData: BaselineData = {
        ...data,
        camposQualitativos: data.camposQualitativos.filter((_, i) => i !== index)
      }
      updateData(updatedData)
    }
  }

  const updateCampoQualitativo = (index: number, field: string, value: string) => {
    if (data.tipo === 'CAPACIDADE ANALÍTICA' && 'camposQualitativos' in data) {
      const updatedCampos = [...data.camposQualitativos]
      updatedCampos[index] = {
        ...updatedCampos[index],
        [field]: value
      }
      const updatedData: BaselineData = {
        ...data,
        camposQualitativos: updatedCampos
      }
      updateData(updatedData)
    }
  }

  // Funções para QUALIDADE DECISÃO
  const addCriterio = () => {
    if (data.tipo === 'QUALIDADE DECISÃO' && 'criterios' in data) {
      const novoCriterio = {
        id: Date.now().toString(),
        nome: '',
        avaliacao: 0
      }
      const updatedCriterios = [...data.criterios, novoCriterio]
      const scoreMedio = updatedCriterios.length > 0
        ? updatedCriterios.reduce((sum, c) => sum + c.avaliacao, 0) / updatedCriterios.length
        : 0
      const updatedData: BaselineData = {
        ...data,
        criterios: updatedCriterios,
        scoreMedio
      }
      updateData(updatedData)
    }
  }

  const removeCriterio = (index: number) => {
    if (data.tipo === 'QUALIDADE DECISÃO' && 'criterios' in data) {
      const updatedCriterios = data.criterios.filter((_, i) => i !== index)
      const scoreMedio = updatedCriterios.length > 0
        ? updatedCriterios.reduce((sum, c) => sum + c.avaliacao, 0) / updatedCriterios.length
        : 0
      const updatedData: BaselineData = {
        ...data,
        criterios: updatedCriterios,
        scoreMedio
      }
      updateData(updatedData)
    }
  }

  const updateCriterio = (index: number, field: string, value: any) => {
    if (data.tipo === 'QUALIDADE DECISÃO' && 'criterios' in data) {
      const updatedCriterios = [...data.criterios]
      updatedCriterios[index] = {
        ...updatedCriterios[index],
        [field]: value
      }
      const scoreMedio = updatedCriterios.length > 0
        ? updatedCriterios.reduce((sum, c) => sum + c.avaliacao, 0) / updatedCriterios.length
        : 0
      const updatedData: BaselineData = {
        ...data,
        criterios: updatedCriterios,
        scoreMedio
      }
      updateData(updatedData)
    }
  }

  return (
    <Tooltip.Provider>
      <div className="space-y-6">
        {/* Renderização condicional baseada no tipo (tipo vem da aba INFO) */}
        {tipoBaseline === 'PRODUTIVIDADE' && data.tipo === 'PRODUTIVIDADE' && (
          <div className="space-y-6">
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

              {data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data && data.pessoas.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                  Nenhuma pessoa adicionada. Clique em "Adicionar Pessoa" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data && data.pessoas.map((pessoa, index) => (
                    <div
                      key={pessoa.id || index}
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
                            value={pessoa.nome}
                            onChange={(e) => updatePessoa(index, 'nome', e.target.value)}
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
                            value={pessoa.cargo}
                            onChange={(e) => updatePessoa(index, 'cargo', e.target.value)}
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
                            Tempo Gasto (min)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formatNumberValue(pessoa.tempoGasto)}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              updatePessoa(index, 'tempoGasto', val)
                            }}
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
                              value={formatNumberValue(pessoa.frequenciaReal.quantidade)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updatePessoa(index, 'frequenciaReal.quantidade', val)
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              placeholder="0"
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
                              value={formatNumberValue(pessoa.frequenciaDesejada.quantidade)}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updatePessoa(index, 'frequenciaDesejada.quantidade', val)
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              placeholder="0"
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
                  ))}
                </div>
              )}

              {/* Custo Total Baseline Calculado */}
              {data.tipo === 'PRODUTIVIDADE' && 'pessoas' in data && data.pessoas.length > 0 && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Custo Total Baseline (Mensal):
                    </span>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      R$ {calcularCustoTotalBaseline(data.pessoas).toLocaleString('pt-BR', {
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

        {tipoBaseline === 'INCREMENTO RECEITA' && data.tipo === 'INCREMENTO RECEITA' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
              Valor da Receita Antes (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={data.tipo === 'INCREMENTO RECEITA' ? formatNumberValue(data.valorReceitaAntes) : ''}
              onChange={(e) => {
                const updatedData: BaselineData = {
                  tipo: 'INCREMENTO RECEITA',
                  valorReceitaAntes: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                }
                updateData(updatedData)
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        )}

        {tipoBaseline === 'CUSTOS RELACIONADOS' && data.tipo === 'CUSTOS RELACIONADOS' && (
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

              {data.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in data && data.ferramentas.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                  Nenhuma ferramenta adicionada. Clique em "Adicionar Ferramenta" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.tipo === 'CUSTOS RELACIONADOS' && 'ferramentas' in data && data.ferramentas.map((ferramenta, index) => (
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
                            value={ferramenta.nomeFerramenta}
                            onChange={(e) => updateFerramenta(index, 'nomeFerramenta', e.target.value)}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tipoBaseline === 'OUTROS' && data.tipo === 'OUTROS' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                Nome do Indicador
              </label>
              <input
                type="text"
                value={data.nomeIndicador}
                onChange={(e) => {
                  const updatedData: BaselineData = {
                    tipo: 'OUTROS',
                    nomeIndicador: e.target.value,
                    valorIndicador: data.valorIndicador
                  }
                  updateData(updatedData)
                }}
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
                value={data.tipo === 'OUTROS' ? formatNumberValue(data.valorIndicador) : ''}
                onChange={(e) => {
                  const updatedData: BaselineData = {
                    tipo: 'OUTROS',
                    nomeIndicador: data.tipo === 'OUTROS' ? data.nomeIndicador : '',
                    valorIndicador: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                  }
                  updateData(updatedData)
                }}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* CAPACIDADE ANALÍTICA */}
        {tipoBaseline === 'CAPACIDADE ANALÍTICA' && data.tipo === 'CAPACIDADE ANALÍTICA' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Campos Qualitativos de Análise
                </h3>
                <button
                  type="button"
                  onClick={addCampoQualitativo}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Campo
                </button>
              </div>

              {data.camposQualitativos.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                  Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.camposQualitativos.map((campo, index) => (
                    <div
                      key={campo.id || index}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Campo {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeCampoQualitativo(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Critério
                          </label>
                          <input
                            type="text"
                            value={campo.criterio}
                            onChange={(e) => updateCampoQualitativo(index, 'criterio', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="Nome do critério"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Valor
                          </label>
                          <input
                            type="text"
                            value={campo.valor}
                            onChange={(e) => updateCampoQualitativo(index, 'valor', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="Valor qualitativo"
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

        {/* MELHORIA MARGEM */}
        {tipoBaseline === 'MELHORIA MARGEM' && data.tipo === 'MELHORIA MARGEM' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                Tipo de Margem
              </label>
              <select
                value={data.tipoMargem}
                onChange={(e) => {
                  const updatedData: BaselineData = {
                    ...data,
                    tipoMargem: e.target.value as 'percentual' | 'valor'
                  }
                  updateData(updatedData)
                }}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              >
                <option value="percentual">Percentual (%)</option>
                <option value="valor">Valor (R$)</option>
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Margem Atual {data.tipoMargem === 'percentual' ? '(%)' : '(R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.tipo === 'MELHORIA MARGEM' ? formatNumberValue(data.margemAtual) : ''}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        margemAtual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Margem Projetada {data.tipoMargem === 'percentual' ? '(%)' : '(R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.tipo === 'MELHORIA MARGEM' ? formatNumberValue(data.margemProjetada) : ''}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        margemProjetada: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REDUÇÃO DE RISCO */}
        {tipoBaseline === 'REDUÇÃO DE RISCO' && data.tipo === 'REDUÇÃO DE RISCO' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Probabilidade (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={data.tipo === 'REDUÇÃO DE RISCO' ? formatNumberValue(data.probabilidade) : ''}
                    onChange={(e) => {
                      const prob = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      const impacto = data.tipo === 'REDUÇÃO DE RISCO' ? data.impactoFinanceiro : 0
                      const valorEvitado = (prob / 100) * impacto
                      const updatedData: BaselineData = {
                        ...data,
                        probabilidade: prob,
                        valorEvitado
                      } as BaselineData
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Impacto Financeiro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.tipo === 'REDUÇÃO DE RISCO' ? formatNumberValue(data.impactoFinanceiro) : ''}
                    onChange={(e) => {
                      const impacto = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      const prob = data.tipo === 'REDUÇÃO DE RISCO' ? data.probabilidade : 0
                      const valorEvitado = (prob / 100) * impacto
                      const updatedData: BaselineData = {
                        ...data,
                        impactoFinanceiro: impacto,
                        valorEvitado
                      } as BaselineData
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Valor Evitado (R$):
                  </span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    R$ {data.valorEvitado.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUALIDADE DECISÃO */}
        {tipoBaseline === 'QUALIDADE DECISÃO' && data.tipo === 'QUALIDADE DECISÃO' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Critérios de Decisão
                </h3>
                <button
                  type="button"
                  onClick={addCriterio}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Critério
                </button>
              </div>

              {data.criterios.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                  Nenhum critério adicionado. Clique em "Adicionar Critério" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.criterios.map((criterio, index) => (
                    <div
                      key={criterio.id || index}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Critério {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeCriterio(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Nome do Critério
                          </label>
                          <input
                            type="text"
                            value={criterio.nome}
                            onChange={(e) => updateCriterio(index, 'nome', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="Nome do critério"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                            Avaliação (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formatNumberValue(criterio.avaliacao)}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              updateCriterio(index, 'avaliacao', val)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.criterios.length > 0 && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Score Médio:
                    </span>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {data.scoreMedio.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VELOCIDADE */}
        {tipoBaseline === 'VELOCIDADE' && data.tipo === 'VELOCIDADE' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Tempo Inicial do Processo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.tipo === 'VELOCIDADE' ? formatNumberValue(data.tempoInicialProcesso) : ''}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        tempoInicialProcesso: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      } as BaselineData
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Unidade de Tempo
                  </label>
                  <select
                    value={data.unidadeTempo}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        unidadeTempo: e.target.value as 'minutos' | 'horas' | 'dias'
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="minutos">Minutos</option>
                    <option value="horas">Horas</option>
                    <option value="dias">Dias</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SATISFAÇÃO */}
        {tipoBaseline === 'SATISFAÇÃO' && data.tipo === 'SATISFAÇÃO' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                  Tipo de Score
                </label>
                <select
                  value={data.tipoScore}
                  onChange={(e) => {
                    const updatedData: BaselineData = {
                      ...data,
                      tipoScore: e.target.value as 'NPS' | 'eNPS' | 'outro'
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                >
                  <option value="NPS">NPS (Net Promoter Score)</option>
                  <option value="eNPS">eNPS (Employee Net Promoter Score)</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                  Score Atual (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={data.tipo === 'SATISFAÇÃO' ? formatNumberValue(data.scoreAtual) : ''}
                  onChange={(e) => {
                    const updatedData: BaselineData = {
                      ...data,
                      scoreAtual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    } as BaselineData
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Tooltip.Provider>
  )
}

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
          receitaBrutaMensal: 0,
          custoTotalMensal: 0,
          margemBrutaAtual: 0,
          volumeTransacoes: 0
        } as BaselineData
      case 'REDUÇÃO DE RISCO':
        return {
          tipo: 'REDUÇÃO DE RISCO',
          tipoRisco: '',
          probabilidadeAtual: 0,
          impactoFinanceiro: 0,
          frequenciaAvaliacao: 0,
          periodoAvaliacao: 'mês',
          custoMitigacaoAtual: 0
        } as BaselineData
      case 'QUALIDADE DECISÃO':
        return {
          tipo: 'QUALIDADE DECISÃO',
          numeroDecisoesPeriodo: 0,
          periodo: 'mês',
          taxaAcertoAtual: 0,
          custoMedioDecisaoErrada: 0,
          tempoMedioDecisao: 0,
          pessoasEnvolvidas: 0,
          valorHoraMedio: 0
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
            receitaBrutaMensal: 0,
            custoTotalMensal: 0,
            margemBrutaAtual: 0,
            volumeTransacoes: 0
          } as BaselineData)
          break
        case 'REDUÇÃO DE RISCO':
          setData({
            tipo: 'REDUÇÃO DE RISCO',
            tipoRisco: '',
            probabilidadeAtual: 0,
            impactoFinanceiro: 0,
            frequenciaAvaliacao: 0,
            periodoAvaliacao: 'mês',
            custoMitigacaoAtual: 0
          } as BaselineData)
          break
        case 'QUALIDADE DECISÃO':
          setData({
            tipo: 'QUALIDADE DECISÃO',
            numeroDecisoesPeriodo: 0,
            periodo: 'mês',
            taxaAcertoAtual: 0,
            custoMedioDecisaoErrada: 0,
            tempoMedioDecisao: 0,
            pessoasEnvolvidas: 0,
            valorHoraMedio: 0
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
                    value={formatNumberValue(data.receitaBrutaMensal)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        receitaBrutaMensal: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    value={formatNumberValue(data.custoTotalMensal)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        custoTotalMensal: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    value={formatNumberValue(data.margemBrutaAtual)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        margemBrutaAtual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Margem Bruta = ((Receita - Custo) / Receita) × 100
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Volume de Transações/Mês
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatNumberValue(data.volumeTransacoes)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        volumeTransacoes: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Resumo Calculado */}
              {data.receitaBrutaMensal > 0 && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Resumo Baseline</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Receita Mensal:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        R$ {data.receitaBrutaMensal.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Custo Mensal:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        R$ {data.custoTotalMensal.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Margem Bruta:</span>
                      <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                        {data.margemBrutaAtual.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Lucro Bruto Mensal:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        R$ {(data.receitaBrutaMensal - data.custoTotalMensal).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REDUÇÃO DE RISCO */}
        {tipoBaseline === 'REDUÇÃO DE RISCO' && data.tipo === 'REDUÇÃO DE RISCO' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Dados de Baseline - Redução de Risco
              </h3>
              
              {/* Tipo de Risco */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Tipo de Risco (descrição)
                </label>
                <input
                  type="text"
                  value={data.tipoRisco || ''}
                  onChange={(e) => {
                    const updatedData: BaselineData = {
                      ...data,
                      tipoRisco: e.target.value
                    }
                    updateData(updatedData)
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Falha de segurança, perda de dados, interrupção de serviço"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Probabilidade Atual */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Probabilidade de Ocorrência Atual (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formatNumberValue(data.probabilidadeAtual)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        probabilidadeAtual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Probabilidade de o risco ocorrer (0-100%)
                  </p>
                </div>

                {/* Impacto Financeiro */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Impacto Financeiro se Ocorrer (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formatNumberValue(data.impactoFinanceiro)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        impactoFinanceiro: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Custo estimado se o risco se materializar
                  </p>
                </div>

                {/* Frequência de Avaliação */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Frequência de Avaliação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formatNumberValue(data.frequenciaAvaliacao)}
                      onChange={(e) => {
                        const updatedData: BaselineData = {
                          ...data,
                          frequenciaAvaliacao: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                        }
                        updateData(updatedData)
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                    <select
                      value={data.periodoAvaliacao}
                      onChange={(e) => {
                        const updatedData: BaselineData = {
                          ...data,
                          periodoAvaliacao: e.target.value as 'dia' | 'semana' | 'mês' | 'ano'
                        }
                        updateData(updatedData)
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="dia">por dia</option>
                      <option value="semana">por semana</option>
                      <option value="mês">por mês</option>
                      <option value="ano">por ano</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Quantas vezes o risco é avaliado
                  </p>
                </div>

                {/* Custo de Mitigação Atual */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Custo de Mitigação Atual (R$/mês)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formatNumberValue(data.custoMitigacaoAtual)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        custoMitigacaoAtual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Custo mensal para mitigar/monitorar o risco
                  </p>
                </div>
              </div>

              {/* Resumo Calculado */}
              {data.probabilidadeAtual > 0 && data.impactoFinanceiro > 0 && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Exposição ao Risco (Baseline)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Probabilidade:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        {data.probabilidadeAtual.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Impacto:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        R$ {data.impactoFinanceiro.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Exposição Esperada:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        R$ {((data.probabilidadeAtual / 100) * data.impactoFinanceiro).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Custo Mitigação/Mês:</span>
                      <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                        R$ {data.custoMitigacaoAtual.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUALIDADE DECISÃO */}
        {tipoBaseline === 'QUALIDADE DECISÃO' && data.tipo === 'QUALIDADE DECISÃO' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Dados de Baseline - Qualidade de Decisão
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Número de Decisões/Período */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Número de Decisões
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formatNumberValue(data.numeroDecisoesPeriodo)}
                      onChange={(e) => {
                        const updatedData: BaselineData = {
                          ...data,
                          numeroDecisoesPeriodo: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                        }
                        updateData(updatedData)
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                    <select
                      value={data.periodo}
                      onChange={(e) => {
                        const updatedData: BaselineData = {
                          ...data,
                          periodo: e.target.value as 'dia' | 'semana' | 'mês'
                        }
                        updateData(updatedData)
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="dia">por dia</option>
                      <option value="semana">por semana</option>
                      <option value="mês">por mês</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Quantas decisões são tomadas
                  </p>
                </div>

                {/* Taxa de Acerto Atual */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Taxa de Acerto Atual (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formatNumberValue(data.taxaAcertoAtual)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        taxaAcertoAtual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Percentual de decisões corretas
                  </p>
                </div>

                {/* Custo Médio de Decisão Errada */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Custo Médio de Decisão Errada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formatNumberValue(data.custoMedioDecisaoErrada)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        custoMedioDecisaoErrada: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Custo estimado por decisão incorreta
                  </p>
                </div>

                {/* Tempo Médio por Decisão */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Tempo Médio por Decisão (minutos)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatNumberValue(data.tempoMedioDecisao)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        tempoMedioDecisao: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tempo gasto por decisão
                  </p>
                </div>

                {/* Pessoas Envolvidas */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Pessoas Envolvidas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatNumberValue(data.pessoasEnvolvidas)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        pessoasEnvolvidas: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Número de pessoas no processo decisório
                  </p>
                </div>

                {/* Valor/Hora Médio */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    Valor/Hora Médio (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formatNumberValue(data.valorHoraMedio)}
                    onChange={(e) => {
                      const updatedData: BaselineData = {
                        ...data,
                        valorHoraMedio: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      }
                      updateData(updatedData)
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Custo médio por hora das pessoas envolvidas
                  </p>
                </div>
              </div>

              {/* Resumo Calculado */}
              {data.numeroDecisoesPeriodo > 0 && data.taxaAcertoAtual > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Resumo Baseline</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Decisões/{data.periodo}:</span>
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                        {data.numeroDecisoesPeriodo}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Taxa de Acerto:</span>
                      <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                        {data.taxaAcertoAtual.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Decisões Erradas:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        {Math.round(data.numeroDecisoesPeriodo * (1 - data.taxaAcertoAtual / 100))}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Custo de Erros:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        R$ {(Math.round(data.numeroDecisoesPeriodo * (1 - data.taxaAcertoAtual / 100)) * data.custoMedioDecisaoErrada).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
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

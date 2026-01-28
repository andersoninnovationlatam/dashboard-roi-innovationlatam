import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { indicatorDataService } from '../../services/indicatorDataService'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import PessoaForm from '../../components/indicators/PessoaForm'
import IAForm from '../../components/indicators/IAForm'
import CustoForm from '../../components/indicators/CustoForm'
import { BaselineTab } from '../../src/features/projects/BaselineTab'
import { PostIATab } from '../../src/features/projects/PostIATab'
import { TIPOS_INDICADOR, CAMPOS_POR_TIPO } from '../../config/indicatorTypes'

const IndicatorForm = () => {
  const { id, indicatorId } = useParams()
  const navigate = useNavigate()
  const { getProjectById, getIndicatorById, createIndicator, updateIndicator } = useData()
  
  const project = getProjectById(id)
  const isEditing = !!indicatorId

  const [formData, setFormData] = useState({
    nome: '',
    tipoIndicador: 'Produtividade',
    descricao: '',
    camposEspecificos: {},
    baseline: {
      pessoas: []
    },
    baselineData: null, // Dados estruturados de baseline (JSONB)
    postIAData: null, // Dados estruturados de Pós-IA (JSONB)
    comIA: {
      precisaValidacao: false,
      pessoas: [],
      ias: []
    },
    custos: []
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    // Só carrega dados quando indicatorId muda (não inclui dataLoaded nas dependências para evitar loop)
    if (isEditing && indicatorId) {
      // Carrega dados de todas as abas usando o novo serviço
      const infoData = indicatorDataService.getInfo(indicatorId)
      const baselineData = indicatorDataService.getBaseline(indicatorId)
      const iaData = indicatorDataService.getIA(indicatorId)
      const custosData = indicatorDataService.getCustos(indicatorId)
      
      // Normaliza pessoas do baseline para incluir periodoOperacoesTotal
      const pessoasBaseline = (baselineData?.pessoas || []).map(pessoa => ({
        ...pessoa,
        periodoOperacoesTotal: pessoa.periodoOperacoesTotal || 'dias'
      }))
      
      // Normaliza pessoas da IA para incluir periodoOperacoesTotal
      const pessoasIA = (iaData?.pessoas || []).map(pessoa => ({
        ...pessoa,
        periodoOperacoesTotal: pessoa.periodoOperacoesTotal || 'dias'
      }))
      
      // Tenta carregar baselineData estruturado do localStorage
      let baselineDataStructured = null
      try {
        if (baselineData && typeof baselineData === 'object' && 'baselineData' in baselineData) {
          baselineDataStructured = baselineData.baselineData
        }
      } catch (e) {
        // Se não conseguir parsear, mantém null
      }

      // Tenta carregar postIAData estruturado do localStorage
      let postIADataStructured = null
      try {
        const postIADataRaw = indicatorDataService.getPostIA(indicatorId)
        if (postIADataRaw && typeof postIADataRaw === 'object' && 'postIAData' in postIADataRaw) {
          postIADataStructured = postIADataRaw.postIAData
        }
      } catch (e) {
        // Se não conseguir parsear, mantém null
      }
      
      setFormData({
        nome: infoData?.nome || '',
        tipoIndicador: infoData?.tipoIndicador || 'Produtividade',
        descricao: infoData?.descricao || '',
        camposEspecificos: infoData?.camposEspecificos || {},
        baseline: {
          pessoas: pessoasBaseline
        },
        baselineData: baselineDataStructured,
        postIAData: postIADataStructured,
        comIA: {
          precisaValidacao: iaData?.precisaValidacao || false,
          pessoas: pessoasIA,
          ias: iaData?.ias || []
        },
        custos: custosData?.custos || []
      })
    } else if (!isEditing) {
      // Se não está editando, reseta o formData
      setFormData({
        nome: '',
        tipoIndicador: 'Produtividade',
        descricao: '',
        camposEspecificos: {},
        baseline: {
          pessoas: []
        },
        baselineData: null,
        postIAData: null,
        comIA: {
          precisaValidacao: false,
          pessoas: [],
          ias: []
        },
        custos: []
      })
    }
  }, [indicatorId, isEditing]) // Só depende de indicatorId e isEditing

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleCampoEspecificoChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      camposEspecificos: {
        ...prev.camposEspecificos,
        [key]: value
      }
    }))
  }

  const handleTipoIndicadorChange = (tipo) => {
    const novoCamposConfig = CAMPOS_POR_TIPO[tipo] || CAMPOS_POR_TIPO['Produtividade']
    
    // Função para limpar campos irrelevantes de uma pessoa
    const limparCamposPessoa = (pessoa) => {
      const pessoaLimpa = {
        nome: pessoa.nome || '',
        funcao: pessoa.funcao || ''
      }
      
      if (novoCamposConfig.baseline.mostraValorHora) pessoaLimpa.valorHora = pessoa.valorHora || ''
      if (novoCamposConfig.baseline.mostraTempoOperacao) pessoaLimpa.tempoOperacao = pessoa.tempoOperacao || ''
      if (novoCamposConfig.baseline.mostraTempoEntrega) pessoaLimpa.tempoEntrega = pessoa.tempoEntrega || ''
      if (novoCamposConfig.baseline.mostraQuantidadeOperacoes) {
        pessoaLimpa.quantidadeOperacoesTotal = pessoa.quantidadeOperacoesTotal || ''
        pessoaLimpa.periodoOperacoesTotal = pessoa.periodoOperacoesTotal || 'dias'
      }
      if (novoCamposConfig.baseline.mostraValorPorAnalise) pessoaLimpa.valorPorAnalise = pessoa.valorPorAnalise || ''
      if (novoCamposConfig.baseline.mostraImpactoEvitado) pessoaLimpa.impactoEvitado = pessoa.impactoEvitado || ''
      
      return pessoaLimpa
    }
    
    // Função para limpar campos irrelevantes de uma IA
    const limparCamposIA = (ia) => {
      const iaLimpa = {
        nome: ia.nome || '',
        capacidadeProcessamento: ia.capacidadeProcessamento || '',
        precisao: ia.precisao || '',
        taxaErro: ia.taxaErro || '',
        custoPorOperacao: ia.custoPorOperacao || ''
      }
      
      if (novoCamposConfig.ia.mostraTempoExecucao) iaLimpa.tempoExecucao = ia.tempoExecucao || ''
      if (novoCamposConfig.ia.mostraQuantidadeOperacoes) {
        iaLimpa.quantidadeOperacoes = ia.quantidadeOperacoes || ''
        iaLimpa.periodoOperacoes = ia.periodoOperacoes || 'dias'
      }
      if (novoCamposConfig.ia.mostraValorPorAnalise) iaLimpa.valorPorAnalise = ia.valorPorAnalise || ''
      if (novoCamposConfig.ia.mostraImpactoEvitado) iaLimpa.impactoEvitado = ia.impactoEvitado || ''
      
      return iaLimpa
    }
    
    setFormData(prev => ({
      ...prev,
      tipoIndicador: tipo,
      camposEspecificos: {}, // Limpa campos específicos ao mudar tipo
      baselineData: null, // Reseta baselineData quando tipo muda
      baseline: {
        pessoas: prev.baseline.pessoas.map(limparCamposPessoa)
      },
      comIA: {
        ...prev.comIA,
        pessoas: prev.comIA.pessoas.map(limparCamposPessoa),
        ias: prev.comIA.ias.map(limparCamposIA)
      }
    }))
    // Força atualização do componente
    setForceUpdate(prev => prev + 1)
  }

  // Recalcula camposConfig sempre que tipoIndicador mudar
  const camposConfig = useMemo(() => {
    return CAMPOS_POR_TIPO[formData.tipoIndicador] || CAMPOS_POR_TIPO['Produtividade']
  }, [formData.tipoIndicador, forceUpdate])

  const addPessoaBaseline = () => {
    const camposConfig = CAMPOS_POR_TIPO[formData.tipoIndicador] || CAMPOS_POR_TIPO['Produtividade']
    const novaPessoa = {
      nome: '',
      funcao: ''
    }
    
    if (camposConfig.baseline.mostraValorHora) novaPessoa.valorHora = ''
    if (camposConfig.baseline.mostraTempoOperacao) novaPessoa.tempoOperacao = ''
    if (camposConfig.baseline.mostraTempoEntrega) novaPessoa.tempoEntrega = ''
    if (camposConfig.baseline.mostraQuantidadeOperacoes) {
      novaPessoa.quantidadeOperacoesTotal = ''
      novaPessoa.periodoOperacoesTotal = 'dias'
    }
    if (camposConfig.baseline.mostraValorPorAnalise) novaPessoa.valorPorAnalise = ''
    if (camposConfig.baseline.mostraImpactoEvitado) novaPessoa.impactoEvitado = ''
    
    setFormData(prev => ({
      ...prev,
      baseline: {
        ...prev.baseline,
        pessoas: [...prev.baseline.pessoas, novaPessoa]
      }
    }))
  }

  const updatePessoaBaseline = (index, field, value) => {
    setFormData(prev => {
      const novasPessoas = [...prev.baseline.pessoas]
      novasPessoas[index] = {
        ...novasPessoas[index],
        [field]: value
      }
      return {
        ...prev,
        baseline: {
          ...prev.baseline,
          pessoas: novasPessoas
        }
      }
    })
  }

  const removePessoaBaseline = (index) => {
    setFormData(prev => {
      const novasPessoas = prev.baseline.pessoas.filter((_, i) => i !== index)
      return {
        ...prev,
        baseline: {
          ...prev.baseline,
          pessoas: novasPessoas
        }
      }
    })
  }

  const addPessoaIA = () => {
    const novaPessoa = {
      nome: '',
      funcao: ''
    }
    
    if (camposConfig.baseline.mostraValorHora) novaPessoa.valorHora = ''
    if (camposConfig.baseline.mostraTempoOperacao) novaPessoa.tempoOperacao = ''
    if (camposConfig.baseline.mostraTempoEntrega) novaPessoa.tempoEntrega = ''
    if (camposConfig.baseline.mostraQuantidadeOperacoes) {
      novaPessoa.quantidadeOperacoesTotal = ''
      novaPessoa.periodoOperacoesTotal = 'dias'
    }
    if (camposConfig.baseline.mostraValorPorAnalise) novaPessoa.valorPorAnalise = ''
    if (camposConfig.baseline.mostraImpactoEvitado) novaPessoa.impactoEvitado = ''
    
    setFormData(prev => ({
      ...prev,
      comIA: {
        ...prev.comIA,
        pessoas: [...prev.comIA.pessoas, novaPessoa]
      }
    }))
  }

  const updatePessoaIA = (index, field, value) => {
    setFormData(prev => {
      const novasPessoas = [...prev.comIA.pessoas]
      novasPessoas[index] = {
        ...novasPessoas[index],
        [field]: value
      }
      return {
        ...prev,
        comIA: {
          ...prev.comIA,
          pessoas: novasPessoas
        }
      }
    })
  }

  const removePessoaIA = (index) => {
    setFormData(prev => {
      const novasPessoas = prev.comIA.pessoas.filter((_, i) => i !== index)
      return {
        ...prev,
        comIA: {
          ...prev.comIA,
          pessoas: novasPessoas
        }
      }
    })
  }

  const addIA = () => {
    const novaIA = {
      nome: '',
      capacidadeProcessamento: '',
      precisao: '',
      taxaErro: '',
      custoPorOperacao: ''
    }
    
    if (camposConfig.ia.mostraTempoExecucao) novaIA.tempoExecucao = ''
    if (camposConfig.ia.mostraQuantidadeOperacoes) {
      novaIA.quantidadeOperacoes = ''
      novaIA.periodoOperacoes = 'dias'
    }
    if (camposConfig.ia.mostraValorPorAnalise) novaIA.valorPorAnalise = ''
    if (camposConfig.ia.mostraImpactoEvitado) novaIA.impactoEvitado = ''
    
    setFormData(prev => ({
      ...prev,
      comIA: {
        ...prev.comIA,
        ias: [...prev.comIA.ias, novaIA]
      }
    }))
  }

  const updateIA = (index, field, value) => {
    setFormData(prev => {
      const novasIAs = [...prev.comIA.ias]
      novasIAs[index] = {
        ...novasIAs[index],
        [field]: value
      }
      return {
        ...prev,
        comIA: {
          ...prev.comIA,
          ias: novasIAs
        }
      }
    })
  }

  const removeIA = (index) => {
    setFormData(prev => {
      const novasIAs = prev.comIA.ias.filter((_, i) => i !== index)
      return {
        ...prev,
        comIA: {
          ...prev.comIA,
          ias: novasIAs
        }
      }
    })
  }

  const addCusto = () => {
    setFormData(prev => ({
      ...prev,
      custos: [
        ...prev.custos,
        {
          nome: '',
          valor: '',
          tipo: 'mensal' // 'mensal' ou 'anual'
        }
      ]
    }))
  }

  const updateCusto = (index, field, value) => {
    setFormData(prev => {
      const novosCustos = [...prev.custos]
      novosCustos[index] = {
        ...novosCustos[index],
        [field]: value
      }
      return {
        ...prev,
        custos: novosCustos
      }
    })
  }

  const removeCusto = (index) => {
    setFormData(prev => ({
      ...prev,
      custos: prev.custos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.nome.trim()) {
      setError('Nome do indicador é obrigatório')
      setLoading(false)
      return
    }

    try {
      let indicatorIdToUse = indicatorId

      // Se é novo indicador, cria metadados primeiro
      if (!isEditing) {
        const createResult = await createIndicator({ projetoId: id })
        if (!createResult.success) {
          setError(createResult.error || 'Erro ao criar indicador')
          setLoading(false)
          return
        }
        indicatorIdToUse = createResult.indicator.id
      } else {
        // Atualiza metadados se necessário
        await updateIndicator(indicatorId, { projetoId: id })
      }

      // Salva dados em arquivos separados por aba
      indicatorDataService.saveInfo(indicatorIdToUse, {
        nome: formData.nome,
        tipoIndicador: formData.tipoIndicador,
        descricao: formData.descricao,
        camposEspecificos: formData.camposEspecificos
      })

      // Salva baseline - prioriza baselineData estruturado se existir
      if (formData.baselineData) {
        indicatorDataService.saveBaseline(indicatorIdToUse, {
          baselineData: formData.baselineData
        })
      } else {
        // Fallback para formato legado (se não houver baselineData estruturado)
        indicatorDataService.saveBaseline(indicatorIdToUse, {
          pessoas: formData.baseline.pessoas
        })
      }

      indicatorDataService.saveIA(indicatorIdToUse, {
        precisaValidacao: formData.comIA.precisaValidacao,
        pessoas: formData.comIA.pessoas,
        ias: formData.comIA.ias
      })

      indicatorDataService.saveCustos(indicatorIdToUse, {
        custos: formData.custos
      })

      // Salva Pós-IA se existir
      if (formData.postIAData) {
        indicatorDataService.savePostIA(indicatorIdToUse, {
          postIAData: formData.postIAData
        })
      }

      navigate(`/projects/${id}/indicators`)
    } catch (error) {
      setError(error.message || 'Erro ao salvar indicador')
    }

    setLoading(false)
  }

  const tabs = [
    { title: 'Info', icon: 'fas fa-info-circle' },
    { title: 'Baseline', icon: 'fas fa-user-clock' },
    { title: 'IA', icon: 'fas fa-robot' },
    { title: 'Custos', icon: 'fas fa-coins' }
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate(`/projects/${id}/indicators`)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
            <i className="fas fa-arrow-left"></i>
        </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Editar Indicador' : 'Novo Indicador'}
        </h1>
        {project && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Projeto: {project.name || project.nome}
              </p>
        )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <Tabs tabs={tabs}>
          {/* Tab 1: Info */}
          <Card>
            <div className="space-y-6">
              <Input
                label="Nome da Tarefa/Indicador"
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange(null, 'nome', e.target.value)}
                required
                placeholder="Ex: Classificação de comentários de NPS"
              />

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Tipo de Indicador <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipoIndicador}
                  onChange={(e) => handleTipoIndicadorChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  {TIPOS_INDICADOR.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Descrição"
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange(null, 'descricao', e.target.value)}
                placeholder="Breve descrição"
              />
            </div>
          </Card>

          {/* Tab 2: Baseline */}
          <Card borderColor="red-500">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-user-clock text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Baseline</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Cenário antes da implementação</p>
                  </div>
                </div>
              </div>

              {/* Componente BaselineTab com seletor de tipo e campos dinâmicos */}
              <BaselineTab
                tipoIndicador={formData.tipoIndicador}
                baselineData={formData.baselineData}
                onBaselineChange={(baselineData) => {
                  setFormData(prev => ({
                    ...prev,
                    baselineData
                  }))
                }}
              />
            </div>
          </Card>

          {/* Tab 3: Pós-IA */}
          <Card borderColor="green-500">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pós-IA</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Cenário após implementação</p>
                  </div>
                </div>
              </div>

              {/* Componente PostIATab com herança do Baseline */}
              <PostIATab
                tipoIndicador={formData.tipoIndicador}
                baselineData={formData.baselineData}
                postIAData={formData.postIAData}
                onPostIAChange={(postIAData) => {
                  setFormData(prev => ({
                    ...prev,
                    postIAData
                  }))
                }}
              />
            </div>
          </Card>

          {/* Tab 4: Custos */}
          <Card borderColor="yellow-500">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-coins text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Custos</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Custos de implementação e manutenção</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addCusto}
                  size="sm"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Adicionar Custo
                </Button>
              </div>

              {formData.custos.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-coins text-3xl text-yellow-500 dark:text-yellow-400"></i>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum custo adicionado</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Clique em "Adicionar Custo" para começar</p>
                </div>
              ) : (
            <div className="space-y-4">
                  {formData.custos.map((custo, index) => (
                    <CustoForm
                      key={index}
                      custo={custo}
                      index={index}
                      onUpdate={(field, value) => updateCusto(index, field, value)}
                      onRemove={() => removeCusto(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Tabs>

        <div className="mt-6 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/projects/${id}/indicators`)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Indicador'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default IndicatorForm

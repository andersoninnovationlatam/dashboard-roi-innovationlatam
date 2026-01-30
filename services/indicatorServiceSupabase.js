/**
 * Serviço de Indicadores com Supabase
 * Gerencia CRUD de indicadores usando Supabase (estrutura normalizada)
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'
import { personInvolvedService } from './personInvolvedService'
import { toolCostService } from './toolCostService'
import { customMetricService } from './customMetricService'
import { calculatedResultsService } from './calculatedResultsService'
import { trackingService } from './trackingService'
import { auditLogService } from './auditLogService'

// Função para validar se um ID é um UUID válido
const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const indicatorServiceSupabase = {
  isValidUUID,

  /**
   * Retorna todos os indicadores da organização do usuário autenticado
   * RLS já filtra automaticamente por organization_id via project
   */
  async getAll(limit = 1000) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      // OTIMIZAÇÃO: Limita resultados e seleciona apenas campos necessários inicialmente
      const { data, error } = await supabase
        .from('indicators_normalized')
        .select('id, project_id, name, description, improvement_type, frequency_value, frequency_unit, baseline_frequency_real, post_ia_frequency, is_active, created_at, updated_at')
        .eq('is_active', true) // Apenas indicadores ativos
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar indicadores:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar indicadores:', error)
      return []
    }
  },

  /**
   * Retorna indicadores de um projeto específico
   */
  async getByProjectId(projectId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    if (projectId && !isValidUUID(projectId)) {
      console.warn(`getByProjectId: projectId inválido (não é UUID): ${projectId}`)
      return []
    }

    try {
      const { data, error } = await supabase
        .from('indicators_normalized')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar indicadores do projeto:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar indicadores do projeto:', error)
      return []
    }
  },

  /**
   * Retorna indicador por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    if (!isValidUUID(id)) {
      console.warn(`ID inválido (não é UUID): ${id}`)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('indicators_normalized')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code !== '22P02') {
          console.error('Erro ao buscar indicador:', error)
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar indicador:', error)
      return null
    }
  },

  /**
   * Transforma formato normalizado para formato legado (compatibilidade)
   * Converte persons_baseline[] para baselineData.pessoas[]
   */
  _transformPersonsToLegacy(persons, scenario = 'baseline') {
    if (!Array.isArray(persons) || persons.length === 0) {
      return []
    }

    return persons.map(person => ({
      nome: person.person_name || person.nome || '',
      cargo: person.role || person.cargo || '',
      funcao: person.role || person.funcao || '', // Compatibilidade com ambos os campos
      valorHora: person.hourly_rate || person.valorHora || 0,
      tempoGasto: person.time_spent_minutes || person.tempoGasto || 0,
      tempoOperacao: person.time_spent_minutes || person.tempoOperacao || 0, // Compatibilidade
      tempoEntrega: person.time_spent_minutes || person.tempoEntrega || 0, // Compatibilidade
      isValidationOnly: person.is_validation_only || person.isValidationOnly || false
    }))
  },

  /**
   * Transforma ferramentas normalizadas para formato legado
   * Converte tools_post_ia[] e tools_baseline[] para ia.ias[] e custos[]
   */
  _transformToolsToLegacy(toolsBaseline, toolsPostIA) {
    const iaData = {
      precisaValidacao: false,
      pessoaEnvolvida: false,
      pessoas: [],
      ias: []
    }

    const custosData = {
      custos: []
    }

    // Transformar ferramentas pós-IA
    if (toolsPostIA && Array.isArray(toolsPostIA) && toolsPostIA.length > 0) {
      toolsPostIA.forEach(tool => {
        if (tool.cost_per_execution) {
          // É uma IA (tem custo por operação)
          iaData.ias.push({
            nome: tool.tool_name || tool.nome || '',
            tempoExecucao: tool.execution_time_seconds || tool.tempoExecucao || 0,
            custoPorOperacao: tool.cost_per_execution || tool.custoPorOperacao || 0,
            categoria: tool.tool_category || tool.categoria || 'other',
            observacoes: tool.notes || tool.observacoes || null
          })
        } else {
          // É um custo mensal
          custosData.custos.push({
            nome: tool.tool_name || tool.nome || '',
            valor: tool.monthly_cost || tool.valor || 0,
            tipo: 'mensal',
            categoria: tool.tool_category || tool.categoria || 'other',
            observacoes: tool.notes || tool.observacoes || null
          })
        }
      })
    }

    // Transformar ferramentas baseline (geralmente são custos)
    if (toolsBaseline && Array.isArray(toolsBaseline) && toolsBaseline.length > 0) {
      toolsBaseline.forEach(tool => {
        custosData.custos.push({
          nome: tool.tool_name || tool.nome || '',
          valor: tool.monthly_cost || tool.valor || 0,
          tipo: 'mensal',
          categoria: tool.tool_category || tool.categoria || 'other',
          observacoes: tool.notes || tool.observacoes || null
        })
      })
    }

    return { iaData, custosData }
  },

  /**
   * Retorna indicador completo com todas as tabelas relacionadas
   */
  async getCompleteById(id) {
    if (!id) {
      console.warn('getCompleteById chamado sem ID')
      return null
    }

    if (!isValidUUID(id)) {
      console.warn(`getCompleteById: ID inválido (não é UUID): ${id}`)
      return null
    }

    try {
      const indicator = await this.getById(id)
      if (!indicator) return null

      // Buscar dados relacionados em paralelo
      const [personsBaseline, personsPostIA, toolsBaseline, toolsPostIA, customMetrics, calculatedResult, trackingHistory] = await Promise.all([
        personInvolvedService.getByIndicatorId(id, 'baseline'),
        personInvolvedService.getByIndicatorId(id, 'post_ia'),
        toolCostService.getByIndicatorId(id, 'baseline'),
        toolCostService.getByIndicatorId(id, 'post_ia'),
        customMetricService.getByIndicatorId(id),
        calculatedResultsService.getLatestByIndicatorId(id),
        trackingService.getByIndicatorId(id)
      ])

      // Mapear improvement_type para tipo do BaselineTab
      const improvementTypeToBaselineType = {
        'productivity': 'PRODUTIVIDADE',
        'analytical_capacity': 'CAPACIDADE ANALÍTICA',
        'revenue_increase': 'INCREMENTO RECEITA',
        'cost_reduction': 'CUSTOS RELACIONADOS',
        'risk_reduction': 'REDUÇÃO DE RISCO',
        'decision_quality': 'QUALIDADE DECISÃO',
        'speed': 'VELOCIDADE',
        'satisfaction': 'SATISFAÇÃO',
        'margin_improvement': 'MELHORIA MARGEM'
      }
      const baselineType = improvementTypeToBaselineType[indicator.improvement_type] || 'PRODUTIVIDADE'

      // Transformar formato normalizado para formato legado (compatibilidade com formulário)
      const pessoasBaselineTransformed = this._transformPersonsToLegacy(personsBaseline, 'baseline')
      const pessoasPostIATransformed = this._transformPersonsToLegacy(personsPostIA, 'post_ia')

      // Adicionar frequenciaReal e frequenciaDesejada baseado nos dados do indicador
      // (Esses campos não estão na tabela persons_involved, então usamos valores do indicador)
      const pessoasBaselineComFrequencia = pessoasBaselineTransformed.map(pessoa => ({
        ...pessoa,
        id: pessoa.id || `pessoa-${Date.now()}-${Math.random()}`,
        frequenciaReal: {
          quantidade: indicator.baseline_frequency_real || 0,
          periodo: indicator.frequency_unit === 'day' ? 'Diário' : 
                   indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal'
        },
        frequenciaDesejada: {
          quantidade: indicator.baseline_frequency_desired || indicator.baseline_frequency_real || 0,
          periodo: indicator.frequency_unit === 'day' ? 'Diário' : 
                   indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal'
        }
      }))

      const pessoasPostIAComFrequencia = pessoasPostIATransformed.map(pessoa => ({
        ...pessoa,
        id: pessoa.id || `pessoa-${Date.now()}-${Math.random()}`,
        frequenciaReal: {
          quantidade: indicator.post_ia_frequency || 0,
          periodo: indicator.frequency_unit === 'day' ? 'Diário' : 
                   indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal'
        },
        frequenciaDesejada: {
          quantidade: indicator.post_ia_frequency || 0,
          periodo: indicator.frequency_unit === 'day' ? 'Diário' : 
                   indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal'
        }
      }))

      // Criar baselineData com estrutura completa esperada pelo BaselineTab
      // Para tipos diferentes de PRODUTIVIDADE, inicializar com campos específicos
      let baselineData = {
        tipo: baselineType
      }

      // Adicionar campos específicos baseado no tipo
      switch (baselineType) {
        case 'PRODUTIVIDADE':
          baselineData = {
            ...baselineData,
            pessoas: pessoasBaselineComFrequencia,
            custoTotalBaseline: 0
          }
          break
        case 'INCREMENTO RECEITA':
          // Buscar valor de custom_metrics se existir
          // Procurar por "Receita Antes" (nome exato) ou qualquer métrica que contenha "receita"
          const receitaMetric = customMetrics?.find(m => 
            m.metric_name === 'Receita Antes' || 
            m.metric_name?.toLowerCase().includes('receita')
          )
          console.log('🔍 getCompleteById - INCREMENTO RECEITA - receitaMetric:', receitaMetric, 'customMetrics:', customMetrics)
          baselineData = {
            ...baselineData,
            valorReceitaAntes: receitaMetric?.baseline_value || 0
          }
          break
        case 'CUSTOS RELACIONADOS':
          // Transformar tools_baseline em ferramentas
          baselineData = {
            ...baselineData,
            ferramentas: (toolsBaseline || []).map(tool => ({
              id: tool.id || `tool-${Date.now()}-${Math.random()}`,
              nomeFerramenta: tool.tool_name || '',
              custoMensal: parseFloat(tool.monthly_cost || 0),
              outrosCustos: 0
            }))
          }
          break
        case 'MELHORIA MARGEM':
          const margemMetrics = customMetrics?.filter(m => 
            m.metric_name?.toLowerCase().includes('receita') ||
            m.metric_name?.toLowerCase().includes('custo') ||
            m.metric_name?.toLowerCase().includes('margem') ||
            m.metric_name?.toLowerCase().includes('volume')
          )
          baselineData = {
            ...baselineData,
            receitaBrutaMensal: margemMetrics?.find(m => m.metric_name?.toLowerCase().includes('receita'))?.baseline_value || 0,
            custoTotalMensal: margemMetrics?.find(m => m.metric_name?.toLowerCase().includes('custo'))?.baseline_value || 0,
            margemBrutaAtual: margemMetrics?.find(m => m.metric_name?.toLowerCase().includes('margem'))?.baseline_value || 0,
            volumeTransacoes: margemMetrics?.find(m => m.metric_name?.toLowerCase().includes('volume'))?.baseline_value || 0
          }
          break
        case 'REDUÇÃO DE RISCO':
          const riscoMetrics = customMetrics?.filter(m => 
            m.metric_name?.toLowerCase().includes('probabilidade') ||
            m.metric_name?.toLowerCase().includes('impacto') ||
            m.metric_name?.toLowerCase().includes('frequencia') ||
            m.metric_name?.toLowerCase().includes('custo')
          )
          baselineData = {
            ...baselineData,
            tipoRisco: '',
            probabilidadeAtual: riscoMetrics?.find(m => m.metric_name?.toLowerCase().includes('probabilidade'))?.baseline_value || 0,
            impactoFinanceiro: riscoMetrics?.find(m => m.metric_name?.toLowerCase().includes('impacto'))?.baseline_value || 0,
            frequenciaAvaliacao: riscoMetrics?.find(m => m.metric_name?.toLowerCase().includes('frequencia'))?.baseline_value || 0,
            periodoAvaliacao: 'mês',
            custoMitigacaoAtual: riscoMetrics?.find(m => m.metric_name?.toLowerCase().includes('custo'))?.baseline_value || 0
          }
          break
        case 'QUALIDADE DECISÃO':
          const decisaoMetrics = customMetrics?.filter(m => 
            m.metric_name?.toLowerCase().includes('decisao') ||
            m.metric_name?.toLowerCase().includes('taxa') ||
            m.metric_name?.toLowerCase().includes('tempo') ||
            m.metric_name?.toLowerCase().includes('pessoa') ||
            m.metric_name?.toLowerCase().includes('valor')
          )
          baselineData = {
            ...baselineData,
            numeroDecisoesPeriodo: decisaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('decisao'))?.baseline_value || 0,
            periodo: 'mês',
            taxaAcertoAtual: decisaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('taxa'))?.baseline_value || 0,
            custoMedioDecisaoErrada: decisaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('custo'))?.baseline_value || 0,
            tempoMedioDecisao: decisaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('tempo'))?.baseline_value || 0,
            pessoasEnvolvidas: decisaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('pessoa'))?.baseline_value || pessoasBaselineComFrequencia.length || 0,
            valorHoraMedio: decisaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('valor'))?.baseline_value || 0
          }
          break
        case 'VELOCIDADE':
          const velocidadeMetrics = customMetrics?.filter(m => 
            m.metric_name?.toLowerCase().includes('tempo') ||
            m.metric_name?.toLowerCase().includes('entrega') ||
            m.metric_name?.toLowerCase().includes('custo') ||
            m.metric_name?.toLowerCase().includes('pessoa') ||
            m.metric_name?.toLowerCase().includes('valor')
          )
          baselineData = {
            ...baselineData,
            tempoMedioEntregaAtual: velocidadeMetrics?.find(m => m.metric_name?.toLowerCase().includes('tempo') || m.metric_name?.toLowerCase().includes('entrega'))?.baseline_value || 0,
            unidadeTempoEntrega: 'dias',
            numeroEntregasPeriodo: velocidadeMetrics?.find(m => m.metric_name?.toLowerCase().includes('entrega'))?.baseline_value || 0,
            periodoEntregas: 'mês',
            custoPorAtraso: velocidadeMetrics?.find(m => m.metric_name?.toLowerCase().includes('custo'))?.baseline_value || 0,
            pessoasEnvolvidas: pessoasBaselineComFrequencia.length || 0,
            valorHoraMedio: velocidadeMetrics?.find(m => m.metric_name?.toLowerCase().includes('valor'))?.baseline_value || 0,
            tempoTrabalhoPorEntrega: velocidadeMetrics?.find(m => m.metric_name?.toLowerCase().includes('trabalho'))?.baseline_value || 0
          }
          break
        case 'SATISFAÇÃO':
          const satisfacaoMetrics = customMetrics?.filter(m => 
            m.metric_name?.toLowerCase().includes('score') ||
            m.metric_name?.toLowerCase().includes('cliente') ||
            m.metric_name?.toLowerCase().includes('churn') ||
            m.metric_name?.toLowerCase().includes('aquisicao') ||
            m.metric_name?.toLowerCase().includes('suporte')
          )
          baselineData = {
            ...baselineData,
            scoreAtual: satisfacaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('score'))?.baseline_value || 0,
            tipoScore: 'NPS',
            numeroClientes: satisfacaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('cliente'))?.baseline_value || 0,
            valorMedioPorCliente: satisfacaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('valor'))?.baseline_value || 0,
            taxaChurnAtual: satisfacaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('churn'))?.baseline_value || 0,
            custoAquisicaoCliente: satisfacaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('aquisicao'))?.baseline_value || 0,
            ticketMedioSuporte: satisfacaoMetrics?.find(m => m.metric_name?.toLowerCase().includes('suporte'))?.baseline_value || 0
          }
          break
        case 'CAPACIDADE ANALÍTICA':
          baselineData = {
            ...baselineData,
            camposQualitativos: []
          }
          break
        default:
          baselineData = {
            ...baselineData,
            nomeIndicador: '',
            valorIndicador: 0
          }
      }

      // Criar postIAData com estrutura completa esperada pelo PostIATab
      let postIAData = {
        tipo: baselineType
      }

      // Para postIA, usar mesma estrutura mas com valores pós-IA
      switch (baselineType) {
        case 'PRODUTIVIDADE':
          postIAData = {
            ...postIAData,
            pessoas: pessoasPostIAComFrequencia
          }
          break
        case 'INCREMENTO RECEITA':
          const receitaPostIAMetric = customMetrics?.find(m => 
            m.metric_name === 'Receita Antes' || 
            m.metric_name?.toLowerCase().includes('receita')
          )
          console.log('🔍 getCompleteById - INCREMENTO RECEITA (PostIA) - receitaPostIAMetric:', receitaPostIAMetric)
          postIAData = {
            ...postIAData,
            valorReceitaDepois: receitaPostIAMetric?.post_ia_value || 0
          }
          break
        // Para outros tipos, manter estrutura básica
        default:
          postIAData = {
            ...postIAData,
            pessoas: pessoasPostIAComFrequencia
          }
      }

      // Debug: Log para verificar dados transformados
      console.log('🔍 getCompleteById - Dados transformados:', {
        baselineType,
        pessoasBaselineCount: pessoasBaselineComFrequencia.length,
        pessoasPostIACount: pessoasPostIAComFrequencia.length,
        baselineData,
        postIAData
      })

      // Criar info_data no formato legado para compatibilidade com formulário
      const improvementTypeToLegacyType = {
        'productivity': 'Produtividade',
        'analytical_capacity': 'Capacidade Analítica',
        'revenue_increase': 'Incremento Receita',
        'cost_reduction': 'Custos Relacionados',
        'risk_reduction': 'Redução de Risco',
        'decision_quality': 'Qualidade Decisão',
        'speed': 'Velocidade',
        'satisfaction': 'Satisfação',
        'margin_improvement': 'Melhoria Margem'
      }
      
      const tipoIndicadorLegado = improvementTypeToLegacyType[indicator.improvement_type] || 'Produtividade'
      
      const infoDataLegado = {
        nome: indicator.name || '',
        tipoIndicador: tipoIndicadorLegado,
        descricao: indicator.description || '',
        camposEspecificos: {} // Pode ser expandido se necessário
      }

      console.log('🔍 getCompleteById - info_data criado:', {
        improvement_type: indicator.improvement_type,
        tipoIndicadorLegado,
        infoDataLegado
      })

      const { iaData, custosData } = this._transformToolsToLegacy(toolsBaseline, toolsPostIA)

      return {
        ...indicator,
        // Formato normalizado (para uso futuro e serviços internos)
        persons_baseline: personsBaseline,
        persons_post_ia: personsPostIA,
        tools_baseline: toolsBaseline,
        tools_post_ia: toolsPostIA,
        custom_metrics: customMetrics,
        calculated_result: calculatedResult,
        tracking_history: trackingHistory,
        // Formato legado (para compatibilidade com formulário atual)
        info_data: infoDataLegado,
        baselineData: baselineData,
        postIAData: postIAData,
        ia: iaData,
        custos: custosData.custos || []
      }
    } catch (error) {
      console.error('Erro ao buscar indicador completo:', error)
      return null
    }
  },

  /**
   * Cria um novo indicador com todas as tabelas relacionadas
   */
  async create(indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Validar project_id
      const projectId = indicatorData.project_id || indicatorData.projectId || indicatorData.projetoId
      if (!projectId || !isValidUUID(projectId)) {
        return { success: false, error: 'project_id inválido ou não fornecido' }
      }

      // ============================================================================
      // TRANSFORMAÇÃO DE FORMATO ANTIGO (JSONB) PARA FORMATO NORMALIZADO
      // ============================================================================
      
      // Transformar info_data para campos normalizados
      let name = indicatorData.name
      let description = indicatorData.description
      let improvement_type = indicatorData.improvement_type

      if (indicatorData.info_data) {
        const infoData = indicatorData.info_data
        if (infoData.nome) name = infoData.nome
        if (infoData.descricao) description = infoData.descricao
        
        // Mapear tipoIndicador para improvement_type
        if (infoData.tipoIndicador) {
          const tipoMap = {
            'Produtividade': 'productivity',
            'Capacidade Analítica': 'analytical_capacity',
            'Incremento Receita': 'revenue_increase',
            'Custos Relacionados': 'cost_reduction',
            'Redução de Risco': 'risk_reduction',
            'Qualidade Decisão': 'decision_quality',
            'Velocidade': 'speed',
            'Satisfação': 'satisfaction',
            'Melhoria Margem': 'margin_improvement'
          }
          improvement_type = tipoMap[infoData.tipoIndicador] || 'productivity'
        }
      }

      // Transformar baseline_data.pessoas[] → persons_baseline[]
      if (indicatorData.baseline_data && indicatorData.baseline_data.pessoas) {
        indicatorData.persons_baseline = this._transformPersonsFromLegacy(
          indicatorData.baseline_data.pessoas,
          'baseline'
        )
      }

      // Transformar post_ia_data.pessoas[] → persons_post_ia[]
      if (indicatorData.post_ia_data && indicatorData.post_ia_data.pessoas) {
        indicatorData.persons_post_ia = this._transformPersonsFromLegacy(
          indicatorData.post_ia_data.pessoas,
          'post_ia'
        )
      }

      // Extrair campos específicos do baseline_data para custom_metrics (para tipos não-PRODUTIVIDADE)
      if (indicatorData.baseline_data && indicatorData.baseline_data.tipo) {
        const baselineType = indicatorData.baseline_data.tipo
        const customMetrics = []

        switch (baselineType) {
          case 'INCREMENTO RECEITA':
            if (indicatorData.baseline_data.valorReceitaAntes !== undefined) {
              customMetrics.push({
                metric_name: 'Receita Antes',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.valorReceitaAntes || 0,
                post_ia_value: indicatorData.post_ia_data?.valorReceitaDepois || 0
              })
            }
            break
          case 'MELHORIA MARGEM':
            if (indicatorData.baseline_data.receitaBrutaMensal !== undefined) {
              customMetrics.push({
                metric_name: 'Receita Bruta Mensal',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.receitaBrutaMensal || 0,
                post_ia_value: indicatorData.post_ia_data?.receitaBrutaMensal || 0
              })
            }
            if (indicatorData.baseline_data.custoTotalMensal !== undefined) {
              customMetrics.push({
                metric_name: 'Custo Total Mensal',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoTotalMensal || 0,
                post_ia_value: indicatorData.post_ia_data?.custoTotalMensal || 0
              })
            }
            if (indicatorData.baseline_data.margemBrutaAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Margem Bruta Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.margemBrutaAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.margemBrutaAtual || 0
              })
            }
            if (indicatorData.baseline_data.volumeTransacoes !== undefined) {
              customMetrics.push({
                metric_name: 'Volume de Transações',
                metric_unit: 'unidades',
                baseline_value: indicatorData.baseline_data.volumeTransacoes || 0,
                post_ia_value: indicatorData.post_ia_data?.volumeTransacoes || 0
              })
            }
            break
          case 'REDUÇÃO DE RISCO':
            if (indicatorData.baseline_data.probabilidadeAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Probabilidade Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.probabilidadeAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.probabilidadeAtual || 0
              })
            }
            if (indicatorData.baseline_data.impactoFinanceiro !== undefined) {
              customMetrics.push({
                metric_name: 'Impacto Financeiro',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.impactoFinanceiro || 0,
                post_ia_value: indicatorData.post_ia_data?.impactoFinanceiro || 0
              })
            }
            if (indicatorData.baseline_data.frequenciaAvaliacao !== undefined) {
              customMetrics.push({
                metric_name: 'Frequência de Avaliação',
                metric_unit: 'vezes',
                baseline_value: indicatorData.baseline_data.frequenciaAvaliacao || 0,
                post_ia_value: indicatorData.post_ia_data?.frequenciaAvaliacao || 0
              })
            }
            if (indicatorData.baseline_data.custoMitigacaoAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Custo de Mitigação Atual',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoMitigacaoAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.custoMitigacaoAtual || 0
              })
            }
            break
          case 'QUALIDADE DECISÃO':
            if (indicatorData.baseline_data.numeroDecisoesPeriodo !== undefined) {
              customMetrics.push({
                metric_name: 'Número de Decisões por Período',
                metric_unit: 'decisões',
                baseline_value: indicatorData.baseline_data.numeroDecisoesPeriodo || 0,
                post_ia_value: indicatorData.post_ia_data?.numeroDecisoesPeriodo || 0
              })
            }
            if (indicatorData.baseline_data.taxaAcertoAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Taxa de Acerto Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.taxaAcertoAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.taxaAcertoAtual || 0
              })
            }
            if (indicatorData.baseline_data.custoMedioDecisaoErrada !== undefined) {
              customMetrics.push({
                metric_name: 'Custo Médio por Decisão Errada',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoMedioDecisaoErrada || 0,
                post_ia_value: indicatorData.post_ia_data?.custoMedioDecisaoErrada || 0
              })
            }
            if (indicatorData.baseline_data.tempoMedioDecisao !== undefined) {
              customMetrics.push({
                metric_name: 'Tempo Médio de Decisão',
                metric_unit: 'minutos',
                baseline_value: indicatorData.baseline_data.tempoMedioDecisao || 0,
                post_ia_value: indicatorData.post_ia_data?.tempoMedioDecisao || 0
              })
            }
            if (indicatorData.baseline_data.pessoasEnvolvidas !== undefined) {
              customMetrics.push({
                metric_name: 'Pessoas Envolvidas',
                metric_unit: 'pessoas',
                baseline_value: indicatorData.baseline_data.pessoasEnvolvidas || 0,
                post_ia_value: indicatorData.post_ia_data?.pessoasEnvolvidas || 0
              })
            }
            if (indicatorData.baseline_data.valorHoraMedio !== undefined) {
              customMetrics.push({
                metric_name: 'Valor Hora Médio',
                metric_unit: 'R$/hora',
                baseline_value: indicatorData.baseline_data.valorHoraMedio || 0,
                post_ia_value: indicatorData.post_ia_data?.valorHoraMedio || 0
              })
            }
            break
          case 'VELOCIDADE':
            if (indicatorData.baseline_data.tempoMedioEntregaAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Tempo Médio de Entrega Atual',
                metric_unit: indicatorData.baseline_data.unidadeTempoEntrega || 'dias',
                baseline_value: indicatorData.baseline_data.tempoMedioEntregaAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.tempoMedioEntregaAtual || 0
              })
            }
            if (indicatorData.baseline_data.numeroEntregasPeriodo !== undefined) {
              customMetrics.push({
                metric_name: 'Número de Entregas por Período',
                metric_unit: 'entregas',
                baseline_value: indicatorData.baseline_data.numeroEntregasPeriodo || 0,
                post_ia_value: indicatorData.post_ia_data?.numeroEntregasPeriodo || 0
              })
            }
            if (indicatorData.baseline_data.custoPorAtraso !== undefined) {
              customMetrics.push({
                metric_name: 'Custo por Atraso',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoPorAtraso || 0,
                post_ia_value: indicatorData.post_ia_data?.custoPorAtraso || 0
              })
            }
            if (indicatorData.baseline_data.pessoasEnvolvidas !== undefined) {
              customMetrics.push({
                metric_name: 'Pessoas Envolvidas',
                metric_unit: 'pessoas',
                baseline_value: indicatorData.baseline_data.pessoasEnvolvidas || 0,
                post_ia_value: indicatorData.post_ia_data?.pessoasEnvolvidas || 0
              })
            }
            if (indicatorData.baseline_data.valorHoraMedio !== undefined) {
              customMetrics.push({
                metric_name: 'Valor Hora Médio',
                metric_unit: 'R$/hora',
                baseline_value: indicatorData.baseline_data.valorHoraMedio || 0,
                post_ia_value: indicatorData.post_ia_data?.valorHoraMedio || 0
              })
            }
            if (indicatorData.baseline_data.tempoTrabalhoPorEntrega !== undefined) {
              customMetrics.push({
                metric_name: 'Tempo de Trabalho por Entrega',
                metric_unit: 'horas',
                baseline_value: indicatorData.baseline_data.tempoTrabalhoPorEntrega || 0,
                post_ia_value: indicatorData.post_ia_data?.tempoTrabalhoPorEntrega || 0
              })
            }
            break
          case 'SATISFAÇÃO':
            if (indicatorData.baseline_data.scoreAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Score Atual',
                metric_unit: indicatorData.baseline_data.tipoScore || 'NPS',
                baseline_value: indicatorData.baseline_data.scoreAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.scoreAtual || 0
              })
            }
            if (indicatorData.baseline_data.numeroClientes !== undefined) {
              customMetrics.push({
                metric_name: 'Número de Clientes',
                metric_unit: 'clientes',
                baseline_value: indicatorData.baseline_data.numeroClientes || 0,
                post_ia_value: indicatorData.post_ia_data?.numeroClientes || 0
              })
            }
            if (indicatorData.baseline_data.valorMedioPorCliente !== undefined) {
              customMetrics.push({
                metric_name: 'Valor Médio por Cliente',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.valorMedioPorCliente || 0,
                post_ia_value: indicatorData.post_ia_data?.valorMedioPorCliente || 0
              })
            }
            if (indicatorData.baseline_data.taxaChurnAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Taxa de Churn Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.taxaChurnAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.taxaChurnAtual || 0
              })
            }
            if (indicatorData.baseline_data.custoAquisicaoCliente !== undefined) {
              customMetrics.push({
                metric_name: 'Custo de Aquisição por Cliente',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoAquisicaoCliente || 0,
                post_ia_value: indicatorData.post_ia_data?.custoAquisicaoCliente || 0
              })
            }
            if (indicatorData.baseline_data.ticketMedioSuporte !== undefined) {
              customMetrics.push({
                metric_name: 'Ticket Médio de Suporte',
                metric_unit: 'tickets/mês',
                baseline_value: indicatorData.baseline_data.ticketMedioSuporte || 0,
                post_ia_value: indicatorData.post_ia_data?.ticketMedioSuporte || 0
              })
            }
            break
        }

        // Adicionar custom_metrics se houver
        if (customMetrics.length > 0) {
          console.log(`🔍 create - Extraindo ${customMetrics.length} métricas customizadas para tipo ${baselineType}:`, customMetrics)
          if (indicatorData.custom_metrics && Array.isArray(indicatorData.custom_metrics)) {
            indicatorData.custom_metrics = [...indicatorData.custom_metrics, ...customMetrics]
          } else {
            indicatorData.custom_metrics = customMetrics
          }
        }
      }

      // Transformar ia_data.ias[] + custos_data.custos[] → tools_post_ia[]
      if (indicatorData.ia_data || indicatorData.custos_data) {
        const transformedTools = this._transformToolsFromLegacy(
          indicatorData.ia_data,
          indicatorData.custos_data
        )
        if (transformedTools.length > 0) {
          // Se já existe tools_post_ia, mesclar; senão, criar novo
          if (indicatorData.tools_post_ia && Array.isArray(indicatorData.tools_post_ia)) {
            indicatorData.tools_post_ia = [...indicatorData.tools_post_ia, ...transformedTools]
          } else {
            indicatorData.tools_post_ia = transformedTools
          }
        }
      }

      // Validar campos obrigatórios
      if (!name) {
        return { success: false, error: 'Nome do indicador é obrigatório' }
      }
      if (!improvement_type) {
        return { success: false, error: 'Tipo de indicador é obrigatório' }
      }

      // Criar indicador principal
      const { data: indicator, error: indicatorError } = await supabase
        .from('indicators_normalized')
        .insert({
          project_id: projectId,
          name: name,
          description: description || null,
          improvement_type: improvement_type,
          frequency_value: indicatorData.frequency_value || 1,
          frequency_unit: indicatorData.frequency_unit || 'month',
          baseline_frequency_real: indicatorData.baseline_frequency_real || 0,
          baseline_frequency_desired: indicatorData.baseline_frequency_desired || null,
          post_ia_frequency: indicatorData.post_ia_frequency || 0,
          is_active: indicatorData.is_active !== undefined ? indicatorData.is_active : true,
          notes: indicatorData.notes || null
        })
        .select()
        .single()

      if (indicatorError) {
        console.error('Erro ao criar indicador:', indicatorError)
        return { success: false, error: indicatorError.message }
      }

      const indicatorId = indicator.id

      // Criar pessoas envolvidas (baseline)
      if (indicatorData.persons_baseline && Array.isArray(indicatorData.persons_baseline)) {
        const personsBaselineData = indicatorData.persons_baseline.map(p => ({
          indicator_id: indicatorId,
          scenario: 'baseline',
          person_name: p.person_name,
          role: p.role,
          hourly_rate: p.hourly_rate,
          time_spent_minutes: p.time_spent_minutes,
          is_validation_only: p.is_validation_only || false
        }))
        await personInvolvedService.createMany(personsBaselineData)
      }

      // Criar pessoas envolvidas (pós-IA)
      if (indicatorData.persons_post_ia && Array.isArray(indicatorData.persons_post_ia)) {
        const personsPostIAData = indicatorData.persons_post_ia.map(p => ({
          indicator_id: indicatorId,
          scenario: 'post_ia',
          person_name: p.person_name,
          role: p.role,
          hourly_rate: p.hourly_rate,
          time_spent_minutes: p.time_spent_minutes,
          is_validation_only: p.is_validation_only || false
        }))
        await personInvolvedService.createMany(personsPostIAData)
      }

      // Criar ferramentas (baseline)
      if (indicatorData.tools_baseline && Array.isArray(indicatorData.tools_baseline)) {
        const toolsBaselineData = indicatorData.tools_baseline.map(t => ({
          indicator_id: indicatorId,
          scenario: 'baseline',
          tool_name: t.tool_name,
          tool_category: t.tool_category || 'other',
          monthly_cost: t.monthly_cost || 0,
          cost_per_execution: t.cost_per_execution || null,
          execution_time_seconds: t.execution_time_seconds || null,
          notes: t.notes || null
        }))
        await toolCostService.createMany(toolsBaselineData)
      }

      // Criar ferramentas (pós-IA)
      if (indicatorData.tools_post_ia && Array.isArray(indicatorData.tools_post_ia)) {
        const toolsPostIAData = indicatorData.tools_post_ia.map(t => ({
          indicator_id: indicatorId,
          scenario: 'post_ia',
          tool_name: t.tool_name,
          tool_category: t.tool_category || 'other',
          monthly_cost: t.monthly_cost || 0,
          cost_per_execution: t.cost_per_execution || null,
          execution_time_seconds: t.execution_time_seconds || null,
          notes: t.notes || null
        }))
        await toolCostService.createMany(toolsPostIAData)
      }

      // Criar métricas customizadas
      if (indicatorData.custom_metrics && Array.isArray(indicatorData.custom_metrics)) {
        const customMetricsData = indicatorData.custom_metrics.map(m => ({
          indicator_id: indicatorId,
          metric_name: m.metric_name,
          metric_unit: m.metric_unit,
          baseline_value: m.baseline_value || 0,
          post_ia_value: m.post_ia_value || 0,
          target_value: m.target_value || null,
          is_higher_better: m.is_higher_better !== undefined ? m.is_higher_better : true
        }))
        await customMetricService.createMany(customMetricsData)
      }

      // Log de auditoria
      await auditLogService.log('CREATE', 'indicator', indicatorId, null, indicator)

      return { success: true, indicator }
    } catch (error) {
      console.error('Erro ao criar indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Transforma formato antigo (JSONB) para formato normalizado
   * Converte baseline_data.pessoas[] para persons_baseline[]
   */
  _transformPersonsFromLegacy(pessoas, scenario = 'baseline') {
    if (!Array.isArray(pessoas) || pessoas.length === 0) {
      return []
    }

    return pessoas.map(pessoa => {
      // Mapear nome (pode ser nome ou person_name)
      const personName = pessoa.nome || pessoa.person_name || ''
      
      // Mapear cargo/role (pode ser cargo, funcao ou role)
      const role = pessoa.cargo || pessoa.funcao || pessoa.role || ''
      
      // Mapear valorHora (pode ser valorHora, valorPorAnalise ou hourly_rate)
      const hourlyRate = parseFloat(
        pessoa.valorHora || 
        pessoa.valorPorAnalise || 
        pessoa.hourly_rate || 
        0
      )
      
      // Mapear tempoGasto (pode ser tempoGasto, tempoOperacao, tempoEntrega ou time_spent_minutes)
      // Se for tempoOperacao ou tempoEntrega, pode estar em minutos ou segundos
      let timeSpent = 0
      if (pessoa.tempoGasto !== undefined) {
        timeSpent = parseInt(pessoa.tempoGasto, 10)
      } else if (pessoa.tempoOperacao !== undefined) {
        timeSpent = parseInt(pessoa.tempoOperacao, 10)
      } else if (pessoa.tempoEntrega !== undefined) {
        timeSpent = parseInt(pessoa.tempoEntrega, 10)
      } else if (pessoa.time_spent_minutes !== undefined) {
        timeSpent = parseInt(pessoa.time_spent_minutes, 10)
      }
      
      // Se o tempo estiver em segundos (valor > 1000), converter para minutos
      if (timeSpent > 1000) {
        timeSpent = Math.round(timeSpent / 60)
      }
      
      // Mapear is_validation_only
      const isValidationOnly = pessoa.isValidationOnly || pessoa.is_validation_only || false

      return {
        person_name: personName,
        role: role,
        hourly_rate: hourlyRate,
        time_spent_minutes: timeSpent,
        is_validation_only: isValidationOnly
      }
    })
  },

  /**
   * Transforma formato antigo (JSONB) para formato normalizado
   * Converte ia_data.ias[] e custos_data.custos[] para tools_post_ia[]
   */
  _transformToolsFromLegacy(iaData, custosData) {
    const tools = []

    // Transformar IAs (geralmente são ferramentas pós-IA)
    if (iaData && Array.isArray(iaData.ias) && iaData.ias.length > 0) {
      iaData.ias.forEach(ia => {
        tools.push({
          tool_name: ia.nome || ia.tool_name || '',
          tool_category: this._mapToolCategory(ia.categoria || ia.tool_category),
          monthly_cost: parseFloat(ia.custoMensal || ia.monthly_cost || 0),
          cost_per_execution: parseFloat(ia.custoPorOperacao || ia.cost_per_execution || 0),
          execution_time_seconds: parseInt(ia.tempoExecucao || ia.execution_time_seconds || 0, 10),
          notes: ia.observacoes || ia.notes || null
        })
      })
    }

    // Transformar custos (geralmente são ferramentas pós-IA)
    if (custosData && Array.isArray(custosData.custos) && custosData.custos.length > 0) {
      custosData.custos.forEach(custo => {
        // Calcular monthly_cost baseado no tipo
        let monthlyCost = parseFloat(custo.valor || custo.monthly_cost || 0)
        if (custo.tipo === 'anual') {
          monthlyCost = monthlyCost / 12
        }

        tools.push({
          tool_name: custo.nome || custo.tool_name || '',
          tool_category: this._mapToolCategory(custo.categoria || custo.tool_category),
          monthly_cost: monthlyCost,
          cost_per_execution: parseFloat(custo.custoPorOperacao || custo.cost_per_execution || 0),
          execution_time_seconds: parseInt(custo.tempoExecucao || custo.execution_time_seconds || 0, 10),
          notes: custo.observacoes || custo.notes || null
        })
      })
    }

    return tools
  },

  /**
   * Mapeia categoria de ferramenta para enum do Supabase
   */
  _mapToolCategory(categoria) {
    if (!categoria) return 'other'

    const categoryMap = {
      'llm': 'llm_api',
      'llm_api': 'llm_api',
      'api': 'llm_api',
      'automation': 'automation',
      'automação': 'automation',
      'n8n': 'automation',
      'analytics': 'analytics',
      'bi': 'analytics',
      'database': 'database',
      'db': 'database',
      'cloud': 'cloud_infra',
      'infra': 'cloud_infra',
      'saas': 'saas',
      'custom': 'custom',
      'outros': 'other',
      'other': 'other'
    }

    const categoriaLower = categoria.toLowerCase()
    return categoryMap[categoriaLower] || 'other'
  },

  /**
   * Atualiza um indicador existente
   */
  async update(id, indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!isValidUUID(id)) {
      console.warn(`update: ID inválido (não é UUID): ${id}`)
      return { success: false, error: 'ID inválido' }
    }

    try {
      // Buscar indicador atual para log de auditoria
      const oldIndicator = await this.getById(id)
      if (!oldIndicator) {
        return { success: false, error: 'Indicador não encontrado' }
      }

      const updateData = {}
      
      // CORREÇÃO: Transformar formato antigo (info_data) para formato normalizado
      if (indicatorData.info_data) {
        const infoData = indicatorData.info_data
        if (infoData.nome !== undefined) updateData.name = infoData.nome
        if (infoData.descricao !== undefined) updateData.description = infoData.descricao
        
        // Mapear tipoIndicador para improvement_type
        if (infoData.tipoIndicador !== undefined) {
          const tipoMap = {
            'Produtividade': 'productivity',
            'Capacidade Analítica': 'analytical_capacity',
            'Incremento Receita': 'revenue_increase',
            'Custos Relacionados': 'cost_reduction',
            'Redução de Risco': 'risk_reduction',
            'Qualidade Decisão': 'decision_quality',
            'Velocidade': 'speed',
            'Satisfação': 'satisfaction',
            'Melhoria Margem': 'margin_improvement'
          }
          updateData.improvement_type = tipoMap[infoData.tipoIndicador] || 'productivity'
        }
      }
      
      // Campos normalizados (têm prioridade sobre formato antigo se ambos estiverem presentes)
      if (indicatorData.name !== undefined) updateData.name = indicatorData.name
      if (indicatorData.description !== undefined) updateData.description = indicatorData.description
      if (indicatorData.improvement_type !== undefined) updateData.improvement_type = indicatorData.improvement_type
      if (indicatorData.frequency_value !== undefined) updateData.frequency_value = indicatorData.frequency_value
      if (indicatorData.frequency_unit !== undefined) updateData.frequency_unit = indicatorData.frequency_unit
      if (indicatorData.baseline_frequency_real !== undefined) updateData.baseline_frequency_real = indicatorData.baseline_frequency_real
      if (indicatorData.baseline_frequency_desired !== undefined) updateData.baseline_frequency_desired = indicatorData.baseline_frequency_desired
      if (indicatorData.post_ia_frequency !== undefined) updateData.post_ia_frequency = indicatorData.post_ia_frequency
      if (indicatorData.is_active !== undefined) updateData.is_active = indicatorData.is_active
      if (indicatorData.notes !== undefined) updateData.notes = indicatorData.notes

      // Executar UPDATE apenas se houver dados para atualizar
      let updatedIndicator = oldIndicator
      
      if (Object.keys(updateData).length > 0) {
        // CORREÇÃO: Remover .single() pois pode retornar 0 linhas se RLS bloquear
      const { data, error } = await supabase
        .from('indicators_normalized')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Erro ao atualizar indicador:', error)
          // Verificar se é erro de RLS ou registro não encontrado
          if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
            return { success: false, error: 'Indicador não encontrado ou sem permissão para atualizar' }
          }
          return { success: false, error: error.message || 'Erro ao atualizar indicador' }
        }

        // Verificar se retornou dados (pode ser vazio se RLS bloqueou)
        if (!data || data.length === 0) {
          console.warn(`Update não retornou dados para indicador ${id} - possível bloqueio de RLS`)
          return { success: false, error: 'Não foi possível atualizar o indicador. Verifique as permissões.' }
        }

        updatedIndicator = data[0]
      } else {
        console.log('Nenhum campo normalizado para atualizar - apenas atualizando tabelas relacionadas')
      }

      // ============================================================================
      // TRANSFORMAÇÃO DE FORMATO ANTIGO (JSONB) PARA FORMATO NORMALIZADO
      // ============================================================================
      
      // Transformar baseline_data.pessoas[] → persons_baseline[]
      if (indicatorData.baseline_data && indicatorData.baseline_data.pessoas) {
        indicatorData.persons_baseline = this._transformPersonsFromLegacy(
          indicatorData.baseline_data.pessoas,
          'baseline'
        )
      }

      // Transformar post_ia_data.pessoas[] → persons_post_ia[]
      if (indicatorData.post_ia_data && indicatorData.post_ia_data.pessoas) {
        indicatorData.persons_post_ia = this._transformPersonsFromLegacy(
          indicatorData.post_ia_data.pessoas,
          'post_ia'
        )
      }

      // Extrair campos específicos do baseline_data para custom_metrics (para tipos não-PRODUTIVIDADE)
      if (indicatorData.baseline_data && indicatorData.baseline_data.tipo) {
        const baselineType = indicatorData.baseline_data.tipo
        const customMetrics = []

        switch (baselineType) {
          case 'INCREMENTO RECEITA':
            if (indicatorData.baseline_data.valorReceitaAntes !== undefined) {
              customMetrics.push({
                metric_name: 'Receita Antes',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.valorReceitaAntes || 0,
                post_ia_value: indicatorData.post_ia_data?.valorReceitaDepois || 0
              })
            }
            break
          case 'MELHORIA MARGEM':
            if (indicatorData.baseline_data.receitaBrutaMensal !== undefined) {
              customMetrics.push({
                metric_name: 'Receita Bruta Mensal',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.receitaBrutaMensal || 0,
                post_ia_value: indicatorData.post_ia_data?.receitaBrutaMensal || 0
              })
            }
            if (indicatorData.baseline_data.custoTotalMensal !== undefined) {
              customMetrics.push({
                metric_name: 'Custo Total Mensal',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoTotalMensal || 0,
                post_ia_value: indicatorData.post_ia_data?.custoTotalMensal || 0
              })
            }
            if (indicatorData.baseline_data.margemBrutaAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Margem Bruta Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.margemBrutaAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.margemBrutaAtual || 0
              })
            }
            if (indicatorData.baseline_data.volumeTransacoes !== undefined) {
              customMetrics.push({
                metric_name: 'Volume de Transações',
                metric_unit: 'unidades',
                baseline_value: indicatorData.baseline_data.volumeTransacoes || 0,
                post_ia_value: indicatorData.post_ia_data?.volumeTransacoes || 0
              })
            }
            break
          case 'REDUÇÃO DE RISCO':
            if (indicatorData.baseline_data.probabilidadeAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Probabilidade Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.probabilidadeAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.probabilidadeAtual || 0
              })
            }
            if (indicatorData.baseline_data.impactoFinanceiro !== undefined) {
              customMetrics.push({
                metric_name: 'Impacto Financeiro',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.impactoFinanceiro || 0,
                post_ia_value: indicatorData.post_ia_data?.impactoFinanceiro || 0
              })
            }
            if (indicatorData.baseline_data.frequenciaAvaliacao !== undefined) {
              customMetrics.push({
                metric_name: 'Frequência de Avaliação',
                metric_unit: 'vezes',
                baseline_value: indicatorData.baseline_data.frequenciaAvaliacao || 0,
                post_ia_value: indicatorData.post_ia_data?.frequenciaAvaliacao || 0
              })
            }
            if (indicatorData.baseline_data.custoMitigacaoAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Custo de Mitigação Atual',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoMitigacaoAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.custoMitigacaoAtual || 0
              })
            }
            break
          case 'QUALIDADE DECISÃO':
            if (indicatorData.baseline_data.numeroDecisoesPeriodo !== undefined) {
              customMetrics.push({
                metric_name: 'Número de Decisões por Período',
                metric_unit: 'decisões',
                baseline_value: indicatorData.baseline_data.numeroDecisoesPeriodo || 0,
                post_ia_value: indicatorData.post_ia_data?.numeroDecisoesPeriodo || 0
              })
            }
            if (indicatorData.baseline_data.taxaAcertoAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Taxa de Acerto Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.taxaAcertoAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.taxaAcertoAtual || 0
              })
            }
            if (indicatorData.baseline_data.custoMedioDecisaoErrada !== undefined) {
              customMetrics.push({
                metric_name: 'Custo Médio por Decisão Errada',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoMedioDecisaoErrada || 0,
                post_ia_value: indicatorData.post_ia_data?.custoMedioDecisaoErrada || 0
              })
            }
            if (indicatorData.baseline_data.tempoMedioDecisao !== undefined) {
              customMetrics.push({
                metric_name: 'Tempo Médio de Decisão',
                metric_unit: 'minutos',
                baseline_value: indicatorData.baseline_data.tempoMedioDecisao || 0,
                post_ia_value: indicatorData.post_ia_data?.tempoMedioDecisao || 0
              })
            }
            if (indicatorData.baseline_data.pessoasEnvolvidas !== undefined) {
              customMetrics.push({
                metric_name: 'Pessoas Envolvidas',
                metric_unit: 'pessoas',
                baseline_value: indicatorData.baseline_data.pessoasEnvolvidas || 0,
                post_ia_value: indicatorData.post_ia_data?.pessoasEnvolvidas || 0
              })
            }
            if (indicatorData.baseline_data.valorHoraMedio !== undefined) {
              customMetrics.push({
                metric_name: 'Valor Hora Médio',
                metric_unit: 'R$/hora',
                baseline_value: indicatorData.baseline_data.valorHoraMedio || 0,
                post_ia_value: indicatorData.post_ia_data?.valorHoraMedio || 0
              })
            }
            break
          case 'VELOCIDADE':
            if (indicatorData.baseline_data.tempoMedioEntregaAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Tempo Médio de Entrega Atual',
                metric_unit: indicatorData.baseline_data.unidadeTempoEntrega || 'dias',
                baseline_value: indicatorData.baseline_data.tempoMedioEntregaAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.tempoMedioEntregaAtual || 0
              })
            }
            if (indicatorData.baseline_data.numeroEntregasPeriodo !== undefined) {
              customMetrics.push({
                metric_name: 'Número de Entregas por Período',
                metric_unit: 'entregas',
                baseline_value: indicatorData.baseline_data.numeroEntregasPeriodo || 0,
                post_ia_value: indicatorData.post_ia_data?.numeroEntregasPeriodo || 0
              })
            }
            if (indicatorData.baseline_data.custoPorAtraso !== undefined) {
              customMetrics.push({
                metric_name: 'Custo por Atraso',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoPorAtraso || 0,
                post_ia_value: indicatorData.post_ia_data?.custoPorAtraso || 0
              })
            }
            if (indicatorData.baseline_data.pessoasEnvolvidas !== undefined) {
              customMetrics.push({
                metric_name: 'Pessoas Envolvidas',
                metric_unit: 'pessoas',
                baseline_value: indicatorData.baseline_data.pessoasEnvolvidas || 0,
                post_ia_value: indicatorData.post_ia_data?.pessoasEnvolvidas || 0
              })
            }
            if (indicatorData.baseline_data.valorHoraMedio !== undefined) {
              customMetrics.push({
                metric_name: 'Valor Hora Médio',
                metric_unit: 'R$/hora',
                baseline_value: indicatorData.baseline_data.valorHoraMedio || 0,
                post_ia_value: indicatorData.post_ia_data?.valorHoraMedio || 0
              })
            }
            if (indicatorData.baseline_data.tempoTrabalhoPorEntrega !== undefined) {
              customMetrics.push({
                metric_name: 'Tempo de Trabalho por Entrega',
                metric_unit: 'horas',
                baseline_value: indicatorData.baseline_data.tempoTrabalhoPorEntrega || 0,
                post_ia_value: indicatorData.post_ia_data?.tempoTrabalhoPorEntrega || 0
              })
            }
            break
          case 'SATISFAÇÃO':
            if (indicatorData.baseline_data.scoreAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Score Atual',
                metric_unit: indicatorData.baseline_data.tipoScore || 'NPS',
                baseline_value: indicatorData.baseline_data.scoreAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.scoreAtual || 0
              })
            }
            if (indicatorData.baseline_data.numeroClientes !== undefined) {
              customMetrics.push({
                metric_name: 'Número de Clientes',
                metric_unit: 'clientes',
                baseline_value: indicatorData.baseline_data.numeroClientes || 0,
                post_ia_value: indicatorData.post_ia_data?.numeroClientes || 0
              })
            }
            if (indicatorData.baseline_data.valorMedioPorCliente !== undefined) {
              customMetrics.push({
                metric_name: 'Valor Médio por Cliente',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.valorMedioPorCliente || 0,
                post_ia_value: indicatorData.post_ia_data?.valorMedioPorCliente || 0
              })
            }
            if (indicatorData.baseline_data.taxaChurnAtual !== undefined) {
              customMetrics.push({
                metric_name: 'Taxa de Churn Atual',
                metric_unit: '%',
                baseline_value: indicatorData.baseline_data.taxaChurnAtual || 0,
                post_ia_value: indicatorData.post_ia_data?.taxaChurnAtual || 0
              })
            }
            if (indicatorData.baseline_data.custoAquisicaoCliente !== undefined) {
              customMetrics.push({
                metric_name: 'Custo de Aquisição por Cliente',
                metric_unit: 'R$',
                baseline_value: indicatorData.baseline_data.custoAquisicaoCliente || 0,
                post_ia_value: indicatorData.post_ia_data?.custoAquisicaoCliente || 0
              })
            }
            if (indicatorData.baseline_data.ticketMedioSuporte !== undefined) {
              customMetrics.push({
                metric_name: 'Ticket Médio de Suporte',
                metric_unit: 'tickets/mês',
                baseline_value: indicatorData.baseline_data.ticketMedioSuporte || 0,
                post_ia_value: indicatorData.post_ia_data?.ticketMedioSuporte || 0
              })
            }
            break
        }

        // Adicionar custom_metrics se houver
        if (customMetrics.length > 0) {
          console.log(`🔍 update - Extraindo ${customMetrics.length} métricas customizadas para tipo ${baselineType}:`, customMetrics)
          if (indicatorData.custom_metrics && Array.isArray(indicatorData.custom_metrics)) {
            indicatorData.custom_metrics = [...indicatorData.custom_metrics, ...customMetrics]
          } else {
            indicatorData.custom_metrics = customMetrics
          }
        }
      }

      // Transformar ia_data.ias[] + custos_data.custos[] → tools_post_ia[]
      if (indicatorData.ia_data || indicatorData.custos_data) {
        const transformedTools = this._transformToolsFromLegacy(
          indicatorData.ia_data,
          indicatorData.custos_data
        )
        if (transformedTools.length > 0) {
          // Se já existe tools_post_ia, mesclar; senão, criar novo
          if (indicatorData.tools_post_ia && Array.isArray(indicatorData.tools_post_ia)) {
            indicatorData.tools_post_ia = [...indicatorData.tools_post_ia, ...transformedTools]
          } else {
            indicatorData.tools_post_ia = transformedTools
          }
        }
      }

      // ============================================================================
      // ATUALIZAR TABELAS RELACIONADAS (FORMATO NORMALIZADO)
      // ============================================================================

      // Atualizar pessoas baseline
      if (indicatorData.persons_baseline !== undefined) {
        await personInvolvedService.deleteByIndicatorAndScenario(id, 'baseline')
        if (Array.isArray(indicatorData.persons_baseline) && indicatorData.persons_baseline.length > 0) {
          const personsData = indicatorData.persons_baseline.map(p => ({
            indicator_id: id,
            scenario: 'baseline',
            person_name: p.person_name,
            role: p.role,
            hourly_rate: p.hourly_rate,
            time_spent_minutes: p.time_spent_minutes,
            is_validation_only: p.is_validation_only || false
          }))
          await personInvolvedService.createMany(personsData)
        }
      }

      // Atualizar pessoas pós-IA
      if (indicatorData.persons_post_ia !== undefined) {
        await personInvolvedService.deleteByIndicatorAndScenario(id, 'post_ia')
        if (Array.isArray(indicatorData.persons_post_ia) && indicatorData.persons_post_ia.length > 0) {
          const personsData = indicatorData.persons_post_ia.map(p => ({
            indicator_id: id,
            scenario: 'post_ia',
            person_name: p.person_name,
            role: p.role,
            hourly_rate: p.hourly_rate,
            time_spent_minutes: p.time_spent_minutes,
            is_validation_only: p.is_validation_only || false
          }))
          await personInvolvedService.createMany(personsData)
        }
      }

      // Atualizar ferramentas baseline
      if (indicatorData.tools_baseline !== undefined) {
        await toolCostService.deleteByIndicatorAndScenario(id, 'baseline')
        if (Array.isArray(indicatorData.tools_baseline) && indicatorData.tools_baseline.length > 0) {
          const toolsData = indicatorData.tools_baseline.map(t => ({
            indicator_id: id,
            scenario: 'baseline',
            tool_name: t.tool_name,
            tool_category: t.tool_category || 'other',
            monthly_cost: t.monthly_cost || 0,
            cost_per_execution: t.cost_per_execution || null,
            execution_time_seconds: t.execution_time_seconds || null,
            notes: t.notes || null
          }))
          await toolCostService.createMany(toolsData)
        }
      }

      // Atualizar ferramentas pós-IA
      if (indicatorData.tools_post_ia !== undefined) {
        await toolCostService.deleteByIndicatorAndScenario(id, 'post_ia')
        if (Array.isArray(indicatorData.tools_post_ia) && indicatorData.tools_post_ia.length > 0) {
          const toolsData = indicatorData.tools_post_ia.map(t => ({
            indicator_id: id,
            scenario: 'post_ia',
            tool_name: t.tool_name,
            tool_category: t.tool_category || 'other',
            monthly_cost: t.monthly_cost || 0,
            cost_per_execution: t.cost_per_execution || null,
            execution_time_seconds: t.execution_time_seconds || null,
            notes: t.notes || null
          }))
          await toolCostService.createMany(toolsData)
        }
      }

      // Atualizar métricas customizadas
      if (indicatorData.custom_metrics !== undefined) {
        await customMetricService.deleteByIndicatorId(id)
        if (Array.isArray(indicatorData.custom_metrics) && indicatorData.custom_metrics.length > 0) {
          await customMetricService.createMany(indicatorData.custom_metrics.map(m => ({
            indicator_id: id,
            metric_name: m.metric_name,
            metric_unit: m.metric_unit,
            baseline_value: m.baseline_value || 0,
            post_ia_value: m.post_ia_value || 0,
            target_value: m.target_value || null,
            is_higher_better: m.is_higher_better !== undefined ? m.is_higher_better : true
          })))
        }
      }

      // Log de auditoria
      await auditLogService.log('UPDATE', 'indicator', id, oldIndicator, updatedIndicator)

      return { success: true, indicator: updatedIndicator }
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta um indicador
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!isValidUUID(id)) {
      console.warn(`delete: ID inválido (não é UUID): ${id}`)
      return { success: false, error: 'ID inválido' }
    }

    try {
      // Buscar indicador antes de deletar para log
      const indicator = await this.getById(id)

      const { error } = await supabase
        .from('indicators_normalized')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar indicador:', error)
        return { success: false, error: error.message }
      }

      // Log de auditoria
      if (indicator) {
        await auditLogService.log('DELETE', 'indicator', id, indicator, null)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar indicador:', error)
      return { success: false, error: error.message }
    }
  }
}

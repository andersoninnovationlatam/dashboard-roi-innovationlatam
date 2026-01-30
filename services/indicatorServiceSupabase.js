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
      const [personsBaseline, personsPostIA, toolsBaseline, toolsPostIA, customMetrics, calculatedResult, trackingHistory, typeSpecificData] = await Promise.all([
        personInvolvedService.getByIndicatorId(id, 'baseline'),
        personInvolvedService.getByIndicatorId(id, 'post_ia'),
        toolCostService.getByIndicatorId(id, 'baseline'),
        toolCostService.getByIndicatorId(id, 'post_ia'),
        customMetricService.getByIndicatorId(id),
        calculatedResultsService.getLatestByIndicatorId(id),
        trackingService.getByIndicatorId(id),
        supabase.from('indicator_type_specific_data').select('*').eq('indicator_id', id).maybeSingle().then(({ data, error }) => {
          // maybeSingle() retorna null quando não há registro (ao invés de erro)
          // Trata erros 406 (Not Acceptable) que podem ocorrer com RLS
          if (error && error.code !== 'PGRST116' && error.code !== 'PGRST301') {
            // PGRST116 = nenhum registro encontrado (ok com maybeSingle)
            // PGRST301 = múltiplos registros (não deveria acontecer, mas trata)
            console.error('Erro ao buscar dados específicos:', error)
          }
          return data || null
        })
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

      // Adicionar frequenciaReal e frequenciaDesejada das colunas normalizadas
      const pessoasBaselineComFrequencia = pessoasBaselineTransformed.map((pessoa, index) => {
        const personData = personsBaseline[index]
        const periodoMap = {
          'day': 'Diário',
          'week': 'Semanal',
          'month': 'Mensal'
        }
        return {
          ...pessoa,
          id: pessoa.id || personData?.id || `pessoa-${Date.now()}-${Math.random()}`,
          frequenciaReal: {
            quantidade: personData?.frequency_real_quantity || indicator.baseline_frequency_real || 0,
            periodo: periodoMap[personData?.frequency_real_unit] || (indicator.frequency_unit === 'day' ? 'Diário' : indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal')
          },
          frequenciaDesejada: {
            quantidade: personData?.frequency_desired_quantity || indicator.baseline_frequency_desired || indicator.baseline_frequency_real || 0,
            periodo: periodoMap[personData?.frequency_desired_unit] || (indicator.frequency_unit === 'day' ? 'Diário' : indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal')
          }
        }
      })

      const pessoasPostIAComFrequencia = pessoasPostIATransformed.map((pessoa, index) => {
        const personData = personsPostIA[index]
        const periodoMap = {
          'day': 'Diário',
          'week': 'Semanal',
          'month': 'Mensal'
        }
        return {
          ...pessoa,
          id: pessoa.id || personData?.id || `pessoa-${Date.now()}-${Math.random()}`,
          frequenciaReal: {
            quantidade: personData?.frequency_real_quantity || indicator.post_ia_frequency || 0,
            periodo: periodoMap[personData?.frequency_real_unit] || (indicator.frequency_unit === 'day' ? 'Diário' : indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal')
          },
          frequenciaDesejada: {
            quantidade: personData?.frequency_real_quantity || indicator.post_ia_frequency || 0,
            periodo: periodoMap[personData?.frequency_real_unit] || (indicator.frequency_unit === 'day' ? 'Diário' : indicator.frequency_unit === 'week' ? 'Semanal' : 'Mensal')
          }
        }
      })

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
          baselineData = {
            ...baselineData,
            valorReceitaAntes: typeSpecificData?.revenue_before || 0
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
          baselineData = {
            ...baselineData,
            receitaBrutaMensal: typeSpecificData?.gross_revenue_monthly || 0,
            custoTotalMensal: typeSpecificData?.total_cost_monthly || 0,
            margemBrutaAtual: typeSpecificData?.current_margin_percentage || 0,
            volumeTransacoes: typeSpecificData?.transaction_volume || 0
          }
          break
        case 'REDUÇÃO DE RISCO':
          baselineData = {
            ...baselineData,
            tipoRisco: typeSpecificData?.risk_type || '',
            probabilidadeAtual: typeSpecificData?.current_probability_percentage || 0,
            impactoFinanceiro: typeSpecificData?.financial_impact || 0,
            frequenciaAvaliacao: typeSpecificData?.evaluation_frequency || 0,
            periodoAvaliacao: typeSpecificData?.evaluation_period || 'mês',
            custoMitigacaoAtual: typeSpecificData?.mitigation_cost_current || 0
          }
          break
        case 'QUALIDADE DECISÃO':
          baselineData = {
            ...baselineData,
            numeroDecisoesPeriodo: typeSpecificData?.decisions_per_period || 0,
            periodo: typeSpecificData?.decisions_period || 'mês',
            taxaAcertoAtual: typeSpecificData?.current_accuracy_percentage || 0,
            custoMedioDecisaoErrada: typeSpecificData?.avg_cost_wrong_decision || 0,
            tempoMedioDecisao: typeSpecificData?.avg_decision_time_minutes || 0,
            pessoasEnvolvidas: typeSpecificData?.people_involved || pessoasBaselineComFrequencia.length || 0,
            valorHoraMedio: typeSpecificData?.avg_hourly_rate || 0
          }
          break
        case 'VELOCIDADE':
          baselineData = {
            ...baselineData,
            tempoMedioEntregaAtual: typeSpecificData?.current_delivery_time || 0,
            unidadeTempoEntrega: typeSpecificData?.delivery_time_unit || 'dias',
            numeroEntregasPeriodo: typeSpecificData?.deliveries_per_period || 0,
            periodoEntregas: typeSpecificData?.deliveries_period || 'mês',
            custoPorAtraso: typeSpecificData?.cost_per_delay || 0,
            pessoasEnvolvidas: pessoasBaselineComFrequencia.length || 0,
            valorHoraMedio: 0, // Será calculado a partir das pessoas
            tempoTrabalhoPorEntrega: typeSpecificData?.work_time_per_delivery_hours || 0
          }
          break
        case 'SATISFAÇÃO':
          baselineData = {
            ...baselineData,
            scoreAtual: typeSpecificData?.current_score || 0,
            tipoScore: typeSpecificData?.score_type || 'NPS',
            numeroClientes: typeSpecificData?.number_of_customers || 0,
            valorMedioPorCliente: typeSpecificData?.avg_value_per_customer || 0,
            taxaChurnAtual: typeSpecificData?.current_churn_rate_percentage || 0,
            custoAquisicaoCliente: typeSpecificData?.customer_acquisition_cost || 0,
            ticketMedioSuporte: typeSpecificData?.avg_support_tickets_per_month || 0
          }
          break
        case 'CAPACIDADE ANALÍTICA':
          baselineData = {
            ...baselineData,
            quantidadeAnalises: typeSpecificData?.analyses_before || 0,
            valorPorAnalise: typeSpecificData?.value_per_analysis || 0,
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
            pessoaEnvolvida: false,
            pessoas: pessoasPostIAComFrequencia,
            custoTotalPostIA: 0, // Será calculado pelo componente
            deltaProdutividade: 0 // Será calculado pelo componente
          }
          break
        case 'INCREMENTO RECEITA':
          postIAData = {
            ...postIAData,
            valorReceitaDepois: typeSpecificData?.revenue_after || 0
          }
          break
        case 'MELHORIA MARGEM':
          postIAData = {
            ...postIAData,
            margemBrutaEstimada: typeSpecificData?.estimated_margin_percentage || 0
          }
          break
        case 'REDUÇÃO DE RISCO':
          postIAData = {
            ...postIAData,
            probabilidadeComIA: typeSpecificData?.probability_with_ia_percentage || 0,
            custoMitigacaoComIA: typeSpecificData?.mitigation_cost_with_ia || 0
          }
          break
        case 'QUALIDADE DECISÃO':
          postIAData = {
            ...postIAData,
            taxaAcertoComIA: typeSpecificData?.accuracy_with_ia_percentage || 0,
            custoMedioDecisaoErradaComIA: typeSpecificData?.avg_cost_wrong_decision_with_ia || 0,
            tempoMedioDecisaoComIA: typeSpecificData?.avg_decision_time_with_ia_minutes || 0,
            pessoasEnvolvidasComIA: typeSpecificData?.people_involved_with_ia || 0
          }
          break
        case 'VELOCIDADE':
          postIAData = {
            ...postIAData,
            tempoMedioEntregaComIA: typeSpecificData?.delivery_time_with_ia || 0,
            unidadeTempoEntregaComIA: typeSpecificData?.delivery_time_unit || 'dias',
            custoPorAtrasoReduzido: typeSpecificData?.cost_per_delay_reduced || 0,
            tempoTrabalhoPorEntregaComIA: typeSpecificData?.work_time_per_delivery_with_ia_hours || 0
          }
          break
        case 'SATISFAÇÃO':
          postIAData = {
            ...postIAData,
            scoreComIA: typeSpecificData?.score_with_ia || 0,
            taxaChurnComIA: typeSpecificData?.churn_rate_with_ia_percentage || 0
          }
          break
        case 'CAPACIDADE ANALÍTICA':
          postIAData = {
            ...postIAData,
            quantidadeAnalises: typeSpecificData?.analyses_after || 0
          }
          break
        // Para outros tipos, manter estrutura básica
        default:
          postIAData = {
            ...postIAData,
            pessoas: pessoasPostIAComFrequencia
          }
      }

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

      // REMOVIDO: Não criar mais custom_metrics para tipos que têm colunas específicas
      // Esses dados agora são salvos diretamente em indicator_type_specific_data
      // custom_metrics deve ser usado apenas para métricas realmente customizadas que não têm coluna específica

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

      // Extrair frequências do JSONB se não foram fornecidas diretamente
      let baselineFrequencyReal = indicatorData.baseline_frequency_real || 0
      let baselineFrequencyDesired = indicatorData.baseline_frequency_desired || null
      let postIAFrequency = indicatorData.post_ia_frequency || 0
      let frequencyUnit = indicatorData.frequency_unit || 'month'

      // Extrair frequências do baseline_data.pessoas[]
      if (indicatorData.baseline_data && indicatorData.baseline_data.pessoas && Array.isArray(indicatorData.baseline_data.pessoas) && indicatorData.baseline_data.pessoas.length > 0) {
        const primeiraPessoa = indicatorData.baseline_data.pessoas[0]
        
        if (primeiraPessoa.frequenciaReal && primeiraPessoa.frequenciaReal.quantidade !== undefined) {
          if (!baselineFrequencyReal) {
            baselineFrequencyReal = parseInt(primeiraPessoa.frequenciaReal.quantidade) || 0
          }
          // Converter período para frequency_unit
          if (primeiraPessoa.frequenciaReal.periodo) {
            const periodoMap = {
              'Diário': 'day',
              'Semanal': 'week',
              'Mensal': 'month'
            }
            frequencyUnit = periodoMap[primeiraPessoa.frequenciaReal.periodo] || 'month'
          }
        }
        
        if (primeiraPessoa.frequenciaDesejada && primeiraPessoa.frequenciaDesejada.quantidade !== undefined) {
          if (!baselineFrequencyDesired) {
            baselineFrequencyDesired = parseInt(primeiraPessoa.frequenciaDesejada.quantidade) || null
          }
        }
      }

      // Extrair frequências do post_ia_data.pessoas[]
      if (indicatorData.post_ia_data && indicatorData.post_ia_data.pessoas && Array.isArray(indicatorData.post_ia_data.pessoas) && indicatorData.post_ia_data.pessoas.length > 0) {
        const primeiraPessoaPostIA = indicatorData.post_ia_data.pessoas[0]
        if (primeiraPessoaPostIA.frequenciaReal && primeiraPessoaPostIA.frequenciaReal.quantidade !== undefined) {
          if (!postIAFrequency) {
            postIAFrequency = parseInt(primeiraPessoaPostIA.frequenciaReal.quantidade) || 0
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
          frequency_value: indicatorData.frequency_value || baselineFrequencyReal || 1,
          frequency_unit: frequencyUnit,
          baseline_frequency_real: baselineFrequencyReal,
          baseline_frequency_desired: baselineFrequencyDesired,
          post_ia_frequency: postIAFrequency,
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

      // Criar pessoas envolvidas (baseline) com frequências
      if (indicatorData.persons_baseline && Array.isArray(indicatorData.persons_baseline)) {
        const personsBaselineData = indicatorData.persons_baseline.map((p, index) => {
          // Extrair frequências do baseline_data se disponível
          let freqRealQty = p.frequency_real_quantity
          let freqRealUnit = p.frequency_real_unit
          let freqDesiredQty = p.frequency_desired_quantity
          let freqDesiredUnit = p.frequency_desired_unit
          
          if (indicatorData.baseline_data && indicatorData.baseline_data.pessoas && indicatorData.baseline_data.pessoas[index]) {
            const pessoa = indicatorData.baseline_data.pessoas[index]
            if (pessoa.frequenciaReal) {
              freqRealQty = pessoa.frequenciaReal.quantidade || freqRealQty
              const periodoMap = {
                'Diário': 'day',
                'Semanal': 'week',
                'Mensal': 'month'
              }
              freqRealUnit = periodoMap[pessoa.frequenciaReal.periodo] || freqRealUnit || 'month'
            }
            if (pessoa.frequenciaDesejada) {
              freqDesiredQty = pessoa.frequenciaDesejada.quantidade || freqDesiredQty
              const periodoMap = {
                'Diário': 'day',
                'Semanal': 'week',
                'Mensal': 'month'
              }
              freqDesiredUnit = periodoMap[pessoa.frequenciaDesejada.periodo] || freqDesiredUnit || 'month'
            }
          }
          
          return {
            indicator_id: indicatorId,
            scenario: 'baseline',
            person_name: p.person_name,
            role: p.role,
            hourly_rate: p.hourly_rate,
            time_spent_minutes: p.time_spent_minutes,
            is_validation_only: p.is_validation_only || false,
            frequency_real_quantity: freqRealQty,
            frequency_real_unit: freqRealUnit,
            frequency_desired_quantity: freqDesiredQty,
            frequency_desired_unit: freqDesiredUnit
          }
        })
        await personInvolvedService.createMany(personsBaselineData)
      }

      // Criar pessoas envolvidas (pós-IA) com frequências
      if (indicatorData.persons_post_ia && Array.isArray(indicatorData.persons_post_ia)) {
        const personsPostIAData = indicatorData.persons_post_ia.map((p, index) => {
          // Extrair frequências do post_ia_data se disponível
          let freqRealQty = p.frequency_real_quantity
          let freqRealUnit = p.frequency_real_unit
          
          if (indicatorData.post_ia_data && indicatorData.post_ia_data.pessoas && indicatorData.post_ia_data.pessoas[index]) {
            const pessoa = indicatorData.post_ia_data.pessoas[index]
            if (pessoa.frequenciaReal) {
              freqRealQty = pessoa.frequenciaReal.quantidade || freqRealQty
              const periodoMap = {
                'Diário': 'day',
                'Semanal': 'week',
                'Mensal': 'month'
              }
              freqRealUnit = periodoMap[pessoa.frequenciaReal.periodo] || freqRealUnit || 'month'
            }
          }
          
          return {
            indicator_id: indicatorId,
            scenario: 'post_ia',
            person_name: p.person_name,
            role: p.role,
            hourly_rate: p.hourly_rate,
            time_spent_minutes: p.time_spent_minutes,
            is_validation_only: p.is_validation_only || false,
            frequency_real_quantity: freqRealQty,
            frequency_real_unit: freqRealUnit
          }
        })
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

      // Garantir que baselineData tenha tipo definido antes de salvar
      if (indicatorData.baseline_data && !indicatorData.baseline_data.tipo) {
        const typeMap = {
          'productivity': 'PRODUTIVIDADE',
          'analytical_capacity': 'CAPACIDADE ANALÍTICA',
          'revenue_increase': 'INCREMENTO RECEITA',
          'margin_improvement': 'MELHORIA MARGEM',
          'risk_reduction': 'REDUÇÃO DE RISCO',
          'decision_quality': 'QUALIDADE DECISÃO',
          'speed': 'VELOCIDADE',
          'satisfaction': 'SATISFAÇÃO'
        }
        indicatorData.baseline_data.tipo = typeMap[improvement_type] || 'PRODUTIVIDADE'
      }

      // Garantir que post_ia_data tenha tipo também
      if (indicatorData.post_ia_data && !indicatorData.post_ia_data.tipo && indicatorData.baseline_data?.tipo) {
        indicatorData.post_ia_data.tipo = indicatorData.baseline_data.tipo
      }

      // Criar dados específicos por tipo de indicador
      await this._saveTypeSpecificData(indicatorId, improvement_type, indicatorData)

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

      // ============================================================================
      // EXTRAIR FREQUÊNCIAS DO JSONB ANTES DO UPDATE
      // ============================================================================
      
      // Extrair frequências do baseline_data.pessoas[] se não foram fornecidas diretamente
      if (indicatorData.baseline_data && indicatorData.baseline_data.pessoas && Array.isArray(indicatorData.baseline_data.pessoas) && indicatorData.baseline_data.pessoas.length > 0) {
        const primeiraPessoa = indicatorData.baseline_data.pessoas[0]
        
        // Extrair frequência real da primeira pessoa
        if (primeiraPessoa.frequenciaReal && primeiraPessoa.frequenciaReal.quantidade !== undefined) {
          if (!updateData.baseline_frequency_real) {
            updateData.baseline_frequency_real = parseInt(primeiraPessoa.frequenciaReal.quantidade) || 0
          }
          // Converter período para frequency_unit se não estiver definido
          if (primeiraPessoa.frequenciaReal.periodo && !updateData.frequency_unit) {
            const periodoMap = {
              'Diário': 'day',
              'Semanal': 'week',
              'Mensal': 'month'
            }
            updateData.frequency_unit = periodoMap[primeiraPessoa.frequenciaReal.periodo] || 'month'
          }
        }
        
        // Extrair frequência desejada da primeira pessoa
        if (primeiraPessoa.frequenciaDesejada && primeiraPessoa.frequenciaDesejada.quantidade !== undefined) {
          if (!updateData.baseline_frequency_desired) {
            updateData.baseline_frequency_desired = parseInt(primeiraPessoa.frequenciaDesejada.quantidade) || null
          }
        }
      }

      // Extrair frequências do post_ia_data.pessoas[] se não foram fornecidas diretamente
      if (indicatorData.post_ia_data && indicatorData.post_ia_data.pessoas && Array.isArray(indicatorData.post_ia_data.pessoas) && indicatorData.post_ia_data.pessoas.length > 0) {
        const primeiraPessoaPostIA = indicatorData.post_ia_data.pessoas[0]
        if (primeiraPessoaPostIA.frequenciaReal && primeiraPessoaPostIA.frequenciaReal.quantidade !== undefined) {
          if (!updateData.post_ia_frequency) {
            updateData.post_ia_frequency = parseInt(primeiraPessoaPostIA.frequenciaReal.quantidade) || 0
          }
        }
      }

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

      // REMOVIDO: Não criar mais custom_metrics para tipos que têm colunas específicas
      // Esses dados agora são salvos diretamente em indicator_type_specific_data
      // custom_metrics deve ser usado apenas para métricas realmente customizadas que não têm coluna específica

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

      // Atualizar pessoas baseline com frequências
      if (indicatorData.persons_baseline !== undefined) {
        await personInvolvedService.deleteByIndicatorAndScenario(id, 'baseline')
        if (Array.isArray(indicatorData.persons_baseline) && indicatorData.persons_baseline.length > 0) {
          const personsData = indicatorData.persons_baseline.map((p, index) => {
            // Extrair frequências do baseline_data se disponível
            let freqRealQty = p.frequency_real_quantity
            let freqRealUnit = p.frequency_real_unit
            let freqDesiredQty = p.frequency_desired_quantity
            let freqDesiredUnit = p.frequency_desired_unit
            
            if (indicatorData.baseline_data && indicatorData.baseline_data.pessoas && indicatorData.baseline_data.pessoas[index]) {
              const pessoa = indicatorData.baseline_data.pessoas[index]
              if (pessoa.frequenciaReal) {
                freqRealQty = pessoa.frequenciaReal.quantidade || freqRealQty
                const periodoMap = {
                  'Diário': 'day',
                  'Semanal': 'week',
                  'Mensal': 'month'
                }
                freqRealUnit = periodoMap[pessoa.frequenciaReal.periodo] || freqRealUnit || 'month'
              }
              if (pessoa.frequenciaDesejada) {
                freqDesiredQty = pessoa.frequenciaDesejada.quantidade || freqDesiredQty
                const periodoMap = {
                  'Diário': 'day',
                  'Semanal': 'week',
                  'Mensal': 'month'
                }
                freqDesiredUnit = periodoMap[pessoa.frequenciaDesejada.periodo] || freqDesiredUnit || 'month'
              }
            }
            
            return {
              indicator_id: id,
              scenario: 'baseline',
              person_name: p.person_name,
              role: p.role,
              hourly_rate: p.hourly_rate,
              time_spent_minutes: p.time_spent_minutes,
              is_validation_only: p.is_validation_only || false,
              frequency_real_quantity: freqRealQty,
              frequency_real_unit: freqRealUnit,
              frequency_desired_quantity: freqDesiredQty,
              frequency_desired_unit: freqDesiredUnit
            }
          })
          await personInvolvedService.createMany(personsData)
        }
      }

      // Atualizar pessoas pós-IA com frequências
      if (indicatorData.persons_post_ia !== undefined) {
        await personInvolvedService.deleteByIndicatorAndScenario(id, 'post_ia')
        if (Array.isArray(indicatorData.persons_post_ia) && indicatorData.persons_post_ia.length > 0) {
          const personsData = indicatorData.persons_post_ia.map((p, index) => {
            // Extrair frequências do post_ia_data se disponível
            let freqRealQty = p.frequency_real_quantity
            let freqRealUnit = p.frequency_real_unit
            
            if (indicatorData.post_ia_data && indicatorData.post_ia_data.pessoas && indicatorData.post_ia_data.pessoas[index]) {
              const pessoa = indicatorData.post_ia_data.pessoas[index]
              if (pessoa.frequenciaReal) {
                freqRealQty = pessoa.frequenciaReal.quantidade || freqRealQty
                const periodoMap = {
                  'Diário': 'day',
                  'Semanal': 'week',
                  'Mensal': 'month'
                }
                freqRealUnit = periodoMap[pessoa.frequenciaReal.periodo] || freqRealUnit || 'month'
              }
            }
            
            return {
              indicator_id: id,
              scenario: 'post_ia',
              person_name: p.person_name,
              role: p.role,
              hourly_rate: p.hourly_rate,
              time_spent_minutes: p.time_spent_minutes,
              is_validation_only: p.is_validation_only || false,
              frequency_real_quantity: freqRealQty,
              frequency_real_unit: freqRealUnit
            }
          })
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

      // Atualizar dados específicos por tipo de indicador
      const improvementType = updatedIndicator.improvement_type || oldIndicator.improvement_type
      
      // Garantir que baselineData tenha tipo definido antes de salvar
      if (indicatorData.baseline_data && !indicatorData.baseline_data.tipo) {
        const typeMap = {
          'productivity': 'PRODUTIVIDADE',
          'analytical_capacity': 'CAPACIDADE ANALÍTICA',
          'revenue_increase': 'INCREMENTO RECEITA',
          'margin_improvement': 'MELHORIA MARGEM',
          'risk_reduction': 'REDUÇÃO DE RISCO',
          'decision_quality': 'QUALIDADE DECISÃO',
          'speed': 'VELOCIDADE',
          'satisfaction': 'SATISFAÇÃO'
        }
        indicatorData.baseline_data.tipo = typeMap[improvementType] || 'PRODUTIVIDADE'
      }

      // Garantir que post_ia_data tenha tipo também
      if (indicatorData.post_ia_data && !indicatorData.post_ia_data.tipo && indicatorData.baseline_data?.tipo) {
        indicatorData.post_ia_data.tipo = indicatorData.baseline_data.tipo
      }

      await this._saveTypeSpecificData(id, improvementType, indicatorData)

      // Log de auditoria
      await auditLogService.log('UPDATE', 'indicator', id, oldIndicator, updatedIndicator)

      return { success: true, indicator: updatedIndicator }
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Salva dados específicos por tipo de indicador na tabela indicator_type_specific_data
   */
  async _saveTypeSpecificData(indicatorId, improvementType, indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('⚠️ _saveTypeSpecificData: Supabase não configurado')
      return
    }

    const baselineData = indicatorData.baseline_data || {}
    const postIAData = indicatorData.post_ia_data || {}
    const baselineType = baselineData.tipo

    // Mapear improvement_type para tipo de baseline
    const typeMap = {
      'productivity': 'PRODUTIVIDADE',
      'analytical_capacity': 'CAPACIDADE ANALÍTICA',
      'revenue_increase': 'INCREMENTO RECEITA',
      'margin_improvement': 'MELHORIA MARGEM',
      'risk_reduction': 'REDUÇÃO DE RISCO',
      'decision_quality': 'QUALIDADE DECISÃO',
      'speed': 'VELOCIDADE',
      'satisfaction': 'SATISFAÇÃO'
    }
    const mappedType = typeMap[improvementType] || baselineType

    // DEBUG: Log inicial
    console.log('🔍 _saveTypeSpecificData - INÍCIO:', {
      indicatorId,
      improvementType,
      baselineType,
      mappedType,
      baselineData,
      postIAData
    })

    const typeSpecificData = {
      indicator_id: indicatorId
    }

    // Extrair dados baseado no tipo
    switch (mappedType) {
      case 'INCREMENTO RECEITA':
        if (baselineData.valorReceitaAntes !== undefined) {
          typeSpecificData.revenue_before = parseFloat(baselineData.valorReceitaAntes) || null
        }
        if (postIAData.valorReceitaDepois !== undefined) {
          typeSpecificData.revenue_after = parseFloat(postIAData.valorReceitaDepois) || null
        }
        break

      case 'MELHORIA MARGEM':
        if (baselineData.receitaBrutaMensal !== undefined) {
          typeSpecificData.gross_revenue_monthly = parseFloat(baselineData.receitaBrutaMensal) || null
        }
        if (baselineData.custoTotalMensal !== undefined) {
          typeSpecificData.total_cost_monthly = parseFloat(baselineData.custoTotalMensal) || null
        }
        if (baselineData.margemBrutaAtual !== undefined) {
          typeSpecificData.current_margin_percentage = parseFloat(baselineData.margemBrutaAtual) || null
        }
        if (postIAData.margemBrutaEstimada !== undefined) {
          typeSpecificData.estimated_margin_percentage = parseFloat(postIAData.margemBrutaEstimada) || null
        }
        if (baselineData.volumeTransacoes !== undefined) {
          typeSpecificData.transaction_volume = parseInt(baselineData.volumeTransacoes) || null
        }
        break

      case 'REDUÇÃO DE RISCO':
        if (baselineData.tipoRisco !== undefined) {
          typeSpecificData.risk_type = baselineData.tipoRisco
        }
        if (baselineData.probabilidadeAtual !== undefined) {
          typeSpecificData.current_probability_percentage = parseFloat(baselineData.probabilidadeAtual) || null
        }
        if (postIAData.probabilidadeComIA !== undefined) {
          typeSpecificData.probability_with_ia_percentage = parseFloat(postIAData.probabilidadeComIA) || null
        }
        if (baselineData.impactoFinanceiro !== undefined) {
          typeSpecificData.financial_impact = parseFloat(baselineData.impactoFinanceiro) || null
        }
        if (baselineData.custoMitigacaoAtual !== undefined) {
          typeSpecificData.mitigation_cost_current = parseFloat(baselineData.custoMitigacaoAtual) || null
        }
        if (postIAData.custoMitigacaoComIA !== undefined) {
          typeSpecificData.mitigation_cost_with_ia = parseFloat(postIAData.custoMitigacaoComIA) || null
        }
        if (baselineData.frequenciaAvaliacao !== undefined) {
          typeSpecificData.evaluation_frequency = parseInt(baselineData.frequenciaAvaliacao) || null
        }
        if (baselineData.periodoAvaliacao !== undefined) {
          typeSpecificData.evaluation_period = baselineData.periodoAvaliacao
        }
        break

      case 'QUALIDADE DECISÃO':
        if (baselineData.numeroDecisoesPeriodo !== undefined) {
          typeSpecificData.decisions_per_period = parseInt(baselineData.numeroDecisoesPeriodo) || null
        }
        if (baselineData.periodo !== undefined) {
          typeSpecificData.decisions_period = baselineData.periodo
        }
        if (baselineData.taxaAcertoAtual !== undefined) {
          typeSpecificData.current_accuracy_percentage = parseFloat(baselineData.taxaAcertoAtual) || null
        }
        if (postIAData.taxaAcertoComIA !== undefined) {
          typeSpecificData.accuracy_with_ia_percentage = parseFloat(postIAData.taxaAcertoComIA) || null
        }
        if (baselineData.custoMedioDecisaoErrada !== undefined) {
          typeSpecificData.avg_cost_wrong_decision = parseFloat(baselineData.custoMedioDecisaoErrada) || null
        }
        if (postIAData.custoMedioDecisaoErradaComIA !== undefined) {
          typeSpecificData.avg_cost_wrong_decision_with_ia = parseFloat(postIAData.custoMedioDecisaoErradaComIA) || null
        }
        if (baselineData.tempoMedioDecisao !== undefined) {
          typeSpecificData.avg_decision_time_minutes = parseInt(baselineData.tempoMedioDecisao) || null
        }
        if (postIAData.tempoMedioDecisaoComIA !== undefined) {
          typeSpecificData.avg_decision_time_with_ia_minutes = parseInt(postIAData.tempoMedioDecisaoComIA) || null
        }
        if (baselineData.pessoasEnvolvidas !== undefined) {
          typeSpecificData.people_involved = parseInt(baselineData.pessoasEnvolvidas) || null
        }
        if (postIAData.pessoasEnvolvidasComIA !== undefined) {
          typeSpecificData.people_involved_with_ia = parseInt(postIAData.pessoasEnvolvidasComIA) || null
        }
        if (baselineData.valorHoraMedio !== undefined) {
          typeSpecificData.avg_hourly_rate = parseFloat(baselineData.valorHoraMedio) || null
        }
        break

      case 'VELOCIDADE':
        if (baselineData.tempoMedioEntregaAtual !== undefined) {
          typeSpecificData.current_delivery_time = parseFloat(baselineData.tempoMedioEntregaAtual) || null
        }
        if (postIAData.tempoMedioEntregaComIA !== undefined) {
          typeSpecificData.delivery_time_with_ia = parseFloat(postIAData.tempoMedioEntregaComIA) || null
        }
        if (baselineData.unidadeTempoEntrega !== undefined) {
          typeSpecificData.delivery_time_unit = baselineData.unidadeTempoEntrega
        }
        if (baselineData.numeroEntregasPeriodo !== undefined) {
          typeSpecificData.deliveries_per_period = parseInt(baselineData.numeroEntregasPeriodo) || null
        }
        if (baselineData.periodoEntregas !== undefined) {
          typeSpecificData.deliveries_period = baselineData.periodoEntregas
        }
        if (baselineData.custoPorAtraso !== undefined) {
          typeSpecificData.cost_per_delay = parseFloat(baselineData.custoPorAtraso) || null
        }
        if (postIAData.custoPorAtrasoReduzido !== undefined) {
          typeSpecificData.cost_per_delay_reduced = parseFloat(postIAData.custoPorAtrasoReduzido) || null
        }
        if (baselineData.tempoTrabalhoPorEntrega !== undefined) {
          typeSpecificData.work_time_per_delivery_hours = parseFloat(baselineData.tempoTrabalhoPorEntrega) || null
        }
        if (postIAData.tempoTrabalhoPorEntregaComIA !== undefined) {
          typeSpecificData.work_time_per_delivery_with_ia_hours = parseFloat(postIAData.tempoTrabalhoPorEntregaComIA) || null
        }
        break

      case 'SATISFAÇÃO':
        if (baselineData.scoreAtual !== undefined) {
          typeSpecificData.current_score = parseFloat(baselineData.scoreAtual) || null
        }
        if (postIAData.scoreComIA !== undefined) {
          typeSpecificData.score_with_ia = parseFloat(postIAData.scoreComIA) || null
        }
        if (baselineData.tipoScore !== undefined) {
          typeSpecificData.score_type = baselineData.tipoScore
        }
        if (baselineData.numeroClientes !== undefined) {
          typeSpecificData.number_of_customers = parseInt(baselineData.numeroClientes) || null
        }
        if (baselineData.valorMedioPorCliente !== undefined) {
          typeSpecificData.avg_value_per_customer = parseFloat(baselineData.valorMedioPorCliente) || null
        }
        if (baselineData.taxaChurnAtual !== undefined) {
          typeSpecificData.current_churn_rate_percentage = parseFloat(baselineData.taxaChurnAtual) || null
        }
        if (postIAData.taxaChurnComIA !== undefined) {
          typeSpecificData.churn_rate_with_ia_percentage = parseFloat(postIAData.taxaChurnComIA) || null
        }
        if (baselineData.custoAquisicaoCliente !== undefined) {
          typeSpecificData.customer_acquisition_cost = parseFloat(baselineData.custoAquisicaoCliente) || null
        }
        if (baselineData.ticketMedioSuporte !== undefined) {
          typeSpecificData.avg_support_tickets_per_month = parseInt(baselineData.ticketMedioSuporte) || null
        }
        break

      case 'CAPACIDADE ANALÍTICA':
        if (baselineData.quantidadeAnalises !== undefined) {
          typeSpecificData.analyses_before = parseInt(baselineData.quantidadeAnalises) || null
        }
        if (postIAData.quantidadeAnalises !== undefined) {
          typeSpecificData.analyses_after = parseInt(postIAData.quantidadeAnalises) || null
        }
        if (baselineData.valorPorAnalise !== undefined) {
          typeSpecificData.value_per_analysis = parseFloat(baselineData.valorPorAnalise) || null
        }
        break
    }

    // Remover indicator_id do objeto antes de fazer upsert
    const { indicator_id, ...dataToSave } = typeSpecificData

    // Verificar se há dados para salvar (além do indicator_id)
    if (Object.keys(dataToSave).length === 0) {
      console.warn('⚠️ _saveTypeSpecificData: Nenhum dado para salvar', {
        indicatorId,
        mappedType,
        baselineData,
        postIAData
      })
      return
    }

    // DEBUG: Log antes de salvar
    console.log('💾 _saveTypeSpecificData - Salvando:', {
      indicatorId,
      mappedType,
      dataToSave,
      hasData: Object.keys(dataToSave).length > 0
    })

    // Upsert na tabela indicator_type_specific_data
    const { data, error } = await supabase
      .from('indicator_type_specific_data')
      .upsert({
        indicator_id: indicatorId,
        ...dataToSave
      }, {
        onConflict: 'indicator_id'
      })

    if (error) {
      console.error('❌ Erro ao salvar dados específicos do tipo:', error)
      console.error('Dados que tentaram ser salvos:', { indicatorId, ...dataToSave })
      // Não falha a operação principal se houver erro aqui
    } else {
      console.log('✅ Dados específicos salvos com sucesso:', data)
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

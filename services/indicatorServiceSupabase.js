/**
 * Serviço de Indicadores com Supabase
 * Gerencia CRUD de indicadores usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

// Função para validar se um ID é um UUID válido
const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const indicatorServiceSupabase = {
  /**
   * Retorna todos os indicadores do usuário autenticado
   */
  async getAll() {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('indicators')
        .select('*')
        .order('created_at', { ascending: false })

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

    // Valida se projectId é UUID válido
    if (projectId && !isValidUUID(projectId)) {
      console.warn(`getByProjectId: projectId inválido (não é UUID): ${projectId}`)
      return []
    }

    try {
      const { data, error } = await supabase
        .from('indicators')
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

    // Valida se é um UUID válido antes de buscar no Supabase
    if (!isValidUUID(id)) {
      console.warn(`ID inválido (não é UUID): ${id}. Provavelmente vem do localStorage antigo.`)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('indicators')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        // Não loga erro se for erro de UUID inválido (já validamos antes)
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
   * Retorna indicador completo com dados formatados (compatibilidade com formato antigo)
   */
  async getCompleteById(id) {
    if (!id) {
      console.warn('getCompleteById chamado sem ID')
      return null
    }

    // Valida UUID antes de buscar
    if (!isValidUUID(id)) {
      console.warn(`getCompleteById: ID inválido (não é UUID): ${id}. Provavelmente vem do localStorage antigo.`)
      return null
    }

    try {
      const indicator = await this.getById(id)
      if (!indicator) return null

      // Formata dados para compatibilidade com código existente
      const infoData = indicator.info_data || {}
      const baselineData = indicator.baseline_data || {}
      const iaData = indicator.ia_data || {}
      const custosData = indicator.custos_data || {}
      const postIAData = indicator.post_ia_data || {}

      return {
        id: indicator.id,
        projetoId: indicator.project_id,
        // Info
        nome: infoData.nome,
        tipoIndicador: infoData.tipoIndicador,
        descricao: infoData.descricao,
        camposEspecificos: infoData.camposEspecificos || {},
        // Baseline (estruturado ou legado)
        baseline: baselineData.baselineData ? {} : baselineData, // Se tem baselineData estruturado, baseline fica vazio
        baselineData: baselineData.baselineData || (Object.keys(baselineData).length > 0 ? baselineData : null),
        // IA (mantém compatibilidade com comIA)
        comIA: iaData || {},
        ia: iaData || {},
        // Custos
        custos: custosData.custos || custosData || [],
        // Pós-IA
        postIAData: postIAData.postIAData || (Object.keys(postIAData).length > 0 ? postIAData : null),
        // Metadados
        criadoEm: indicator.created_at,
        atualizadoEm: indicator.updated_at
      }
    } catch (error) {
      console.error('Erro ao buscar indicador completo:', error)
      return null
    }
  },

  /**
   * Cria um novo indicador
   */
  async create(indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const { data, error } = await supabase
        .from('indicators')
        .insert({
          project_id: indicatorData.projectId || indicatorData.projetoId,
          user_id: user.id,
          info_data: indicatorData.info_data || {},
          baseline_data: indicatorData.baseline_data || {},
          ia_data: indicatorData.ia_data || {},
          custos_data: indicatorData.custos_data || {},
          post_ia_data: indicatorData.post_ia_data || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar indicador:', error)
        return { success: false, error: error.message }
      }

      return { success: true, indicator: data }
    } catch (error) {
      console.error('Erro ao criar indicador:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza um indicador existente
   */
  async update(id, indicatorData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    // Valida UUID antes de atualizar
    if (!isValidUUID(id)) {
      console.warn(`update: ID inválido (não é UUID): ${id}. Provavelmente vem do localStorage antigo.`)
      return { success: false, error: 'ID inválido. Indicador precisa ser recriado no Supabase.' }
    }

    try {
      const updateData = {}
      
      // Atualiza apenas os campos fornecidos
      if (indicatorData.info_data !== undefined) updateData.info_data = indicatorData.info_data
      if (indicatorData.baseline_data !== undefined) updateData.baseline_data = indicatorData.baseline_data
      if (indicatorData.ia_data !== undefined) updateData.ia_data = indicatorData.ia_data
      if (indicatorData.custos_data !== undefined) updateData.custos_data = indicatorData.custos_data
      if (indicatorData.post_ia_data !== undefined) updateData.post_ia_data = indicatorData.post_ia_data
      if (indicatorData.project_id !== undefined) updateData.project_id = indicatorData.project_id
      if (indicatorData.projectId !== undefined) updateData.project_id = indicatorData.projectId
      if (indicatorData.projetoId !== undefined) updateData.project_id = indicatorData.projetoId

      const { data, error } = await supabase
        .from('indicators')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar indicador:', error)
        return { success: false, error: error.message }
      }

      return { success: true, indicator: data }
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

    // Valida UUID antes de deletar
    if (!isValidUUID(id)) {
      console.warn(`delete: ID inválido (não é UUID): ${id}. Provavelmente vem do localStorage antigo.`)
      return { success: false, error: 'ID inválido. Indicador não existe no Supabase.' }
    }

    try {
      const { error } = await supabase
        .from('indicators')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar indicador:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar indicador:', error)
      return { success: false, error: error.message }
    }
  }
}

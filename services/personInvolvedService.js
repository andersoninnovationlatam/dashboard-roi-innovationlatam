/**
 * Serviço de Pessoas Envolvidas com Supabase
 * Gerencia CRUD de persons_involved usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const personInvolvedService = {
  /**
   * Retorna todas as pessoas envolvidas de um indicador
   */
  async getByIndicatorId(indicatorId, scenario = null) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      let query = supabase
        .from('persons_involved')
        .select('*')
        .eq('indicator_id', indicatorId)

      if (scenario) {
        query = query.eq('scenario', scenario)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar pessoas envolvidas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar pessoas envolvidas:', error)
      return []
    }
  },

  /**
   * Retorna pessoa envolvida por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('persons_involved')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar pessoa envolvida:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar pessoa envolvida:', error)
      return null
    }
  },

  /**
   * Cria uma nova pessoa envolvida
   */
  async create(personData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { data, error } = await supabase
        .from('persons_involved')
        .insert({
          indicator_id: personData.indicator_id,
          scenario: personData.scenario,
          person_name: personData.person_name,
          role: personData.role,
          hourly_rate: personData.hourly_rate,
          time_spent_minutes: personData.time_spent_minutes,
          is_validation_only: personData.is_validation_only || false
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar pessoa envolvida:', error)
        return { success: false, error: error.message }
      }

      return { success: true, person: data }
    } catch (error) {
      console.error('Erro ao criar pessoa envolvida:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Cria múltiplas pessoas envolvidas
   */
  async createMany(personsData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    if (!Array.isArray(personsData) || personsData.length === 0) {
      return { success: true, persons: [] }
    }

    try {
      const { data, error } = await supabase
        .from('persons_involved')
        .insert(personsData)
        .select()

      if (error) {
        console.error('Erro ao criar pessoas envolvidas:', error)
        return { success: false, error: error.message }
      }

      return { success: true, persons: data || [] }
    } catch (error) {
      console.error('Erro ao criar pessoas envolvidas:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza uma pessoa envolvida
   */
  async update(id, personData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}
      
      if (personData.person_name !== undefined) updateData.person_name = personData.person_name
      if (personData.role !== undefined) updateData.role = personData.role
      if (personData.hourly_rate !== undefined) updateData.hourly_rate = personData.hourly_rate
      if (personData.time_spent_minutes !== undefined) updateData.time_spent_minutes = personData.time_spent_minutes
      if (personData.is_validation_only !== undefined) updateData.is_validation_only = personData.is_validation_only

      const { data, error } = await supabase
        .from('persons_involved')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar pessoa envolvida:', error)
        return { success: false, error: error.message }
      }

      return { success: true, person: data }
    } catch (error) {
      console.error('Erro ao atualizar pessoa envolvida:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta uma pessoa envolvida
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('persons_involved')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar pessoa envolvida:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar pessoa envolvida:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta todas as pessoas envolvidas de um indicador e cenário
   */
  async deleteByIndicatorAndScenario(indicatorId, scenario) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('persons_involved')
        .delete()
        .eq('indicator_id', indicatorId)
        .eq('scenario', scenario)

      if (error) {
        console.error('Erro ao deletar pessoas envolvidas:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar pessoas envolvidas:', error)
      return { success: false, error: error.message }
    }
  }
}

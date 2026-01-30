/**
 * Serviço de Organizações com Supabase
 * Gerencia CRUD de organizações usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const organizationServiceSupabase = {
  /**
   * Retorna todas as organizações (limitado por RLS)
   */
  async getAll() {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, retornando array vazio')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar organizações:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar organizações:', error)
      return []
    }
  },

  /**
   * Retorna organização por ID
   */
  async getById(id) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar organização:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar organização:', error)
      return null
    }
  },

  /**
   * Retorna organização por slug
   */
  async getBySlug(slug) {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Erro ao buscar organização por slug:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar organização por slug:', error)
      return null
    }
  },

  /**
   * Cria uma nova organização
   */
  async create(organizationData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Gerar slug se não fornecido
      const slug = organizationData.slug || this.generateSlug(organizationData.name)

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: organizationData.name,
          slug: slug,
          logo_url: organizationData.logo_url || null,
          industry: organizationData.industry || null,
          contact_email: organizationData.contact_email || null,
          is_active: organizationData.is_active !== undefined ? organizationData.is_active : true
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar organização:', error)
        return { success: false, error: error.message }
      }

      return { success: true, organization: data }
    } catch (error) {
      console.error('Erro ao criar organização:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Atualiza uma organização existente
   */
  async update(id, organizationData) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const updateData = {}
      
      if (organizationData.name !== undefined) updateData.name = organizationData.name
      if (organizationData.slug !== undefined) updateData.slug = organizationData.slug
      if (organizationData.logo_url !== undefined) updateData.logo_url = organizationData.logo_url
      if (organizationData.industry !== undefined) updateData.industry = organizationData.industry
      if (organizationData.contact_email !== undefined) updateData.contact_email = organizationData.contact_email
      if (organizationData.is_active !== undefined) updateData.is_active = organizationData.is_active

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar organização:', error)
        return { success: false, error: error.message }
      }

      return { success: true, organization: data }
    } catch (error) {
      console.error('Erro ao atualizar organização:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Deleta uma organização
   */
  async delete(id) {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar organização:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar organização:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Gera slug a partir do nome
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui espaços e caracteres especiais por hífen
      .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
  },

  /**
   * Valida se slug é único
   */
  async isSlugUnique(slug, excludeId = null) {
    if (!isSupabaseConfigured || !supabase) {
      return false
    }

    try {
      let query = supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao validar slug:', error)
        return false
      }

      return data.length === 0
    } catch (error) {
      console.error('Erro ao validar slug:', error)
      return false
    }
  }
}

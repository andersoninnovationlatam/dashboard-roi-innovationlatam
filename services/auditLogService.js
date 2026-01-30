/**
 * Serviço de Logs de Auditoria com Supabase
 * Gerencia CRUD de audit_logs usando Supabase
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase'

export const auditLogService = {
  /**
   * Cria um log de auditoria
   */
  async log(action, entityType, entityId, oldValues = null, newValues = null) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase não configurado, log de auditoria não será salvo')
      return { success: false, error: 'Supabase não configurado' }
    }

    try {
      // Obter usuário atual
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || null

      // Obter organização do usuário
      let organizationId = null
      if (userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userId)
          .single()
        
        if (userData) {
          organizationId = userData.organization_id
        }
      }

      // Obter IP e User Agent (se disponível no navegador)
      const ipAddress = null // Será preenchido pelo backend se necessário
      const userAgent = navigator.userAgent || null

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          action: action,
          entity_type: entityType,
          entity_id: entityId,
          old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar log de auditoria:', error)
        // Não falhar silenciosamente, mas não bloquear a operação principal
        return { success: false, error: error.message }
      }

      return { success: true, log: data }
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Retorna logs de auditoria por organização
   */
  async getByOrganization(organizationId, limit = 100) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  },

  /**
   * Retorna logs de auditoria por entidade
   */
  async getByEntity(entityType, entityId) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  },

  /**
   * Retorna logs de auditoria por usuário
   */
  async getByUser(userId, limit = 100) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  },

  /**
   * Retorna logs de auditoria por ação
   */
  async getByAction(action, limit = 100) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', action)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  },

  /**
   * Retorna logs de auditoria por período
   */
  async getByDateRange(startDate, endDate, organizationId = null) {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  }
}

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { projectServiceSupabase } from '../services/projectServiceSupabase'
import { indicatorServiceSupabase } from '../services/indicatorServiceSupabase'
import { organizationServiceSupabase } from '../services/organizationServiceSupabase'
import { trackingService } from '../services/trackingService'
import { calculatedResultsService } from '../services/calculatedResultsService'
import { calcularROIIndicador, calcularROIProjeto } from '../services/roiCalculatorService'
import { useAuth } from './AuthContext'
import { supabase } from '../src/lib/supabase'

const DataContext = createContext(null)

export const DataProvider = ({ children }) => {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [indicators, setIndicators] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  // Logs removidos para melhorar performance (manter apenas em desenvolvimento se necessário)

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setProjects([])
      setIndicators([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // CRÍTICO: Valida sessão antes de carregar dados
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn('🔒 Sessão inválida detectada ao carregar dados')
        setProjects([])
        setIndicators([])
        setLoading(false)
        // Força logout por segurança
        if (logout) {
          console.warn('🚪 Fazendo logout devido a sessão inválida')
          await logout()
        }
        return
      }

      // OTIMIZAÇÃO: Carrega projetos, indicadores e organização em PARALELO
      const [projectsData, indicatorsData, orgData] = await Promise.all([
        projectServiceSupabase.getAll(),
        indicatorServiceSupabase.getAll(),
        user?.organization_id
          ? organizationServiceSupabase.getById(user.organization_id)
          : Promise.resolve(null)
      ])

      setProjects(projectsData || [])
      setIndicators(indicatorsData || [])

      if (orgData) {
        setOrganizations([orgData])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)

      // Se erro de autenticação, limpa tudo e faz logout
      const errorMsg = error.message?.toLowerCase() || ''
      if (
        errorMsg.includes('jwt') ||
        errorMsg.includes('invalid') ||
        errorMsg.includes('expired') ||
        errorMsg.includes('unauthorized') ||
        errorMsg === 'invalid_session' ||
        errorMsg === 'token_expired' ||
        errorMsg === 'auth_error'
      ) {
        console.error('🔒 Erro de autenticação detectado ao carregar dados, fazendo logout')
        setProjects([])
        setIndicators([])
        if (logout) {
          await logout()
        }
      } else {
        setProjects([])
        setIndicators([])
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.organization_id, logout])

  // Carrega dados inicialmente e configura subscriptions real-time
  useEffect(() => {
    if (!user?.id) {
      setProjects([])
      setIndicators([])
      setLoading(false)
      return
    }

    // Primeira carga
    loadData()

    // OTIMIZAÇÃO: Revalida a cada 60 segundos (reduzido de 30s para melhor performance)
    // E apenas se a aba do navegador estiver ativa
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }, 60000) // 60 segundos

    return () => {
      clearInterval(intervalId)
    }
  }, [user?.id, loadData])

  const createProject = async (data) => {
    // Validação adicional: verifica se usuário está autenticado
    if (!user?.id) {
      console.warn('createProject: usuário não autenticado no contexto')
      return {
        success: false,
        error: 'Usuário não autenticado. Por favor, aguarde ou faça login novamente.'
      }
    }

    const result = await projectServiceSupabase.create(data)
    if (result.success) {
      await loadData()
      return result
    }
    return result
  }

  const updateProject = async (id, data) => {
    const result = await projectServiceSupabase.update(id, data)
    if (result.success) {
      await loadData()
      return result
    }
    return result
  }

  const deleteProject = async (id) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' }
    const result = await projectServiceSupabase.delete(id)
    if (result.success) {
      // Remove indicadores do projeto
      const projectIndicators = await indicatorServiceSupabase.getByProjectId(id)
      for (const ind of projectIndicators) {
        await indicatorServiceSupabase.delete(ind.id)
      }
      await loadData()
      return result
    }
    return result
  }

  const createIndicator = async (data) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const result = await indicatorServiceSupabase.create(data)
    if (result.success && result.indicator) {
      // Atualiza estado localmente em vez de recarregar tudo
      setIndicators(prev => [...prev, result.indicator])
      return result
    }
    return result
  }

  const updateIndicator = async (id, data) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const result = await indicatorServiceSupabase.update(id, data)
    if (result.success && result.indicator) {
      // Atualiza estado localmente em vez de recarregar tudo
      setIndicators(prev => prev.map(ind => ind.id === id ? result.indicator : ind))
      return result
    }
    return result
  }

  const deleteIndicator = async (id) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const result = await indicatorServiceSupabase.delete(id)
    if (result.success) {
      // Remove do estado localmente em vez de recarregar tudo
      setIndicators(prev => prev.filter(ind => ind.id !== id))
      return result
    }
    return result
  }

  const getProjectById = useCallback((id) => {
    // Busca do estado (sempre atualizado após loadData)
    return projects.find(p => p.id === id) || null
  }, [projects])

  const getIndicatorsByProjectId = async (projectId) => {
    if (!user?.id) {
      return []
    }

    try {
      const supabaseIndicators = await indicatorServiceSupabase.getByProjectId(projectId)
      return supabaseIndicators || []
    } catch (error) {
      console.error('Erro ao buscar indicadores do Supabase:', error)
      return []
    }
  }

  const getIndicatorById = useCallback(async (id) => {
    if (!user?.id) {
      return null
    }

    try {
      const completeIndicator = await indicatorServiceSupabase.getCompleteById(id)
      return completeIndicator
    } catch (error) {
      console.error('Erro ao buscar indicador do Supabase:', error)
      return null
    }
  }, [user?.id])

  const calculateProjectROI = async (projectId) => {
    // Busca indicadores completos para cálculo
    try {
      const project = getProjectById(projectId)
      const projectIndicators = await getIndicatorsByProjectId(projectId)
      if (!Array.isArray(projectIndicators) || projectIndicators.length === 0) {
        return calcularROIProjeto(projectId, [], project)
      }

      // Valida UUID antes de buscar indicadores completos
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const validIndicators = projectIndicators.filter(ind => ind && ind.id && uuidRegex.test(ind.id))

      const completeIndicators = await Promise.all(
        validIndicators.map(async ind => {
          try {
            const complete = await getIndicatorById(ind.id)
            return complete
          } catch (error) {
            console.error(`Erro ao buscar indicador ${ind.id}:`, error)
            return null
          }
        })
      )
      return calcularROIProjeto(projectId, completeIndicators.filter(Boolean), project)
    } catch (error) {
      console.error('Erro ao calcular ROI do projeto:', error)
      const project = getProjectById(projectId)
      return calcularROIProjeto(projectId, [], project)
    }
  }

  const calculateIndicatorROI = (indicator) => {
    return calcularROIIndicador(indicator)
  }

  // Métodos para organizações
  const getOrganizationById = useCallback(async (id) => {
    return await organizationServiceSupabase.getById(id)
  }, [])

  const getCurrentOrganization = useCallback(() => {
    if (!user?.organization_id) return null
    return organizations.find(org => org.id === user.organization_id) || null
  }, [organizations, user?.organization_id])

  // Métodos para tracking
  const getTrackingByIndicatorId = useCallback(async (indicatorId) => {
    return await trackingService.getByIndicatorId(indicatorId)
  }, [])

  const createTracking = useCallback(async (trackingData) => {
    const result = await trackingService.create(trackingData)
    if (result.success) {
      await loadData()
    }
    return result
  }, [loadData])

  const updateTracking = useCallback(async (id, trackingData) => {
    const result = await trackingService.update(id, trackingData)
    if (result.success) {
      await loadData()
    }
    return result
  }, [loadData])

  // Métodos para calculated_results
  const getCalculatedResultByIndicatorId = useCallback(async (indicatorId) => {
    return await calculatedResultsService.getLatestByIndicatorId(indicatorId)
  }, [])

  const upsertCalculatedResult = useCallback(async (resultData) => {
    return await calculatedResultsService.upsert(resultData)
  }, [])

  // Memoiza o value para evitar re-renders desnecessários em componentes filhos
  const value = useMemo(() => ({
    projects,
    indicators,
    organizations,
    loading,
    // Projetos
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    // Indicadores
    createIndicator,
    updateIndicator,
    deleteIndicator,
    getIndicatorsByProjectId,
    getIndicatorById,
    // Cálculos
    calculateProjectROI,
    calculateIndicatorROI,
    // Organizações
    getOrganizationById,
    getCurrentOrganization,
    // Tracking
    getTrackingByIndicatorId,
    createTracking,
    updateTracking,
    // Calculated Results
    getCalculatedResultByIndicatorId,
    upsertCalculatedResult,
    // Utilitários
    refreshData: loadData
  }), [
    projects,
    indicators,
    organizations,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createIndicator,
    updateIndicator,
    deleteIndicator,
    getProjectById,
    getIndicatorsByProjectId,
    getIndicatorById,
    calculateProjectROI,
    calculateIndicatorROI,
    getOrganizationById,
    getCurrentOrganization,
    getTrackingByIndicatorId,
    createTracking,
    updateTracking,
    getCalculatedResultByIndicatorId,
    upsertCalculatedResult,
    loadData
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData deve ser usado dentro de DataProvider')
  }
  return context
}

export { useData }

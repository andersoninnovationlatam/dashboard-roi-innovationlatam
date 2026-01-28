import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { projectServiceSupabase } from '../services/projectServiceSupabase'
import { indicatorServiceSupabase } from '../services/indicatorServiceSupabase'
import { indicatorService } from '../services/indicatorService'
import { indicatorDataService } from '../services/indicatorDataService'
import { migrationService } from '../services/migrationService'
import { calcularROIIndicador, calcularROIProjeto } from '../services/roiCalculatorService'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setProjects([])
      setIndicators([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Carrega projetos do Supabase (passa userId para filtro explícito)
      const projectsData = await projectServiceSupabase.getAll(user.id)
      setProjects(projectsData || [])
      
      // Carrega indicadores do Supabase
      const indicatorsData = await indicatorServiceSupabase.getAll()
      setIndicators(indicatorsData || [])
      
      // Mantém compatibilidade com localStorage durante transição
      const localStorageIndicators = indicatorService.getAll()
      if (localStorageIndicators.length > 0 && indicatorsData.length === 0) {
        // Se não há indicadores no Supabase mas há no localStorage, usa localStorage
        setIndicators(localStorageIndicators)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Em caso de erro, tenta carregar do localStorage
      setIndicators(indicatorService.getAll())
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // Inicializa serviços
    indicatorService.initialize()
    
    // Executa migração se necessário
    migrationService.migrateIfNeeded()
    
    // Carrega dados iniciais
    if (user?.id) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, loadData])

  const createProject = async (data) => {
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
    const result = await projectServiceSupabase.delete(id, user.id)
    if (result.success) {
      // Remove indicadores do projeto do Supabase
      const projectIndicators = await indicatorServiceSupabase.getByProjectId(id)
      for (const ind of projectIndicators) {
        await indicatorServiceSupabase.delete(ind.id)
      }
      // Também remove do localStorage para compatibilidade
      const localStorageIndicators = indicatorService.getByProjectId(id)
      localStorageIndicators.forEach(ind => indicatorService.delete(ind.id))
      await loadData()
      return result
    }
    return result
  }

  const createIndicator = async (data) => {
    // Mantém compatibilidade: se não tem user, usa localStorage
    if (!user?.id) {
      const result = indicatorService.create(data)
      if (result.success) {
        setIndicators(indicatorService.getAll())
        return result
      }
      return result
    }
    
    // Usa Supabase
    const result = await indicatorServiceSupabase.create(data)
    if (result.success) {
      await loadData()
      return result
    }
    return result
  }

  const updateIndicator = async (id, data) => {
    // Mantém compatibilidade: se não tem user, usa localStorage
    if (!user?.id) {
      const result = indicatorService.update(id, data)
      if (result.success) {
        setIndicators(indicatorService.getAll())
        return result
      }
      return result
    }
    
    // Usa Supabase
    const result = await indicatorServiceSupabase.update(id, data)
    if (result.success) {
      await loadData()
      return result
    }
    return result
  }

  const deleteIndicator = async (id) => {
    // Mantém compatibilidade: se não tem user, usa localStorage
    if (!user?.id) {
      const result = indicatorService.delete(id)
      if (result.success) {
        setIndicators(indicatorService.getAll())
        return result
      }
      return result
    }
    
    // Usa Supabase
    const result = await indicatorServiceSupabase.delete(id)
    if (result.success) {
      await loadData()
      return result
    }
    return result
  }

  const getProjectById = (id) => {
    // Busca do estado (sempre atualizado após loadData)
    return projects.find(p => p.id === id) || null
  }

  const getIndicatorsByProjectId = async (projectId) => {
    // Tenta buscar do Supabase primeiro
    if (user?.id) {
      try {
        const supabaseIndicators = await indicatorServiceSupabase.getByProjectId(projectId)
        if (supabaseIndicators.length > 0) {
          return supabaseIndicators
        }
      } catch (error) {
        console.error('Erro ao buscar indicadores do Supabase:', error)
      }
    }
    
    // Fallback para localStorage - filtra apenas IDs válidos (UUIDs)
    const localStorageIndicators = indicatorService.getByProjectId(projectId)
    // Filtra indicadores com IDs que não são UUIDs válidos (vindos do localStorage antigo)
    // Esses indicadores precisam ser migrados ou recriados no Supabase
    return localStorageIndicators.filter(ind => {
      // Se não tem ID ou ID não é UUID válido, não retorna
      if (!ind || !ind.id) return false
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(ind.id)
    })
  }

  const getIndicatorById = async (id) => {
    // Tenta buscar do Supabase primeiro
    if (user?.id) {
      try {
        const completeIndicator = await indicatorServiceSupabase.getCompleteById(id)
        if (completeIndicator) {
          return completeIndicator
        }
      } catch (error) {
        console.error('Erro ao buscar indicador do Supabase:', error)
      }
    }
    
    // Fallback para localStorage
    return indicatorService.getCompleteById(id)
  }

  const calculateProjectROI = async (projectId) => {
    // Busca indicadores completos para cálculo
    try {
      const projectIndicators = await getIndicatorsByProjectId(projectId)
      if (!Array.isArray(projectIndicators) || projectIndicators.length === 0) {
        return calcularROIProjeto(projectId, [])
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
      return calcularROIProjeto(projectId, completeIndicators.filter(Boolean))
    } catch (error) {
      console.error('Erro ao calcular ROI do projeto:', error)
      return calcularROIProjeto(projectId, [])
    }
  }

  const calculateIndicatorROI = (indicator) => {
    // Se o indicador não tiver dados completos, busca
    if (!indicator.baseline && !indicator.comIA) {
      const complete = indicatorService.getCompleteById(indicator.id)
      if (complete) {
        return calcularROIIndicador(complete)
      }
    }
    return calcularROIIndicador(indicator)
  }

  const value = {
    projects,
    indicators,
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
    refreshData: loadData
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData deve ser usado dentro de DataProvider')
  }
  return context
}

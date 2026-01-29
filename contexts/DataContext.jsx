import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { projectServiceSupabase } from '../services/projectServiceSupabase'
import { indicatorServiceSupabase } from '../services/indicatorServiceSupabase'
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
      // Carrega projetos do Supabase
      const projectsData = await projectServiceSupabase.getAll(user.id)
      setProjects(projectsData || [])
      
      // Carrega indicadores do Supabase
      const indicatorsData = await indicatorServiceSupabase.getAll()
      setIndicators(indicatorsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setProjects([])
      setIndicators([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
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
      const projectIndicators = await indicatorServiceSupabase.getByProjectId(id, user.id)
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
    
    // Usa Supabase
    const result = await indicatorServiceSupabase.create(data)
    if (result.success) {
      await loadData()
      return result
    }
    return result
  }

  const updateIndicator = async (id, data) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
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
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
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
    if (!user?.id) {
      console.warn('Usuário não autenticado')
      return []
    }
    
    try {
      return await indicatorServiceSupabase.getByProjectId(projectId, user.id)
    } catch (error) {
      console.error('Erro ao buscar indicadores:', error)
      return []
    }
  }

  const getIndicatorById = async (id) => {
    if (!user?.id) {
      console.warn('Usuário não autenticado')
      return null
    }
    
    try {
      return await indicatorServiceSupabase.getCompleteById(id)
    } catch (error) {
      console.error('Erro ao buscar indicador:', error)
      return null
    }
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

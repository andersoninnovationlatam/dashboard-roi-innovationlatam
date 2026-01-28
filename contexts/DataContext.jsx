import React, { createContext, useContext, useState, useEffect } from 'react'
import { projectService } from '../services/projectService'
import { indicatorService } from '../services/indicatorService'
import { indicatorDataService } from '../services/indicatorDataService'
import { migrationService } from '../services/migrationService'
import { calcularROIIndicador, calcularROIProjeto } from '../services/roiCalculatorService'

const DataContext = createContext(null)

export const DataProvider = ({ children }) => {
  const [projects, setProjects] = useState([])
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Inicializa serviços
    projectService.initialize()
    indicatorService.initialize()
    
    // Executa migração se necessário
    migrationService.migrateIfNeeded()
    
    // Carrega dados iniciais
    loadData()
  }, [])

  const loadData = () => {
    setProjects(projectService.getAll())
    setIndicators(indicatorService.getAll())
    setLoading(false)
  }

  const createProject = (data) => {
    const result = projectService.create(data)
    if (result.success) {
      setProjects(projectService.getAll())
      return result
    }
    return result
  }

  const updateProject = (id, data) => {
    const result = projectService.update(id, data)
    if (result.success) {
      setProjects(projectService.getAll())
      return result
    }
    return result
  }

  const deleteProject = (id) => {
    const result = projectService.delete(id)
    if (result.success) {
      setProjects(projectService.getAll())
      // Remove indicadores do projeto
      const projectIndicators = indicatorService.getByProjectId(id)
      projectIndicators.forEach(ind => indicatorService.delete(ind.id))
      setIndicators(indicatorService.getAll())
      return result
    }
    return result
  }

  const createIndicator = (data) => {
    const result = indicatorService.create(data)
    if (result.success) {
      setIndicators(indicatorService.getAll())
      return result
    }
    return result
  }

  const updateIndicator = (id, data) => {
    const result = indicatorService.update(id, data)
    if (result.success) {
      setIndicators(indicatorService.getAll())
      return result
    }
    return result
  }

  const deleteIndicator = (id) => {
    const result = indicatorService.delete(id)
    if (result.success) {
      setIndicators(indicatorService.getAll())
      return result
    }
    return result
  }

  const getProjectById = (id) => {
    return projectService.getById(id)
  }

  const getIndicatorsByProjectId = (projectId) => {
    return indicatorService.getByProjectId(projectId)
  }

  const getIndicatorById = (id) => {
    // Retorna indicador completo com dados de todas as abas
    return indicatorService.getCompleteById(id)
  }

  const calculateProjectROI = (projectId) => {
    // Busca indicadores completos para cálculo
    const projectIndicators = indicatorService.getByProjectId(projectId)
    const completeIndicators = projectIndicators.map(ind => 
      indicatorService.getCompleteById(ind.id)
    ).filter(Boolean)
    return calcularROIProjeto(projectId, completeIndicators)
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

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { projectServiceSupabase } from '../services/projectServiceSupabase'
import { indicatorServiceSupabase } from '../services/indicatorServiceSupabase'
import { calcularROIIndicador, calcularROIProjeto } from '../services/roiCalculatorService'
import { useAuth } from './AuthContext'
import { supabase } from '../src/lib/supabase'

const DataContext = createContext(null)

export const DataProvider = ({ children }) => {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading] = useState(true)

  // Log quando user muda
  useEffect(() => {
    console.log('👤 [DataContext] User mudou:', user?.id || 'null')
  }, [user?.id])

  // Log quando indicadores mudam
  useEffect(() => {
    console.log('📊 [DataContext] Estado de indicadores mudou:', indicators.length, 'indicadores')
    if (indicators.length > 0) {
      console.log('📊 [DataContext] IDs dos indicadores:', indicators.map(ind => ind.id))
    }
  }, [indicators])

  const loadData = useCallback(async () => {
    console.log('🔄 [DataContext] loadData chamado - Stack trace:', new Error().stack?.split('\n')[2]?.trim())
    if (!user?.id) {
      setProjects([])
      setIndicators([])
      setLoading(false)
      return
    }

    console.log('🔄 [DataContext] loadData iniciando carregamento...')
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

      // Carrega projetos do Supabase
      const projectsData = await projectServiceSupabase.getAll(user.id)
      setProjects(projectsData || [])
      
      // Carrega indicadores do Supabase
      console.log('📊 [DataContext] Carregando indicadores do Supabase...')
      const indicatorsData = await indicatorServiceSupabase.getAll()
      console.log('📊 [DataContext] Indicadores carregados:', indicatorsData?.length || 0, 'indicadores')
      setIndicators(indicatorsData || [])
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
  }, [user, logout])

  // CRÍTICO: Revalida dados e sessão periodicamente
  useEffect(() => {
    console.log('🔄 [DataContext] useEffect de revalidação executado - user?.id:', user?.id)
    if (!user?.id) {
      setProjects([])
      setIndicators([])
      setLoading(false)
      return
    }

    // Primeira carga
    console.log('🔄 [DataContext] Primeira carga de dados...')
    loadData()

    // Revalida a cada 30 segundos
    const intervalId = setInterval(() => {
      console.log('🔄 [DataContext] Revalidação periódica (30s) - executando loadData...')
      loadData()
    }, 30000) // 30 segundos

    return () => {
      console.log('🔄 [DataContext] Limpando intervalo de revalidação')
      clearInterval(intervalId)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const result = await projectServiceSupabase.delete(id, user.id)
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
    console.log('📊 [DataContext] createIndicator chamado')
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }
    
    const result = await indicatorServiceSupabase.create(data)
    if (result.success && result.indicator) {
      console.log('📊 [DataContext] Indicador criado, atualizando estado localmente:', result.indicator.id)
      // Atualiza estado localmente em vez de recarregar tudo
      setIndicators(prev => {
        const updated = [...prev, result.indicator]
        console.log('📊 [DataContext] Estado de indicadores atualizado:', updated.length, 'indicadores')
        return updated
      })
      return result
    }
    return result
  }

  const updateIndicator = async (id, data) => {
    console.log('📊 [DataContext] updateIndicator chamado para ID:', id)
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }
    
    const result = await indicatorServiceSupabase.update(id, data)
    if (result.success && result.indicator) {
      console.log('📊 [DataContext] Indicador atualizado, atualizando estado localmente:', id)
      // Atualiza estado localmente em vez de recarregar tudo
      setIndicators(prev => {
        const updated = prev.map(ind => ind.id === id ? result.indicator : ind)
        console.log('📊 [DataContext] Estado de indicadores atualizado:', updated.length, 'indicadores')
        return updated
      })
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
    console.log('📊 [DataContext] getIndicatorById chamado para ID:', id, '- Stack:', new Error().stack?.split('\n')[2]?.trim())
    if (!user?.id) {
      return null
    }
    
    try {
      const completeIndicator = await indicatorServiceSupabase.getCompleteById(id)
      console.log('📊 [DataContext] Indicador encontrado:', completeIndicator ? 'SIM' : 'NÃO')
      return completeIndicator
    } catch (error) {
      console.error('Erro ao buscar indicador do Supabase:', error)
      return null
    }
  }, [user?.id])

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

  // Memoiza o value para evitar re-renders desnecessários em componentes filhos
  const value = useMemo(() => ({
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
  }), [projects, indicators, loading, createProject, updateProject, deleteProject, createIndicator, updateIndicator, deleteIndicator, getProjectById, getIndicatorsByProjectId, getIndicatorById, calculateProjectROI, calculateIndicatorROI, loadData])

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

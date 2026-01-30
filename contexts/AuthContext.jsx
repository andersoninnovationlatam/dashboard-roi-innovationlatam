import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authServiceSupabase } from '../services/authServiceSupabase'
import { userServiceSupabase } from '../services/userServiceSupabase'
import { supabase } from '../src/lib/supabase'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef(user) // Ref para acessar user atual no closure
  
  // Atualiza ref quando user muda
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let intervalId = null
    let timeoutId = null
    let safetyTimeout = null
    let mounted = true
    
    // Verifica se há usuário logado no Supabase
    const checkUser = async (skipIfUserExists = false) => {
      // OTIMIZAÇÃO: Se já temos usuário e skipIfUserExists = true, não verifica
      if (skipIfUserExists && userRef.current) {
        if (mounted) {
          setLoading(false)
        }
        return
      }
      
      try {
        // Timeout aumentado para 15s após login (sessão pode demorar para estar disponível)
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout ao verificar usuário'))
          }, 15000)
        })

        const userPromise = authServiceSupabase.getCurrentUser()
        
        const currentUser = await Promise.race([userPromise, timeoutPromise])
        
        // Limpa timeout se sucesso
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (mounted && currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        // Não loga timeout esperado como erro crítico
        if (!error.message?.includes('Timeout')) {
          console.error('Erro ao verificar usuário:', error)
        }
        // Não limpa usuário se já existe (pode ter sido setado pelo login)
        if (mounted && !userRef.current) {
          setUser(null)
        }
      } finally {
        // CRÍTICO: Sempre finaliza loading, mesmo em caso de erro
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Primeira verificação apenas se não há usuário
    if (!userRef.current) {
      checkUser(false) // Verifica normalmente
    } else {
      // Se já temos usuário, apenas finaliza loading
      setLoading(false)
    }
    
    // Timeout de segurança adicional: força loading = false após 20s
    safetyTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 20000)

    // Revalida sessão a cada 5 minutos (apenas se há usuário)
    intervalId = setInterval(() => {
      if (mounted) {
        checkUser(true) // Skip se já há usuário
      }
    }, 5 * 60 * 1000) // 5 minutos

    // Escuta mudanças na autenticação
    let subscription = null
    try {
      const result = authServiceSupabase.onAuthStateChange((newUser, event) => {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:100',message:'onAuthStateChange EVENT',data:{event:event,hasNewUser:!!newUser,newUserId:newUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
          // CORREÇÃO: Não atualiza INITIAL_SESSION se já temos usuário com mesmo ID
          if (event === 'INITIAL_SESSION') {
            // Só atualiza se não temos usuário ou se o ID mudou
            if (newUser && newUser.id !== userRef.current?.id) {
              setUser(newUser)
            }
            return
          }
          
          if (event === 'SIGNED_OUT') {
            setUser(null)
          } else if (event === 'SIGNED_IN') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:120',message:'onAuthStateChange SIGNED_IN - BEFORE setUser',data:{userId:newUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            
            // CORREÇÃO: Buscar dados completos do usuário e atualizar
            if (newUser?.id) {
              userServiceSupabase.getById(newUser.id)
                .then(userRecord => {
                  if (userRecord) {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:128',message:'onAuthStateChange SIGNED_IN - getById SUCCESS',data:{userId:newUser.id,organizationId:userRecord?.organization_id,role:userRecord?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    
                    // Atualiza usuário com dados completos
                    setUser({
                      ...newUser,
                      organization_id: userRecord.organization_id,
                      role: userRecord.role
                    })
                  } else {
                    // Se não encontrou, usa dados básicos
                    setUser(newUser)
                  }
                })
                .catch(error => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:140',message:'onAuthStateChange SIGNED_IN - getById ERROR',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                  // #endregion
                  // Usa dados básicos mesmo se getById falhar
                  setUser(newUser)
                })
            } else {
              setUser(newUser)
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:148',message:'onAuthStateChange SIGNED_IN - AFTER setUser',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
          } else if (event === 'TOKEN_REFRESHED') {
            // CORREÇÃO CRÍTICA: Ignora completamente TOKEN_REFRESHED - apenas token mudou
            // O callback já retorna dados básicos sem getById(), então não precisamos atualizar estado
            // Isso evita re-renders desnecessários e timeouts repetidos
            return
          } else if (event === 'USER_UPDATED') {
            // CORREÇÃO: Só atualiza se realmente mudou algo relevante
            if (newUser && newUser.id === userRef.current?.id) {
              const currentUser = userRef.current
              // Compara campos relevantes antes de atualizar
              if (newUser.email !== currentUser?.email || 
                  newUser.organization_id !== currentUser?.organization_id ||
                  newUser.role !== currentUser?.role) {
                setUser(newUser)
              }
            } else {
              setUser(newUser)
            }
          } else if (event === 'USER_DELETED') {
            // CRÍTICO: Usuário foi deletado do Supabase
            console.error('🗑️ USUÁRIO DELETADO - Fazendo logout imediato e limpando sessão')
            setUser(null)
            // Força logout e limpa tudo
            authServiceSupabase.logout().then(() => {
              // Force redirect para login
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            }).catch(err => {
              console.error('Erro ao fazer logout após USER_DELETED:', err)
              // Mesmo com erro, redireciona
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            })
          } else if (!newUser) {
            // Qualquer evento sem usuário = logout
            console.warn('🔒 Evento de auth sem usuário, limpando estado')
            setUser(null)
          } else {
            setUser(newUser)
          }
        } catch (err) {
          console.error('Erro no callback de autenticação:', err)
        }
      })
      subscription = result?.subscription
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error)
      setLoading(false)
    }

    return () => {
      mounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
      }
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Erro ao desinscrever listener:', error)
      }
    }
  }, []) // Executa apenas uma vez na montagem - onAuthStateChange cuida das atualizações

  const login = async (email, senha) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:187',message:'AuthContext.login() ENTRY',data:{email:email?.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    try {
      const result = await authServiceSupabase.login(email, senha)
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:190',message:'AuthContext.login() RESULT',data:{success:result?.success,hasUser:!!result?.user,userId:result?.user?.id,error:result?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (result.success) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:191',message:'AuthContext.login() BEFORE setUser',data:{userId:result.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        setUser(result.user)
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:192',message:'AuthContext.login() AFTER setUser - RETURN SUCCESS',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        return { success: true }
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:194',message:'AuthContext.login() RETURN ERROR',data:{error:result?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return result
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:196',message:'AuthContext.login() CATCH ERROR',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return { success: false, error: error.message || 'Erro ao fazer login' }
    }
  }

  const register = async (nome, email, senha) => {
    try {
      const result = await authServiceSupabase.register(nome, email, senha)
      if (result.success) {
        // Após registro, o usuário já está logado (Supabase faz isso automaticamente)
        setUser(result.user)
        return { success: true }
      }
      return result
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao registrar usuário' }
    }
  }

  const logout = async () => {
    try {
      await authServiceSupabase.logout()
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpa o estado local por segurança
      setUser(null)
    }
  }

  // Métodos de verificação de permissões
  const hasRole = (role) => {
    if (!user) return false
    return user.role === role
  }

  const hasAnyRole = (roles) => {
    if (!user) return false
    return Array.isArray(roles) && roles.includes(user.role)
  }

  const canCreateProject = () => {
    return hasAnyRole(['admin', 'manager'])
  }

  const canEditProject = () => {
    return hasAnyRole(['admin', 'manager'])
  }

  const canDeleteProject = () => {
    return hasAnyRole(['admin', 'manager'])
  }

  const canCreateIndicator = () => {
    return hasAnyRole(['admin', 'manager', 'analyst'])
  }

  const canEditIndicator = () => {
    return hasAnyRole(['admin', 'manager', 'analyst'])
  }

  const canDeleteIndicator = () => {
    return hasAnyRole(['admin', 'manager'])
  }

  const canManageUsers = () => {
    return hasRole('admin')
  }

  const canManageOrganizations = () => {
    return hasRole('admin')
  }

  const canViewDashboard = () => {
    return !!user // Qualquer usuário autenticado pode ver dashboards
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    // Métodos de permissão
    hasRole,
    hasAnyRole,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canCreateIndicator,
    canEditIndicator,
    canDeleteIndicator,
    canManageUsers,
    canManageOrganizations,
    canViewDashboard
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

/**
 * Wrapper de Segurança para Queries ao Supabase
 * Valida sessão antes de CADA operação e detecta tokens inválidos
 */

import { supabase } from '../src/lib/supabase'

/**
 * Executa query com validação de segurança
 * @param {Function} queryFn - Função que executa a query
 * @param {string} context - Contexto da operação (para logs)
 * @returns {Promise} Resultado da query
 * @throws {Error} Se sessão inválida ou token expirado
 */
export const secureQuery = async (queryFn, context = '') => {
  try {
    // CRÍTICO: Valida sessão ANTES da query
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error(`🔒 [${context}] Tentativa de acesso sem sessão válida`)
      throw new Error('INVALID_SESSION')
    }

    // Verifica se token não expirou
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.error(`🔒 [${context}] Token expirado`)
      throw new Error('TOKEN_EXPIRED')
    }

    // Executa a query
    const result = await queryFn()

    // Verifica se houve erro de autenticação na query
    if (result.error) {
      const errorMsg = result.error.message?.toLowerCase() || ''
      
      if (
        errorMsg.includes('jwt') ||
        errorMsg.includes('expired') ||
        errorMsg.includes('invalid') ||
        errorMsg.includes('unauthorized') ||
        result.error.code === 'PGRST301'
      ) {
        console.error(`🔒 [${context}] Erro de autenticação na query:`, result.error.message)
        throw new Error('AUTH_ERROR')
      }
    }

    return result
  } catch (error) {
    // Propaga erros de segurança
    if (
      error.message === 'INVALID_SESSION' ||
      error.message === 'TOKEN_EXPIRED' ||
      error.message === 'AUTH_ERROR'
    ) {
      throw error
    }
    
    // Outros erros
    console.error(`❌ [${context}] Erro na query:`, error)
    throw error
  }
}

/**
 * Verifica se um erro é de autenticação
 */
export const isAuthError = (error) => {
  if (!error) return false
  
  const msg = error.message?.toLowerCase() || ''
  return (
    msg === 'invalid_session' ||
    msg === 'token_expired' ||
    msg === 'auth_error' ||
    msg.includes('jwt') ||
    msg.includes('expired') ||
    msg.includes('unauthorized')
  )
}

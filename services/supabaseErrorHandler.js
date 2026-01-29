/**
 * Handler centralizado para erros do Supabase
 * Detecta e trata erros de RLS, autenticação e permissão
 */

export const handleSupabaseError = (error, context = '') => {
  if (!error) return null

  // Erro de autenticação
  if (error.message?.includes('JWT') || error.message?.includes('expired')) {
    console.error(`🔒 [${context}] Token expirado ou inválido`)
    return {
      type: 'AUTH_ERROR',
      message: 'Sua sessão expirou. Por favor, faça login novamente.',
      shouldLogout: true
    }
  }

  // Erro de RLS - usuário tentando acessar dados de outro
  if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
    console.error(`🛡️ [${context}] Violação de RLS detectada`)
    return {
      type: 'PERMISSION_ERROR',
      message: 'Você não tem permissão para acessar este recurso.',
      shouldLogout: false
    }
  }

  // Erro de usuário não encontrado
  if (error.code === '42P01' || error.message?.includes('does not exist')) {
    console.error(`❌ [${context}] Recurso não encontrado`)
    return {
      type: 'NOT_FOUND',
      message: 'Recurso não encontrado.',
      shouldLogout: false
    }
  }

  // Erro genérico
  console.error(`⚠️ [${context}] Erro no Supabase:`, error)
  return {
    type: 'GENERIC_ERROR',
    message: error.message || 'Erro ao processar requisição.',
    shouldLogout: false
  }
}

/**
 * Wrapper para chamadas ao Supabase com tratamento de erro
 */
export const withErrorHandling = async (fn, context) => {
  try {
    const result = await fn()
    if (result.error) {
      const handled = handleSupabaseError(result.error, context)
      return { ...result, handledError: handled }
    }
    return result
  } catch (error) {
    const handled = handleSupabaseError(error, context)
    return { error, handledError: handled }
  }
}

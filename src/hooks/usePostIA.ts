import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PostIAData } from '../types/postIA'

interface UsePostIAOptions {
  indicatorId?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const usePostIA = ({ indicatorId, onSuccess, onError }: UsePostIAOptions = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const savePostIA = async (postIAData: PostIAData) => {
    if (!indicatorId) {
      throw new Error('indicatorId é obrigatório para salvar Pós-IA')
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('indicators')
        .update({
          post_ia_data: postIAData,
          updated_at: new Date().toISOString()
        })
        .eq('id', indicatorId)
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      onSuccess?.()
      return { success: true, data }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao salvar Pós-IA')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    savePostIA,
    loading,
    error
  }
}

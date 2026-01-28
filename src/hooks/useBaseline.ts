import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { BaselineData } from '../types/baseline'

interface UseBaselineOptions {
  indicatorId?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const useBaseline = ({ indicatorId, onSuccess, onError }: UseBaselineOptions = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const saveBaseline = async (baselineData: BaselineData) => {
    if (!indicatorId) {
      throw new Error('indicatorId é obrigatório para salvar baseline')
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('indicators')
        .update({
          baseline_data: baselineData,
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
      const error = err instanceof Error ? err : new Error('Erro ao salvar baseline')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    saveBaseline,
    loading,
    error
  }
}

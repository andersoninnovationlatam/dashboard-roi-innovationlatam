import { createClient } from '@supabase/supabase-js'

// Variáveis de ambiente - devem ser configuradas no .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Verificar se está configurado
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    '❌ Supabase não configurado!\n' +
    'Configure as seguintes variáveis no arquivo .env na raiz do projeto:\n' +
    'VITE_SUPABASE_URL=https://seu-projeto.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui\n\n' +
    'Você pode encontrar essas informações em:\n' +
    'Supabase Dashboard → Settings → API → Project URL e anon/public key'
  )
}

// Criar cliente Supabase
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

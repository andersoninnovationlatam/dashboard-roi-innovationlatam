import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { CreateProjectInput } from '../../types'

// Schema de validação com Zod
const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  department: z
    .string()
    .min(1, 'Selecione uma área'),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
})

type CreateProjectFormData = z.infer<typeof createProjectSchema>

// Opções de áreas/departamentos
const DEPARTMENTS = [
  'Recursos Humanos',
  'Financeiro',
  'Vendas',
  'Marketing',
  'Operações',
  'TI',
  'Atendimento ao Cliente',
  'Produção',
  'Qualidade',
  'Outros',
] as const

interface CreateProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CreateProjectForm = ({ onSuccess, onCancel }: CreateProjectFormProps) => {
  const { user } = useAuth()
  
  // Verifica se o usuário está autenticado
  if (!user?.id) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
        Você precisa estar autenticado para criar um projeto.
      </div>
    )
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      department: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateProjectFormData) => {
    if (!isSupabaseConfigured || !supabase) {
      alert('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
      return
    }

    try {
      const projectData: CreateProjectInput = {
        name: data.name.trim(),
        department: data.department,
        description: data.description?.trim() || null,
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar projeto:', error)
        throw new Error(error.message || 'Erro ao criar projeto')
      }

      // Limpa o formulário após sucesso
      reset()
      
      // Chama callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      // Em produção, você pode usar um toast ou sistema de notificações
      alert(error instanceof Error ? error.message : 'Erro ao criar projeto')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campo Nome */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Nome do Projeto <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            errors.name
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }`}
          placeholder="Ex: Automação de Processos de RH"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Campo Área (Select) */}
      <div>
        <label
          htmlFor="department"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Área <span className="text-red-500">*</span>
        </label>
        <select
          id="department"
          {...register('department')}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            errors.department
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }`}
          aria-invalid={errors.department ? 'true' : 'false'}
          aria-describedby={errors.department ? 'department-error' : undefined}
        >
          <option value="">Selecione uma área...</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {errors.department && (
          <p id="department-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
            {errors.department.message}
          </p>
        )}
      </div>

      {/* Campo Descrição (Textarea) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Descrição
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
            errors.description
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }`}
          placeholder="Descreva o projeto e seus objetivos..."
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Salvando...' : 'Criar Projeto'}
        </button>
      </div>
    </form>
  )
}

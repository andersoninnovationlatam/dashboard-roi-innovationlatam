import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { projectServiceSupabase } from '../../../services/projectServiceSupabase'
import { useAuth } from '../../../contexts/AuthContext'
import { CreateProjectInput, ProjectStatus, DevelopmentType } from '../../types'

// Schema de validação com Zod
const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(255, 'O nome deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  development_type: z.nativeEnum(DevelopmentType),
  start_date: z.string().optional().or(z.literal('')),
  go_live_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  implementation_cost: z.number().min(0, 'O custo não pode ser negativo').default(0),
  monthly_maintenance_cost: z.number().min(0, 'O custo não pode ser negativo').default(0),
  business_area: z.string().optional().or(z.literal('')),
  sponsor: z.string().optional().or(z.literal('')),
  // Campo legado para compatibilidade
  department: z.string().optional().or(z.literal('')),
})

type CreateProjectFormData = z.infer<typeof createProjectSchema>

// Opções de status
const PROJECT_STATUSES = [
  { value: ProjectStatus.PLANNING, label: 'Em Planejamento' },
  { value: ProjectStatus.DEVELOPMENT, label: 'Em Desenvolvimento' },
  { value: ProjectStatus.TESTING, label: 'Em Testes' },
  { value: ProjectStatus.PRODUCTION, label: 'Em Produção' },
  { value: ProjectStatus.ON_HOLD, label: 'Pausado' },
  { value: ProjectStatus.COMPLETED, label: 'Concluído' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelado' },
] as const

// Opções de tipo de desenvolvimento
const DEVELOPMENT_TYPES = [
  { value: DevelopmentType.CHATBOT, label: 'Chatbot / Assistente Virtual' },
  { value: DevelopmentType.COPILOT, label: 'Copiloto de IA' },
  { value: DevelopmentType.AUTOMATION_N8N, label: 'Automação via N8N' },
  { value: DevelopmentType.AUTOMATION_RPA, label: 'RPA Tradicional' },
  { value: DevelopmentType.INTEGRATION, label: 'Integração de Sistemas' },
  { value: DevelopmentType.DASHBOARD, label: 'Dashboard Analítico' },
  { value: DevelopmentType.ML_MODEL, label: 'Modelo de Machine Learning' },
  { value: DevelopmentType.NLP_ANALYSIS, label: 'Análise de Linguagem Natural' },
  { value: DevelopmentType.DOCUMENT_PROCESSING, label: 'Processamento de Documentos' },
  { value: DevelopmentType.OTHER, label: 'Outros' },
] as const

// Opções de áreas de negócio
const BUSINESS_AREAS = [
  'Recursos Humanos',
  'Financeiro',
  'Vendas',
  'Marketing',
  'Operações',
  'TI',
  'Atendimento ao Cliente',
  'Customer Experience',
  'Produção',
  'Qualidade',
  'Outros',
] as const

interface CreateProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CreateProjectForm = ({ onSuccess, onCancel }: CreateProjectFormProps) => {
  const { user, canCreateProject } = useAuth()
  
  // Verifica se o usuário está autenticado e tem permissão
  if (!user?.id) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
        Você precisa estar autenticado para criar um projeto.
      </div>
    )
  }

  if (!canCreateProject()) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
        Você não tem permissão para criar projetos. Entre em contato com um administrador.
      </div>
    )
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: ProjectStatus.PLANNING,
      development_type: DevelopmentType.OTHER,
      start_date: '',
      go_live_date: '',
      end_date: '',
      implementation_cost: 0,
      monthly_maintenance_cost: 0,
      business_area: '',
      sponsor: '',
      department: '',
    },
  })

  const watchedStatus = watch('status')
  const watchedStartDate = watch('start_date')
  const watchedGoLiveDate = watch('go_live_date')

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      // Validar datas
      if (data.go_live_date && data.start_date && data.go_live_date < data.start_date) {
        alert('A data de go-live não pode ser anterior à data de início')
        return
      }

      if (data.end_date && data.go_live_date && data.end_date < data.go_live_date) {
        alert('A data de encerramento não pode ser anterior à data de go-live')
        return
      }

      const projectData: CreateProjectInput = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        status: data.status,
        development_type: data.development_type,
        start_date: data.start_date || null,
        go_live_date: data.go_live_date || null,
        end_date: data.end_date || null,
        implementation_cost: data.implementation_cost || 0,
        monthly_maintenance_cost: data.monthly_maintenance_cost || 0,
        business_area: data.business_area || data.department || null,
        sponsor: data.sponsor || null,
      }

      const result = await projectServiceSupabase.create(projectData)

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar projeto')
      }

      // Limpa o formulário após sucesso
      reset()
      
      // Chama callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar projeto')
    }
  }

  // Formatar moeda para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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

      {/* Campo Status */}
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          {...register('status')}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            errors.status
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {PROJECT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campo Tipo de Desenvolvimento */}
      <div>
        <label
          htmlFor="development_type"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Tipo de Desenvolvimento <span className="text-red-500">*</span>
        </label>
        <select
          id="development_type"
          {...register('development_type')}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            errors.development_type
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {DEVELOPMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campos de Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
          >
            Data de Início
          </label>
          <input
            id="start_date"
            type="date"
            {...register('start_date')}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="go_live_date"
            className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
          >
            Data de Go-Live
          </label>
          <input
            id="go_live_date"
            type="date"
            {...register('go_live_date')}
            min={watchedStartDate || undefined}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="end_date"
            className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
          >
            Data de Encerramento
          </label>
          <input
            id="end_date"
            type="date"
            {...register('end_date')}
            min={watchedGoLiveDate || watchedStartDate || undefined}
            disabled={watchedStatus !== ProjectStatus.COMPLETED && watchedStatus !== ProjectStatus.CANCELLED}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Campos de Custo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="implementation_cost"
            className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
          >
            Custo de Implementação (R$) <span className="text-red-500">*</span>
          </label>
          <input
            id="implementation_cost"
            type="number"
            step="0.01"
            min="0"
            {...register('implementation_cost', { valueAsNumber: true })}
            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.implementation_cost
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
            placeholder="0,00"
          />
        </div>
        <div>
          <label
            htmlFor="monthly_maintenance_cost"
            className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
          >
            Custo Mensal de Manutenção (R$) <span className="text-red-500">*</span>
          </label>
          <input
            id="monthly_maintenance_cost"
            type="number"
            step="0.01"
            min="0"
            {...register('monthly_maintenance_cost', { valueAsNumber: true })}
            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.monthly_maintenance_cost
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Campo Área de Negócio */}
      <div>
        <label
          htmlFor="business_area"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Área de Negócio
        </label>
        <select
          id="business_area"
          {...register('business_area')}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Selecione uma área...</option>
          {BUSINESS_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Campo Patrocinador */}
      <div>
        <label
          htmlFor="sponsor"
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          Patrocinador
        </label>
        <input
          id="sponsor"
          type="text"
          {...register('sponsor')}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ex: Maria Silva - Diretora de CX"
          maxLength={255}
        />
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

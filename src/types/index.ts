// ============================================================================
// TIPOS TYPESCRIPT - Plataforma de ROI para Projetos de IA
// Baseado na Especificação Técnica Completa
// ============================================================================

// ============================================================================
// ENUMs
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

export enum ProjectStatus {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PRODUCTION = 'production',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum DevelopmentType {
  CHATBOT = 'chatbot',
  COPILOT = 'copilot',
  AUTOMATION_N8N = 'automation_n8n',
  AUTOMATION_RPA = 'automation_rpa',
  INTEGRATION = 'integration',
  DASHBOARD = 'dashboard',
  ML_MODEL = 'ml_model',
  NLP_ANALYSIS = 'nlp_analysis',
  DOCUMENT_PROCESSING = 'document_processing',
  OTHER = 'other'
}

export enum ImprovementType {
  PRODUCTIVITY = 'productivity',
  ANALYTICAL_CAPACITY = 'analytical_capacity',
  REVENUE_INCREASE = 'revenue_increase',
  COST_REDUCTION = 'cost_reduction',
  RISK_REDUCTION = 'risk_reduction',
  DECISION_QUALITY = 'decision_quality',
  SPEED = 'speed',
  SATISFACTION = 'satisfaction'
}

export enum FrequencyUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export enum ScenarioType {
  BASELINE = 'baseline',
  POST_IA = 'post_ia'
}

export enum ToolCategory {
  LLM_API = 'llm_api',
  AUTOMATION = 'automation',
  ANALYTICS = 'analytics',
  DATABASE = 'database',
  CLOUD_INFRA = 'cloud_infra',
  SAAS = 'saas',
  CUSTOM = 'custom',
  OTHER = 'other'
}

export enum PeriodType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  industry?: string | null
  contact_email?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  name: string
  password_hash: string
  role: UserRole
  avatar_url?: string | null
  last_login_at?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  description?: string | null
  status: ProjectStatus
  development_type: DevelopmentType
  start_date?: string | null
  go_live_date?: string | null
  end_date?: string | null
  implementation_cost: number
  monthly_maintenance_cost: number
  business_area?: string | null
  sponsor?: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Campos legados (para compatibilidade durante migração)
  department?: string
  user_id?: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  status?: ProjectStatus
  development_type: DevelopmentType
  start_date?: string
  go_live_date?: string
  end_date?: string
  implementation_cost?: number
  monthly_maintenance_cost?: number
  business_area?: string
  sponsor?: string
  // Campo legado
  department?: string
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string
}

export interface Indicator {
  id: string
  project_id: string
  name: string
  description?: string | null
  improvement_type: ImprovementType
  frequency_value: number
  frequency_unit: FrequencyUnit
  baseline_frequency_real: number
  baseline_frequency_desired?: number | null
  post_ia_frequency: number
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreateIndicatorInput {
  project_id: string
  name: string
  description?: string
  improvement_type: ImprovementType
  frequency_value?: number
  frequency_unit?: FrequencyUnit
  baseline_frequency_real?: number
  baseline_frequency_desired?: number
  post_ia_frequency?: number
  is_active?: boolean
  notes?: string
}

export interface UpdateIndicatorInput extends Partial<CreateIndicatorInput> {
  id: string
}

export interface PersonInvolved {
  id: string
  indicator_id: string
  scenario: ScenarioType
  person_name: string
  role: string
  hourly_rate: number
  time_spent_minutes: number
  is_validation_only: boolean
  created_at: string
}

export interface CreatePersonInvolvedInput {
  indicator_id: string
  scenario: ScenarioType
  person_name: string
  role: string
  hourly_rate: number
  time_spent_minutes: number
  is_validation_only?: boolean
}

export interface UpdatePersonInvolvedInput extends Partial<CreatePersonInvolvedInput> {
  id: string
}

export interface ToolCost {
  id: string
  indicator_id: string
  scenario: ScenarioType
  tool_name: string
  tool_category: ToolCategory
  monthly_cost: number
  cost_per_execution?: number | null
  execution_time_seconds?: number | null
  notes?: string | null
  created_at: string
}

export interface CreateToolCostInput {
  indicator_id: string
  scenario: ScenarioType
  tool_name: string
  tool_category: ToolCategory
  monthly_cost: number
  cost_per_execution?: number
  execution_time_seconds?: number
  notes?: string
}

export interface UpdateToolCostInput extends Partial<CreateToolCostInput> {
  id: string
}

export interface CustomMetric {
  id: string
  indicator_id: string
  metric_name: string
  metric_unit: string
  baseline_value: number
  post_ia_value: number
  target_value?: number | null
  is_higher_better: boolean
  created_at: string
  updated_at: string
}

export interface CreateCustomMetricInput {
  indicator_id: string
  metric_name: string
  metric_unit: string
  baseline_value: number
  post_ia_value: number
  target_value?: number
  is_higher_better?: boolean
}

export interface UpdateCustomMetricInput extends Partial<CreateCustomMetricInput> {
  id: string
}

export interface CalculatedResult {
  id: string
  indicator_id: string
  calculation_date: string
  period_type: PeriodType
  hours_saved: number
  money_saved: number
  cost_baseline: number
  cost_post_ia: number
  gross_savings: number
  net_savings: number
  roi_percentage: number
  payback_months?: number | null
  created_at: string
}

export interface TrackingHistory {
  id: string
  indicator_id: string
  tracking_month: string
  actual_executions: number
  actual_hours_saved: number
  actual_cost_ia: number
  notes?: string | null
  created_by?: string | null
  created_at: string
}

export interface CreateTrackingHistoryInput {
  indicator_id: string
  tracking_month: string // Formato: YYYY-MM-DD (primeiro dia do mês)
  actual_executions: number
  actual_hours_saved: number
  actual_cost_ia: number
  notes?: string
}

export interface UpdateTrackingHistoryInput extends Partial<CreateTrackingHistoryInput> {
  id: string
}

export interface AuditLog {
  id: string
  user_id?: string | null
  organization_id?: string | null
  action: string
  entity_type: string
  entity_id: string
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

// ============================================================================
// TIPOS COMPOSTOS (Para queries com JOINs)
// ============================================================================

export interface IndicatorComplete extends Indicator {
  persons_baseline: PersonInvolved[]
  persons_post_ia: PersonInvolved[]
  tools_baseline: ToolCost[]
  tools_post_ia: ToolCost[]
  custom_metrics: CustomMetric[]
  calculated_result?: CalculatedResult | null
  tracking_history: TrackingHistory[]
}

export interface ProjectComplete extends Project {
  organization?: Organization | null
  indicators: Indicator[]
  indicators_count: number
}

export interface DashboardKPIs {
  roi_total: number
  economia_anual: number
  horas_economizadas_ano: number
  projetos_producao: number
  projetos_concluidos: number
  payback_medio: number
}

export interface DashboardEconomiaMensal {
  mes: string // Formato: YYYY-MM
  bruta: number
  investimento: number
  liquida: number
}

export interface DashboardDistribuicaoTipo {
  tipo: ImprovementType
  valor: number
  percentual: number
}

export interface TopProjeto {
  id: string
  nome: string
  tipo: DevelopmentType
  status: ProjectStatus
  economia_anual: number
  roi: number
  payback: number
}

// ============================================================================
// TIPOS DE FORMULÁRIO
// ============================================================================

export interface ProjectFormData {
  name: string
  description?: string
  status: ProjectStatus
  development_type: DevelopmentType
  start_date?: string
  go_live_date?: string
  end_date?: string
  implementation_cost: number
  monthly_maintenance_cost: number
  business_area?: string
  sponsor?: string
}

export interface IndicatorFormData {
  name: string
  description?: string
  improvement_type: ImprovementType
  frequency_value: number
  frequency_unit: FrequencyUnit
  baseline_frequency_real: number
  baseline_frequency_desired?: number
  post_ia_frequency: number
  persons_baseline: CreatePersonInvolvedInput[]
  persons_post_ia: CreatePersonInvolvedInput[]
  tools_baseline: CreateToolCostInput[]
  tools_post_ia: CreateToolCostInput[]
  custom_metrics?: CreateCustomMetricInput[]
  notes?: string
}

// ============================================================================
// TIPOS DE RESPOSTA DE API
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

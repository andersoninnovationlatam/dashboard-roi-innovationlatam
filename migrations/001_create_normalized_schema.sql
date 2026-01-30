-- ============================================================================
-- MIGRAÇÃO 001: Criação do Schema Normalizado
-- Plataforma de ROI para Projetos de IA
-- Baseado na Especificação Técnica Completa
-- ============================================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CRIAÇÃO DE ENUMs
-- ============================================================================

-- Remover ENUMs se já existirem (para reexecução)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS development_type CASCADE;
DROP TYPE IF EXISTS improvement_type CASCADE;
DROP TYPE IF EXISTS frequency_unit CASCADE;
DROP TYPE IF EXISTS scenario_type CASCADE;
DROP TYPE IF EXISTS tool_category CASCADE;
DROP TYPE IF EXISTS period_type CASCADE;

-- Criar ENUMs
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');

CREATE TYPE project_status AS ENUM (
  'planning',      -- Em planejamento
  'development',   -- Em desenvolvimento
  'testing',       -- Em testes
  'production',    -- Em produção
  'on_hold',       -- Pausado
  'completed',     -- Concluído
  'cancelled'      -- Cancelado
);

CREATE TYPE development_type AS ENUM (
  'chatbot',              -- Chatbot/Assistente Virtual
  'copilot',              -- Copiloto de IA
  'automation_n8n',       -- Automação via N8N
  'automation_rpa',       -- RPA Tradicional
  'integration',          -- Integração de sistemas
  'dashboard',            -- Dashboard analítico
  'ml_model',             -- Modelo de Machine Learning
  'nlp_analysis',         -- Análise de Linguagem Natural
  'document_processing',  -- Processamento de documentos
  'other'                 -- Outros
);

CREATE TYPE improvement_type AS ENUM (
  'productivity',         -- Produtividade (economia de horas)
  'analytical_capacity',  -- Capacidade Analítica
  'revenue_increase',     -- Incremento de Receita
  'cost_reduction',       -- Redução de Custo
  'risk_reduction',       -- Redução de Risco
  'decision_quality',     -- Qualidade da Decisão
  'speed',                -- Velocidade/Lead Time
  'satisfaction'          -- Satisfação (NPS, CSAT)
);

CREATE TYPE frequency_unit AS ENUM (
  'hour',     -- Por hora
  'day',      -- Por dia
  'week',     -- Por semana
  'month',    -- Por mês
  'quarter',  -- Por trimestre
  'year'      -- Por ano
);

CREATE TYPE scenario_type AS ENUM ('baseline', 'post_ia');

CREATE TYPE tool_category AS ENUM (
  'llm_api',      -- APIs de LLM (GPT, Gemini, Mistral)
  'automation',   -- Ferramentas de automação (N8N, Zapier)
  'analytics',    -- BI e Analytics (Power BI, Tableau)
  'database',     -- Banco de dados
  'cloud_infra',  -- Infraestrutura cloud
  'saas',         -- SaaS diversos
  'custom',       -- Desenvolvimento customizado
  'other'         -- Outros
);

CREATE TYPE period_type AS ENUM ('monthly', 'quarterly', 'yearly');

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABELA: organizations
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  industry VARCHAR(100),
  contact_email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: users
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url VARCHAR(500),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: projects (ATUALIZADA)
-- ============================================================================

-- Adicionar novas colunas à tabela projects existente (se não existirem)
DO $$
BEGIN
  -- Adicionar organization_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- Adicionar status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'planning';
  END IF;

  -- Adicionar development_type se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'development_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN development_type development_type NOT NULL DEFAULT 'other';
  END IF;

  -- Adicionar datas se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN start_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'go_live_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN go_live_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN end_date DATE;
  END IF;

  -- Adicionar custos se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'implementation_cost'
  ) THEN
    ALTER TABLE projects ADD COLUMN implementation_cost DECIMAL(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'monthly_maintenance_cost'
  ) THEN
    ALTER TABLE projects ADD COLUMN monthly_maintenance_cost DECIMAL(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- Adicionar campos adicionais se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'business_area'
  ) THEN
    ALTER TABLE projects ADD COLUMN business_area VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'sponsor'
  ) THEN
    ALTER TABLE projects ADD COLUMN sponsor VARCHAR(255);
  END IF;

  -- Adicionar created_by se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES users(id);
  END IF;

  -- Renomear department para business_area se department existir e business_area não
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'department'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'business_area'
  ) THEN
    ALTER TABLE projects ADD COLUMN business_area VARCHAR(100);
    UPDATE projects SET business_area = department WHERE business_area IS NULL;
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_development_type ON projects(development_type);

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: indicators (NORMALIZADA)
-- ============================================================================

-- Criar nova tabela indicators normalizada
CREATE TABLE IF NOT EXISTS indicators_normalized (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  improvement_type improvement_type NOT NULL,
  frequency_value INTEGER NOT NULL DEFAULT 1,
  frequency_unit frequency_unit NOT NULL DEFAULT 'month',
  baseline_frequency_real INTEGER NOT NULL DEFAULT 0,
  baseline_frequency_desired INTEGER,
  post_ia_frequency INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indicators_project_id ON indicators_normalized(project_id);
CREATE INDEX IF NOT EXISTS idx_indicators_improvement_type ON indicators_normalized(improvement_type);

CREATE TRIGGER update_indicators_updated_at
  BEFORE UPDATE ON indicators_normalized
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: persons_involved
-- ============================================================================

CREATE TABLE IF NOT EXISTS persons_involved (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  scenario scenario_type NOT NULL,
  person_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  time_spent_minutes INTEGER NOT NULL,
  is_validation_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_indicator_id ON persons_involved(indicator_id);
CREATE INDEX IF NOT EXISTS idx_persons_scenario ON persons_involved(scenario);

-- ============================================================================
-- TABELA: tools_costs
-- ============================================================================

CREATE TABLE IF NOT EXISTS tools_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  scenario scenario_type NOT NULL,
  tool_name VARCHAR(255) NOT NULL,
  tool_category tool_category NOT NULL,
  monthly_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_execution DECIMAL(10,4),
  execution_time_seconds INTEGER,
  notes VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_indicator_id ON tools_costs(indicator_id);
CREATE INDEX IF NOT EXISTS idx_tools_scenario ON tools_costs(scenario);

-- ============================================================================
-- TABELA: custom_metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  metric_unit VARCHAR(50) NOT NULL,
  baseline_value DECIMAL(15,4) NOT NULL DEFAULT 0,
  post_ia_value DECIMAL(15,4) NOT NULL DEFAULT 0,
  target_value DECIMAL(15,4),
  is_higher_better BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_metrics_indicator_id ON custom_metrics(indicator_id);

CREATE TRIGGER update_custom_metrics_updated_at
  BEFORE UPDATE ON custom_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: calculated_results
-- ============================================================================

CREATE TABLE IF NOT EXISTS calculated_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type period_type NOT NULL DEFAULT 'monthly',
  hours_saved DECIMAL(15,2) NOT NULL DEFAULT 0,
  money_saved DECIMAL(15,2) NOT NULL DEFAULT 0,
  cost_baseline DECIMAL(15,2) NOT NULL DEFAULT 0,
  cost_post_ia DECIMAL(15,2) NOT NULL DEFAULT 0,
  gross_savings DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_savings DECIMAL(15,2) NOT NULL DEFAULT 0,
  roi_percentage DECIMAL(10,2) NOT NULL DEFAULT 0,
  payback_months DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculated_indicator_id ON calculated_results(indicator_id);
CREATE INDEX IF NOT EXISTS idx_calculated_date ON calculated_results(calculation_date);

-- ============================================================================
-- TABELA: tracking_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS tracking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  tracking_month DATE NOT NULL,
  actual_executions INTEGER NOT NULL DEFAULT 0,
  actual_hours_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_cost_ia DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(indicator_id, tracking_month)
);

CREATE INDEX IF NOT EXISTS idx_tracking_indicator_month ON tracking_history(indicator_id, tracking_month);

-- ============================================================================
-- TABELA: audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizações/clientes que utilizam a plataforma (multi-tenancy)';
COMMENT ON TABLE users IS 'Usuários do sistema com roles e permissões';
COMMENT ON TABLE projects IS 'Projetos de IA que serão avaliados quanto ao ROI';
COMMENT ON TABLE indicators_normalized IS 'Indicadores/tarefas mensurados dentro de cada projeto';
COMMENT ON TABLE persons_involved IS 'Pessoas envolvidas em cada indicador (baseline e pós-IA)';
COMMENT ON TABLE tools_costs IS 'Custos de ferramentas e APIs utilizadas em cada cenário';
COMMENT ON TABLE custom_metrics IS 'Métricas personalizadas que não são baseadas em tempo';
COMMENT ON TABLE calculated_results IS 'Resultados calculados materializados para performance';
COMMENT ON TABLE tracking_history IS 'Histórico de acompanhamento mensal dos indicadores';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para governança e compliance';

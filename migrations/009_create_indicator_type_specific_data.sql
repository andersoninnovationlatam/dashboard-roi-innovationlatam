-- ============================================================================
-- MIGRAÇÃO 009: Criação de Tabela para Dados Específicos por Tipo de Indicador
-- Migração de JSONB para colunas normalizadas
-- ============================================================================

-- ============================================================================
-- ADICIONAR COLUNAS DE FREQUÊNCIA EM persons_involved
-- ============================================================================

ALTER TABLE persons_involved 
ADD COLUMN IF NOT EXISTS frequency_real_quantity INTEGER,
ADD COLUMN IF NOT EXISTS frequency_real_unit frequency_unit,
ADD COLUMN IF NOT EXISTS frequency_desired_quantity INTEGER,
ADD COLUMN IF NOT EXISTS frequency_desired_unit frequency_unit;

-- Comentários
COMMENT ON COLUMN persons_involved.frequency_real_quantity IS 'Quantidade da frequência real (ex: 5 vezes)';
COMMENT ON COLUMN persons_involved.frequency_real_unit IS 'Unidade da frequência real (day, week, month)';
COMMENT ON COLUMN persons_involved.frequency_desired_quantity IS 'Quantidade da frequência desejada (ex: 3 vezes)';
COMMENT ON COLUMN persons_involved.frequency_desired_unit IS 'Unidade da frequência desejada (day, week, month)';

-- ============================================================================
-- TABELA: indicator_type_specific_data
-- Armazena dados específicos de cada tipo de indicador em colunas normalizadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS indicator_type_specific_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  -- INCREMENTO RECEITA
  revenue_before DECIMAL(15,2),
  revenue_after DECIMAL(15,2),
  
  -- MELHORIA MARGEM
  gross_revenue_monthly DECIMAL(15,2),
  total_cost_monthly DECIMAL(15,2),
  current_margin_percentage DECIMAL(5,2),
  estimated_margin_percentage DECIMAL(5,2),
  transaction_volume INTEGER,
  
  -- REDUÇÃO DE RISCO
  risk_type VARCHAR(100),
  current_probability_percentage DECIMAL(5,2),
  probability_with_ia_percentage DECIMAL(5,2),
  financial_impact DECIMAL(15,2),
  mitigation_cost_current DECIMAL(15,2),
  mitigation_cost_with_ia DECIMAL(15,2),
  evaluation_frequency INTEGER,
  evaluation_period VARCHAR(20), -- 'dia', 'semana', 'mês', 'ano'
  
  -- QUALIDADE DECISÃO
  decisions_per_period INTEGER,
  decisions_period VARCHAR(20), -- 'dia', 'semana', 'mês'
  current_accuracy_percentage DECIMAL(5,2),
  accuracy_with_ia_percentage DECIMAL(5,2),
  avg_cost_wrong_decision DECIMAL(15,2),
  avg_cost_wrong_decision_with_ia DECIMAL(15,2),
  avg_decision_time_minutes INTEGER,
  avg_decision_time_with_ia_minutes INTEGER,
  people_involved INTEGER,
  people_involved_with_ia INTEGER,
  avg_hourly_rate DECIMAL(10,2),
  
  -- VELOCIDADE
  current_delivery_time DECIMAL(10,2),
  delivery_time_with_ia DECIMAL(10,2),
  delivery_time_unit VARCHAR(20), -- 'dias', 'horas'
  deliveries_per_period INTEGER,
  deliveries_period VARCHAR(20), -- 'dia', 'semana', 'mês', 'ano'
  cost_per_delay DECIMAL(15,2),
  cost_per_delay_reduced DECIMAL(15,2),
  work_time_per_delivery_hours DECIMAL(10,2),
  work_time_per_delivery_with_ia_hours DECIMAL(10,2),
  
  -- SATISFAÇÃO
  current_score DECIMAL(5,2),
  score_with_ia DECIMAL(5,2),
  score_type VARCHAR(20), -- 'NPS', 'CSAT', 'outro'
  number_of_customers INTEGER,
  avg_value_per_customer DECIMAL(15,2),
  current_churn_rate_percentage DECIMAL(5,2),
  churn_rate_with_ia_percentage DECIMAL(5,2),
  customer_acquisition_cost DECIMAL(15,2),
  avg_support_tickets_per_month INTEGER,
  
  -- CAPACIDADE ANALÍTICA
  analyses_before INTEGER,
  analyses_after INTEGER,
  value_per_analysis DECIMAL(15,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_type_specific_indicator_id ON indicator_type_specific_data(indicator_id);
CREATE INDEX IF NOT EXISTS idx_type_specific_risk_type ON indicator_type_specific_data(risk_type) WHERE risk_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_type_specific_score_type ON indicator_type_specific_data(score_type) WHERE score_type IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_indicator_type_specific_data_updated_at
  BEFORE UPDATE ON indicator_type_specific_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários de documentação
COMMENT ON TABLE indicator_type_specific_data IS 'Dados específicos de cada tipo de indicador em colunas normalizadas (substitui JSONB)';
COMMENT ON COLUMN indicator_type_specific_data.indicator_id IS 'FK para indicators_normalized (relação 1:1)';
COMMENT ON COLUMN indicator_type_specific_data.revenue_before IS 'Receita antes da IA (INCREMENTO RECEITA)';
COMMENT ON COLUMN indicator_type_specific_data.revenue_after IS 'Receita depois da IA (INCREMENTO RECEITA)';
COMMENT ON COLUMN indicator_type_specific_data.current_margin_percentage IS 'Margem bruta atual em % (MELHORIA MARGEM)';
COMMENT ON COLUMN indicator_type_specific_data.estimated_margin_percentage IS 'Margem bruta estimada com IA em % (MELHORIA MARGEM)';
COMMENT ON COLUMN indicator_type_specific_data.current_probability_percentage IS 'Probabilidade atual do risco em % (REDUÇÃO DE RISCO)';
COMMENT ON COLUMN indicator_type_specific_data.probability_with_ia_percentage IS 'Probabilidade com IA em % (REDUÇÃO DE RISCO)';
COMMENT ON COLUMN indicator_type_specific_data.current_accuracy_percentage IS 'Taxa de acerto atual em % (QUALIDADE DECISÃO)';
COMMENT ON COLUMN indicator_type_specific_data.accuracy_with_ia_percentage IS 'Taxa de acerto com IA em % (QUALIDADE DECISÃO)';
COMMENT ON COLUMN indicator_type_specific_data.current_delivery_time IS 'Tempo médio de entrega atual (VELOCIDADE)';
COMMENT ON COLUMN indicator_type_specific_data.delivery_time_with_ia IS 'Tempo médio de entrega com IA (VELOCIDADE)';
COMMENT ON COLUMN indicator_type_specific_data.current_score IS 'Score atual de satisfação (SATISFAÇÃO)';
COMMENT ON COLUMN indicator_type_specific_data.score_with_ia IS 'Score com IA (SATISFAÇÃO)';
COMMENT ON COLUMN indicator_type_specific_data.analyses_before IS 'Quantidade de análises antes (CAPACIDADE ANALÍTICA)';
COMMENT ON COLUMN indicator_type_specific_data.analyses_after IS 'Quantidade de análises depois (CAPACIDADE ANALÍTICA)';

-- ============================================================================
-- MIGRAÇÃO 014: Criar Tabelas Individuais por Tipo de Indicador
-- Cada tipo de indicador terá sua própria tabela
-- ============================================================================

-- ============================================================================
-- TABELA: indicator_produtividade_data
-- Dados específicos de indicadores de PRODUTIVIDADE
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_produtividade_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  -- Dados específicos de produtividade (se necessário no futuro)
  -- Por enquanto, os dados estão em persons_involved
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_produtividade_indicator_id ON indicator_produtividade_data(indicator_id);

-- ============================================================================
-- TABELA: indicator_incremento_receita_data
-- Dados específicos de indicadores de INCREMENTO RECEITA
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_incremento_receita_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  revenue_before DECIMAL(15,2) NOT NULL DEFAULT 0,
  revenue_after DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_incremento_receita_indicator_id ON indicator_incremento_receita_data(indicator_id);

-- ============================================================================
-- TABELA: indicator_melhoria_margem_data
-- Dados específicos de indicadores de MELHORIA MARGEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_melhoria_margem_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  gross_revenue_monthly DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cost_monthly DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  estimated_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  transaction_volume INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_melhoria_margem_indicator_id ON indicator_melhoria_margem_data(indicator_id);

-- ============================================================================
-- TABELA: indicator_reducao_risco_data
-- Dados específicos de indicadores de REDUÇÃO DE RISCO
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_reducao_risco_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  risk_type VARCHAR(100),
  current_probability_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  probability_with_ia_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  financial_impact DECIMAL(15,2) NOT NULL DEFAULT 0,
  mitigation_cost_current DECIMAL(15,2) NOT NULL DEFAULT 0,
  mitigation_cost_with_ia DECIMAL(15,2) NOT NULL DEFAULT 0,
  evaluation_frequency INTEGER,
  evaluation_period VARCHAR(20), -- 'dia', 'semana', 'mês', 'ano'
  impacto_financeiro_reduzido DECIMAL(15,2),
  custo_implementacao DECIMAL(15,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_reducao_risco_indicator_id ON indicator_reducao_risco_data(indicator_id);
CREATE INDEX IF NOT EXISTS idx_reducao_risco_type ON indicator_reducao_risco_data(risk_type) WHERE risk_type IS NOT NULL;

-- ============================================================================
-- TABELA: indicator_qualidade_decisao_data
-- Dados específicos de indicadores de QUALIDADE DECISÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_qualidade_decisao_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  decisions_per_period INTEGER NOT NULL DEFAULT 0,
  decisions_period VARCHAR(20) NOT NULL DEFAULT 'mês', -- 'dia', 'semana', 'mês', 'ano'
  current_accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  accuracy_with_ia_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_cost_wrong_decision DECIMAL(15,2) NOT NULL DEFAULT 0,
  avg_cost_wrong_decision_with_ia DECIMAL(15,2) NOT NULL DEFAULT 0,
  avg_decision_time_minutes INTEGER NOT NULL DEFAULT 0,
  avg_decision_time_with_ia_minutes INTEGER NOT NULL DEFAULT 0,
  people_involved INTEGER NOT NULL DEFAULT 0,
  people_involved_with_ia INTEGER NOT NULL DEFAULT 0,
  avg_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  numero_decisoes_periodo_com_ia INTEGER,
  periodo_com_ia VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_qualidade_decisao_indicator_id ON indicator_qualidade_decisao_data(indicator_id);

-- ============================================================================
-- TABELA: indicator_velocidade_data
-- Dados específicos de indicadores de VELOCIDADE
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_velocidade_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  current_delivery_time DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_time_with_ia DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_time_unit VARCHAR(20) NOT NULL DEFAULT 'dias', -- 'dias', 'horas'
  deliveries_per_period INTEGER NOT NULL DEFAULT 0,
  deliveries_period VARCHAR(20) NOT NULL DEFAULT 'mês', -- 'dia', 'semana', 'mês', 'ano'
  cost_per_delay DECIMAL(15,2) NOT NULL DEFAULT 0,
  cost_per_delay_reduced DECIMAL(15,2) NOT NULL DEFAULT 0,
  work_time_per_delivery_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  work_time_per_delivery_with_ia_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  pessoas_envolvidas INTEGER NOT NULL DEFAULT 0,
  pessoas_envolvidas_com_ia INTEGER NOT NULL DEFAULT 0,
  valor_hora_medio DECIMAL(10,2) NOT NULL DEFAULT 0,
  tempo_medio_entrega_com_ia DECIMAL(10,2),
  unidade_tempo_entrega_com_ia VARCHAR(20),
  numero_entregas_periodo_com_ia INTEGER,
  periodo_entregas_com_ia VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_velocidade_indicator_id ON indicator_velocidade_data(indicator_id);

-- ============================================================================
-- TABELA: indicator_satisfacao_data
-- Dados específicos de indicadores de SATISFAÇÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_satisfacao_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  current_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  score_with_ia DECIMAL(5,2) NOT NULL DEFAULT 0,
  score_type VARCHAR(20) NOT NULL DEFAULT 'NPS', -- 'NPS', 'CSAT', 'outro'
  number_of_customers INTEGER NOT NULL DEFAULT 0,
  avg_value_per_customer DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_churn_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  churn_rate_with_ia_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  customer_acquisition_cost DECIMAL(15,2),
  avg_support_tickets_per_month INTEGER NOT NULL DEFAULT 0,
  numero_clientes_esperado INTEGER,
  valor_medio_por_cliente_com_ia DECIMAL(15,2),
  ticket_medio_suporte_com_ia INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_satisfacao_indicator_id ON indicator_satisfacao_data(indicator_id);
CREATE INDEX IF NOT EXISTS idx_satisfacao_score_type ON indicator_satisfacao_data(score_type) WHERE score_type IS NOT NULL;

-- ============================================================================
-- TABELA: indicator_capacidade_analitica_data
-- Dados específicos de indicadores de CAPACIDADE ANALÍTICA
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_capacidade_analitica_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  analyses_before INTEGER NOT NULL DEFAULT 0,
  analyses_after INTEGER NOT NULL DEFAULT 0,
  value_per_analysis DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_capacidade_analitica_indicator_id ON indicator_capacidade_analitica_data(indicator_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_produtividade_data_updated_at
  BEFORE UPDATE ON indicator_produtividade_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incremento_receita_data_updated_at
  BEFORE UPDATE ON indicator_incremento_receita_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_melhoria_margem_data_updated_at
  BEFORE UPDATE ON indicator_melhoria_margem_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reducao_risco_data_updated_at
  BEFORE UPDATE ON indicator_reducao_risco_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qualidade_decisao_data_updated_at
  BEFORE UPDATE ON indicator_qualidade_decisao_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_velocidade_data_updated_at
  BEFORE UPDATE ON indicator_velocidade_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_satisfacao_data_updated_at
  BEFORE UPDATE ON indicator_satisfacao_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacidade_analitica_data_updated_at
  BEFORE UPDATE ON indicator_capacidade_analitica_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE indicator_produtividade_data IS 'Dados específicos de indicadores de PRODUTIVIDADE';
COMMENT ON TABLE indicator_incremento_receita_data IS 'Dados específicos de indicadores de INCREMENTO RECEITA';
COMMENT ON TABLE indicator_melhoria_margem_data IS 'Dados específicos de indicadores de MELHORIA MARGEM';
COMMENT ON TABLE indicator_reducao_risco_data IS 'Dados específicos de indicadores de REDUÇÃO DE RISCO';
COMMENT ON TABLE indicator_qualidade_decisao_data IS 'Dados específicos de indicadores de QUALIDADE DECISÃO';
COMMENT ON TABLE indicator_velocidade_data IS 'Dados específicos de indicadores de VELOCIDADE';
COMMENT ON TABLE indicator_satisfacao_data IS 'Dados específicos de indicadores de SATISFAÇÃO';
COMMENT ON TABLE indicator_capacidade_analitica_data IS 'Dados específicos de indicadores de CAPACIDADE ANALÍTICA';

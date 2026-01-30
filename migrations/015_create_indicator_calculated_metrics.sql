-- ============================================================================
-- MIGRAÇÃO 015: Criar Tabela de Métricas Calculadas
-- Armazena apenas valores calculados de todos os tipos de indicadores
-- ============================================================================

CREATE TABLE IF NOT EXISTS indicator_calculated_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators_normalized(id) ON DELETE CASCADE,
  
  -- Métricas de PRODUTIVIDADE
  delta_produtividade DECIMAL(15,2) DEFAULT 0,
  horas_economizadas_mes DECIMAL(10,2) DEFAULT 0,
  horas_economizadas_ano DECIMAL(10,2) DEFAULT 0,
  custo_total_baseline DECIMAL(15,2) DEFAULT 0,
  custo_total_post_ia DECIMAL(15,2) DEFAULT 0,
  
  -- Métricas de INCREMENTO RECEITA
  delta_receita DECIMAL(15,2) DEFAULT 0,
  
  -- Métricas de MELHORIA MARGEM
  delta_margem DECIMAL(5,2) DEFAULT 0,
  delta_margem_reais DECIMAL(15,2) DEFAULT 0,
  economia_mensal DECIMAL(15,2) DEFAULT 0,
  economia_anual DECIMAL(15,2) DEFAULT 0,
  
  -- Métricas de REDUÇÃO DE RISCO
  reducao_probabilidade DECIMAL(5,2) DEFAULT 0,
  valor_risco_evitado DECIMAL(15,2) DEFAULT 0,
  economia_mitigacao DECIMAL(15,2) DEFAULT 0,
  beneficio_anual DECIMAL(15,2) DEFAULT 0,
  custo_vs_beneficio DECIMAL(10,2) DEFAULT 0,
  roi_reducao_risco DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas de QUALIDADE DECISÃO
  melhoria_taxa_acerto DECIMAL(5,2) DEFAULT 0,
  economia_erros_evitados DECIMAL(15,2) DEFAULT 0,
  economia_tempo DECIMAL(10,2) DEFAULT 0, -- horas
  valor_tempo_economizado DECIMAL(15,2) DEFAULT 0,
  beneficio_total_mensal DECIMAL(15,2) DEFAULT 0,
  roi_melhoria DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas de VELOCIDADE
  reducao_tempo_entrega DECIMAL(5,2) DEFAULT 0, -- %
  aumento_capacidade INTEGER DEFAULT 0,
  economia_atrasos DECIMAL(15,2) DEFAULT 0,
  valor_tempo_economizado_velocidade DECIMAL(15,2) DEFAULT 0,
  ganho_produtividade DECIMAL(5,2) DEFAULT 0, -- %
  roi_velocidade DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas de SATISFAÇÃO
  delta_satisfacao DECIMAL(5,2) DEFAULT 0,
  reducao_churn DECIMAL(5,2) DEFAULT 0,
  valor_retencao DECIMAL(15,2) DEFAULT 0,
  economia_suporte DECIMAL(15,2) DEFAULT 0,
  aumento_revenue DECIMAL(15,2) DEFAULT 0,
  roi_satisfacao DECIMAL(10,2) DEFAULT 0,
  ltv_incrementado DECIMAL(15,2) DEFAULT 0,
  
  -- Métricas gerais (podem ser usadas por qualquer tipo)
  custo_implementacao DECIMAL(15,2) DEFAULT 0,
  roi_percentage DECIMAL(10,2) DEFAULT 0,
  payback_months DECIMAL(10,2),
  
  calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(indicator_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_indicator_id ON indicator_calculated_metrics(indicator_id);
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_date ON indicator_calculated_metrics(calculation_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_indicator_calculated_metrics_updated_at
  BEFORE UPDATE ON indicator_calculated_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE indicator_calculated_metrics IS 'Armazena valores calculados de todos os tipos de indicadores';
COMMENT ON COLUMN indicator_calculated_metrics.indicator_id IS 'FK para indicators_normalized (relação 1:1)';
COMMENT ON COLUMN indicator_calculated_metrics.delta_produtividade IS 'Delta de produtividade em R$: (HH Antes - HH Depois) × Valor Hora';
COMMENT ON COLUMN indicator_calculated_metrics.horas_economizadas_mes IS 'Total de horas economizadas por mês';
COMMENT ON COLUMN indicator_calculated_metrics.delta_receita IS 'Delta de receita: Receita Depois - Receita Antes';
COMMENT ON COLUMN indicator_calculated_metrics.economia_mensal IS 'Economia mensal em R$';
COMMENT ON COLUMN indicator_calculated_metrics.economia_anual IS 'Economia anual em R$';

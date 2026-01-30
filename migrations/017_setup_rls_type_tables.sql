-- ============================================================================
-- MIGRAÇÃO 017: Configurar RLS para Tabelas de Tipo Específico
-- ============================================================================

-- Habilitar RLS em todas as tabelas de tipo específico
ALTER TABLE indicator_produtividade_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_incremento_receita_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_melhoria_margem_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_reducao_risco_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_qualidade_decisao_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_velocidade_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_satisfacao_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_capacidade_analitica_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_calculated_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para indicator_produtividade_data
CREATE POLICY "Users can view produtividade data from their organization"
  ON indicator_produtividade_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_produtividade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert produtividade data for their organization"
  ON indicator_produtividade_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_produtividade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update produtividade data from their organization"
  ON indicator_produtividade_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_produtividade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete produtividade data from their organization"
  ON indicator_produtividade_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_produtividade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_incremento_receita_data
CREATE POLICY "Users can view incremento receita data from their organization"
  ON indicator_incremento_receita_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_incremento_receita_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert incremento receita data for their organization"
  ON indicator_incremento_receita_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_incremento_receita_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update incremento receita data from their organization"
  ON indicator_incremento_receita_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_incremento_receita_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete incremento receita data from their organization"
  ON indicator_incremento_receita_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_incremento_receita_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_melhoria_margem_data
CREATE POLICY "Users can view melhoria margem data from their organization"
  ON indicator_melhoria_margem_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_melhoria_margem_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert melhoria margem data for their organization"
  ON indicator_melhoria_margem_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_melhoria_margem_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update melhoria margem data from their organization"
  ON indicator_melhoria_margem_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_melhoria_margem_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete melhoria margem data from their organization"
  ON indicator_melhoria_margem_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_melhoria_margem_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_reducao_risco_data
CREATE POLICY "Users can view reducao risco data from their organization"
  ON indicator_reducao_risco_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_reducao_risco_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reducao risco data for their organization"
  ON indicator_reducao_risco_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_reducao_risco_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update reducao risco data from their organization"
  ON indicator_reducao_risco_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_reducao_risco_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reducao risco data from their organization"
  ON indicator_reducao_risco_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_reducao_risco_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_qualidade_decisao_data
CREATE POLICY "Users can view qualidade decisao data from their organization"
  ON indicator_qualidade_decisao_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_qualidade_decisao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert qualidade decisao data for their organization"
  ON indicator_qualidade_decisao_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_qualidade_decisao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update qualidade decisao data from their organization"
  ON indicator_qualidade_decisao_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_qualidade_decisao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete qualidade decisao data from their organization"
  ON indicator_qualidade_decisao_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_qualidade_decisao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_velocidade_data
CREATE POLICY "Users can view velocidade data from their organization"
  ON indicator_velocidade_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_velocidade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert velocidade data for their organization"
  ON indicator_velocidade_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_velocidade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update velocidade data from their organization"
  ON indicator_velocidade_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_velocidade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete velocidade data from their organization"
  ON indicator_velocidade_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_velocidade_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_satisfacao_data
CREATE POLICY "Users can view satisfacao data from their organization"
  ON indicator_satisfacao_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_satisfacao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert satisfacao data for their organization"
  ON indicator_satisfacao_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_satisfacao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update satisfacao data from their organization"
  ON indicator_satisfacao_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_satisfacao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete satisfacao data from their organization"
  ON indicator_satisfacao_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_satisfacao_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_capacidade_analitica_data
CREATE POLICY "Users can view capacidade analitica data from their organization"
  ON indicator_capacidade_analitica_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_capacidade_analitica_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert capacidade analitica data for their organization"
  ON indicator_capacidade_analitica_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_capacidade_analitica_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update capacidade analitica data from their organization"
  ON indicator_capacidade_analitica_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_capacidade_analitica_data.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete capacidade analitica data from their organization"
  ON indicator_capacidade_analitica_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_capacidade_analitica_data.indicator_id
        AND u.id = auth.uid()
    )
  );

-- Políticas para indicator_calculated_metrics
CREATE POLICY "Users can view calculated metrics from their organization"
  ON indicator_calculated_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_calculated_metrics.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calculated metrics for their organization"
  ON indicator_calculated_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_calculated_metrics.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update calculated metrics from their organization"
  ON indicator_calculated_metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_calculated_metrics.indicator_id
        AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete calculated metrics from their organization"
  ON indicator_calculated_metrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = indicator_calculated_metrics.indicator_id
        AND u.id = auth.uid()
    )
  );

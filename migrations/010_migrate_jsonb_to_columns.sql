-- ============================================================================
-- MIGRAÇÃO 010: Migração de Dados JSONB para Colunas Normalizadas
-- Migra dados existentes de baseline_data e post_ia_data para as novas colunas
-- 
-- NOTA: Esta migration assume que a tabela 'indicators' ainda existe com dados JSONB.
-- Se a tabela já foi removida, esta migration pode ser pulada.
-- ============================================================================

-- ============================================================================
-- 1. MIGRAR FREQUÊNCIAS DE persons_involved
-- ============================================================================

-- Atualizar frequências reais e desejadas das pessoas do baseline
UPDATE persons_involved pi
SET 
  frequency_real_quantity = (
    SELECT (baseline_data->'pessoas'->0->'frequenciaReal'->>'quantidade')::INTEGER
    FROM indicators il
    WHERE il.id = pi.indicator_id
    AND baseline_data->'pessoas' IS NOT NULL
    LIMIT 1
  ),
  frequency_real_unit = (
    SELECT CASE 
      WHEN baseline_data->'pessoas'->0->'frequenciaReal'->>'periodo' = 'Diário' THEN 'day'::frequency_unit
      WHEN baseline_data->'pessoas'->0->'frequenciaReal'->>'periodo' = 'Semanal' THEN 'week'::frequency_unit
      WHEN baseline_data->'pessoas'->0->'frequenciaReal'->>'periodo' = 'Mensal' THEN 'month'::frequency_unit
      ELSE 'month'::frequency_unit
    END
    FROM indicators il
    WHERE il.id = pi.indicator_id
    AND baseline_data->'pessoas' IS NOT NULL
    LIMIT 1
  ),
  frequency_desired_quantity = (
    SELECT (baseline_data->'pessoas'->0->'frequenciaDesejada'->>'quantidade')::INTEGER
    FROM indicators il
    WHERE il.id = pi.indicator_id
    AND baseline_data->'pessoas' IS NOT NULL
    LIMIT 1
  ),
  frequency_desired_unit = (
    SELECT CASE 
      WHEN baseline_data->'pessoas'->0->'frequenciaDesejada'->>'periodo' = 'Diário' THEN 'day'::frequency_unit
      WHEN baseline_data->'pessoas'->0->'frequenciaDesejada'->>'periodo' = 'Semanal' THEN 'week'::frequency_unit
      WHEN baseline_data->'pessoas'->0->'frequenciaDesejada'->>'periodo' = 'Mensal' THEN 'month'::frequency_unit
      ELSE 'month'::frequency_unit
    END
    FROM indicators il
    WHERE il.id = pi.indicator_id
    AND baseline_data->'pessoas' IS NOT NULL
    LIMIT 1
  )
WHERE pi.scenario = 'baseline'
AND EXISTS (
  SELECT 1 FROM indicators il 
  WHERE il.id = pi.indicator_id 
  AND baseline_data->'pessoas' IS NOT NULL
);

-- Atualizar frequências reais das pessoas do pós-IA
UPDATE persons_involved pi
SET 
  frequency_real_quantity = (
    SELECT (post_ia_data->'pessoas'->0->'frequenciaReal'->>'quantidade')::INTEGER
    FROM indicators il
    WHERE il.id = pi.indicator_id
    AND post_ia_data->'pessoas' IS NOT NULL
    LIMIT 1
  ),
  frequency_real_unit = (
    SELECT CASE 
      WHEN post_ia_data->'pessoas'->0->'frequenciaReal'->>'periodo' = 'Diário' THEN 'day'::frequency_unit
      WHEN post_ia_data->'pessoas'->0->'frequenciaReal'->>'periodo' = 'Semanal' THEN 'week'::frequency_unit
      WHEN post_ia_data->'pessoas'->0->'frequenciaReal'->>'periodo' = 'Mensal' THEN 'month'::frequency_unit
      ELSE 'month'::frequency_unit
    END
    FROM indicators il
    WHERE il.id = pi.indicator_id
    AND post_ia_data->'pessoas' IS NOT NULL
    LIMIT 1
  )
WHERE pi.scenario = 'post_ia'
AND EXISTS (
  SELECT 1 FROM indicators il 
  WHERE il.id = pi.indicator_id 
  AND post_ia_data->'pessoas' IS NOT NULL
);

-- ============================================================================
-- 2. MIGRAR DADOS ESPECÍFICOS POR TIPO DE INDICADOR
-- ============================================================================

-- INCREMENTO RECEITA
INSERT INTO indicator_type_specific_data (
  indicator_id, revenue_before, revenue_after
)
SELECT 
  i.id,
  (il.baseline_data->>'valorReceitaAntes')::DECIMAL,
  (il.post_ia_data->>'valorReceitaDepois')::DECIMAL
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'INCREMENTO RECEITA'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  revenue_before = EXCLUDED.revenue_before,
  revenue_after = EXCLUDED.revenue_after;

-- MELHORIA MARGEM
INSERT INTO indicator_type_specific_data (
  indicator_id,
  gross_revenue_monthly,
  total_cost_monthly,
  current_margin_percentage,
  estimated_margin_percentage,
  transaction_volume
)
SELECT 
  i.id,
  (il.baseline_data->>'receitaBrutaMensal')::DECIMAL,
  (il.baseline_data->>'custoTotalMensal')::DECIMAL,
  (il.baseline_data->>'margemBrutaAtual')::DECIMAL,
  (il.post_ia_data->>'margemBrutaEstimada')::DECIMAL,
  (il.baseline_data->>'volumeTransacoes')::INTEGER
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'MELHORIA MARGEM'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  gross_revenue_monthly = EXCLUDED.gross_revenue_monthly,
  total_cost_monthly = EXCLUDED.total_cost_monthly,
  current_margin_percentage = EXCLUDED.current_margin_percentage,
  estimated_margin_percentage = EXCLUDED.estimated_margin_percentage,
  transaction_volume = EXCLUDED.transaction_volume;

-- REDUÇÃO DE RISCO
INSERT INTO indicator_type_specific_data (
  indicator_id,
  risk_type,
  current_probability_percentage,
  probability_with_ia_percentage,
  financial_impact,
  mitigation_cost_current,
  mitigation_cost_with_ia,
  evaluation_frequency,
  evaluation_period
)
SELECT 
  i.id,
  il.baseline_data->>'tipoRisco',
  (il.baseline_data->>'probabilidadeAtual')::DECIMAL,
  (il.post_ia_data->>'probabilidadeComIA')::DECIMAL,
  (il.baseline_data->>'impactoFinanceiro')::DECIMAL,
  (il.baseline_data->>'custoMitigacaoAtual')::DECIMAL,
  (il.post_ia_data->>'custoMitigacaoComIA')::DECIMAL,
  (il.baseline_data->>'frequenciaAvaliacao')::INTEGER,
  il.baseline_data->>'periodoAvaliacao'
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'REDUÇÃO DE RISCO'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  risk_type = EXCLUDED.risk_type,
  current_probability_percentage = EXCLUDED.current_probability_percentage,
  probability_with_ia_percentage = EXCLUDED.probability_with_ia_percentage,
  financial_impact = EXCLUDED.financial_impact,
  mitigation_cost_current = EXCLUDED.mitigation_cost_current,
  mitigation_cost_with_ia = EXCLUDED.mitigation_cost_with_ia,
  evaluation_frequency = EXCLUDED.evaluation_frequency,
  evaluation_period = EXCLUDED.evaluation_period;

-- QUALIDADE DECISÃO
INSERT INTO indicator_type_specific_data (
  indicator_id,
  decisions_per_period,
  decisions_period,
  current_accuracy_percentage,
  accuracy_with_ia_percentage,
  avg_cost_wrong_decision,
  avg_cost_wrong_decision_with_ia,
  avg_decision_time_minutes,
  avg_decision_time_with_ia_minutes,
  people_involved,
  people_involved_with_ia,
  avg_hourly_rate
)
SELECT 
  i.id,
  (il.baseline_data->>'numeroDecisoesPeriodo')::INTEGER,
  il.baseline_data->>'periodo',
  (il.baseline_data->>'taxaAcertoAtual')::DECIMAL,
  (il.post_ia_data->>'taxaAcertoComIA')::DECIMAL,
  (il.baseline_data->>'custoMedioDecisaoErrada')::DECIMAL,
  (il.post_ia_data->>'custoMedioDecisaoErradaComIA')::DECIMAL,
  (il.baseline_data->>'tempoMedioDecisao')::INTEGER,
  (il.post_ia_data->>'tempoMedioDecisaoComIA')::INTEGER,
  (il.baseline_data->>'pessoasEnvolvidas')::INTEGER,
  (il.post_ia_data->>'pessoasEnvolvidasComIA')::INTEGER,
  (il.baseline_data->>'valorHoraMedio')::DECIMAL
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'QUALIDADE DECISÃO'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  decisions_per_period = EXCLUDED.decisions_per_period,
  decisions_period = EXCLUDED.decisions_period,
  current_accuracy_percentage = EXCLUDED.current_accuracy_percentage,
  accuracy_with_ia_percentage = EXCLUDED.accuracy_with_ia_percentage,
  avg_cost_wrong_decision = EXCLUDED.avg_cost_wrong_decision,
  avg_cost_wrong_decision_with_ia = EXCLUDED.avg_cost_wrong_decision_with_ia,
  avg_decision_time_minutes = EXCLUDED.avg_decision_time_minutes,
  avg_decision_time_with_ia_minutes = EXCLUDED.avg_decision_time_with_ia_minutes,
  people_involved = EXCLUDED.people_involved,
  people_involved_with_ia = EXCLUDED.people_involved_with_ia,
  avg_hourly_rate = EXCLUDED.avg_hourly_rate;

-- VELOCIDADE
INSERT INTO indicator_type_specific_data (
  indicator_id,
  current_delivery_time,
  delivery_time_with_ia,
  delivery_time_unit,
  deliveries_per_period,
  deliveries_period,
  cost_per_delay,
  cost_per_delay_reduced,
  work_time_per_delivery_hours,
  work_time_per_delivery_with_ia_hours
)
SELECT 
  i.id,
  (il.baseline_data->>'tempoMedioEntregaAtual')::DECIMAL,
  (il.post_ia_data->>'tempoMedioEntregaComIA')::DECIMAL,
  il.baseline_data->>'unidadeTempoEntrega',
  (il.baseline_data->>'numeroEntregasPeriodo')::INTEGER,
  il.baseline_data->>'periodoEntregas',
  (il.baseline_data->>'custoPorAtraso')::DECIMAL,
  (il.post_ia_data->>'custoPorAtrasoReduzido')::DECIMAL,
  (il.baseline_data->>'tempoTrabalhoPorEntrega')::DECIMAL,
  (il.post_ia_data->>'tempoTrabalhoPorEntregaComIA')::DECIMAL
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'VELOCIDADE'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  current_delivery_time = EXCLUDED.current_delivery_time,
  delivery_time_with_ia = EXCLUDED.delivery_time_with_ia,
  delivery_time_unit = EXCLUDED.delivery_time_unit,
  deliveries_per_period = EXCLUDED.deliveries_per_period,
  deliveries_period = EXCLUDED.deliveries_period,
  cost_per_delay = EXCLUDED.cost_per_delay,
  cost_per_delay_reduced = EXCLUDED.cost_per_delay_reduced,
  work_time_per_delivery_hours = EXCLUDED.work_time_per_delivery_hours,
  work_time_per_delivery_with_ia_hours = EXCLUDED.work_time_per_delivery_with_ia_hours;

-- SATISFAÇÃO
INSERT INTO indicator_type_specific_data (
  indicator_id,
  current_score,
  score_with_ia,
  score_type,
  number_of_customers,
  avg_value_per_customer,
  current_churn_rate_percentage,
  churn_rate_with_ia_percentage,
  customer_acquisition_cost,
  avg_support_tickets_per_month
)
SELECT 
  i.id,
  (il.baseline_data->>'scoreAtual')::DECIMAL,
  (il.post_ia_data->>'scoreComIA')::DECIMAL,
  il.baseline_data->>'tipoScore',
  (il.baseline_data->>'numeroClientes')::INTEGER,
  (il.baseline_data->>'valorMedioPorCliente')::DECIMAL,
  (il.baseline_data->>'taxaChurnAtual')::DECIMAL,
  (il.post_ia_data->>'taxaChurnComIA')::DECIMAL,
  (il.baseline_data->>'custoAquisicaoCliente')::DECIMAL,
  (il.baseline_data->>'ticketMedioSuporte')::INTEGER
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'SATISFAÇÃO'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  current_score = EXCLUDED.current_score,
  score_with_ia = EXCLUDED.score_with_ia,
  score_type = EXCLUDED.score_type,
  number_of_customers = EXCLUDED.number_of_customers,
  avg_value_per_customer = EXCLUDED.avg_value_per_customer,
  current_churn_rate_percentage = EXCLUDED.current_churn_rate_percentage,
  churn_rate_with_ia_percentage = EXCLUDED.churn_rate_with_ia_percentage,
  customer_acquisition_cost = EXCLUDED.customer_acquisition_cost,
  avg_support_tickets_per_month = EXCLUDED.avg_support_tickets_per_month;

-- CAPACIDADE ANALÍTICA
INSERT INTO indicator_type_specific_data (
  indicator_id,
  analyses_before,
  analyses_after,
  value_per_analysis
)
SELECT 
  i.id,
  (il.baseline_data->>'quantidadeAnalises')::INTEGER,
  (il.post_ia_data->>'quantidadeAnalises')::INTEGER,
  (il.baseline_data->>'valorPorAnalise')::DECIMAL
FROM indicators il
JOIN indicators_normalized i ON i.id = il.id
WHERE il.baseline_data->>'tipo' = 'CAPACIDADE ANALÍTICA'
AND NOT EXISTS (
  SELECT 1 FROM indicator_type_specific_data itsd WHERE itsd.indicator_id = i.id
)
ON CONFLICT (indicator_id) DO UPDATE SET
  analyses_before = EXCLUDED.analyses_before,
  analyses_after = EXCLUDED.analyses_after,
  value_per_analysis = EXCLUDED.value_per_analysis;

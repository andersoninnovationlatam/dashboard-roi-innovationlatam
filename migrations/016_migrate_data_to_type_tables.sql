-- ============================================================================
-- MIGRAÇÃO 016: Migrar Dados de indicator_type_specific_data para Tabelas Individuais
-- ============================================================================

-- Migrar dados de INCREMENTO RECEITA
INSERT INTO indicator_incremento_receita_data (indicator_id, revenue_before, revenue_after, created_at, updated_at)
SELECT 
  indicator_id,
  revenue_before,
  revenue_after,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE revenue_before IS NOT NULL OR revenue_after IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar dados de MELHORIA MARGEM
INSERT INTO indicator_melhoria_margem_data (
  indicator_id, 
  gross_revenue_monthly, 
  total_cost_monthly, 
  current_margin_percentage, 
  estimated_margin_percentage, 
  transaction_volume,
  created_at,
  updated_at
)
SELECT 
  indicator_id,
  gross_revenue_monthly,
  total_cost_monthly,
  current_margin_percentage,
  estimated_margin_percentage,
  transaction_volume,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE gross_revenue_monthly IS NOT NULL 
   OR total_cost_monthly IS NOT NULL 
   OR current_margin_percentage IS NOT NULL
   OR estimated_margin_percentage IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar dados de REDUÇÃO DE RISCO
INSERT INTO indicator_reducao_risco_data (
  indicator_id,
  risk_type,
  current_probability_percentage,
  probability_with_ia_percentage,
  financial_impact,
  mitigation_cost_current,
  mitigation_cost_with_ia,
  evaluation_frequency,
  evaluation_period,
  created_at,
  updated_at
)
SELECT 
  indicator_id,
  risk_type,
  current_probability_percentage,
  probability_with_ia_percentage,
  financial_impact,
  mitigation_cost_current,
  mitigation_cost_with_ia,
  evaluation_frequency,
  evaluation_period,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE risk_type IS NOT NULL 
   OR current_probability_percentage IS NOT NULL
   OR probability_with_ia_percentage IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar dados de QUALIDADE DECISÃO
INSERT INTO indicator_qualidade_decisao_data (
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
  avg_hourly_rate,
  created_at,
  updated_at
)
SELECT 
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
  avg_hourly_rate,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE decisions_per_period IS NOT NULL
   OR current_accuracy_percentage IS NOT NULL
   OR accuracy_with_ia_percentage IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar dados de VELOCIDADE
INSERT INTO indicator_velocidade_data (
  indicator_id,
  current_delivery_time,
  delivery_time_with_ia,
  delivery_time_unit,
  deliveries_per_period,
  deliveries_period,
  cost_per_delay,
  cost_per_delay_reduced,
  work_time_per_delivery_hours,
  work_time_per_delivery_with_ia_hours,
  created_at,
  updated_at
)
SELECT 
  indicator_id,
  current_delivery_time,
  delivery_time_with_ia,
  delivery_time_unit,
  deliveries_per_period,
  deliveries_period,
  cost_per_delay,
  cost_per_delay_reduced,
  work_time_per_delivery_hours,
  work_time_per_delivery_with_ia_hours,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE current_delivery_time IS NOT NULL
   OR delivery_time_with_ia IS NOT NULL
   OR deliveries_per_period IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar dados de SATISFAÇÃO
INSERT INTO indicator_satisfacao_data (
  indicator_id,
  current_score,
  score_with_ia,
  score_type,
  number_of_customers,
  avg_value_per_customer,
  current_churn_rate_percentage,
  churn_rate_with_ia_percentage,
  customer_acquisition_cost,
  avg_support_tickets_per_month,
  created_at,
  updated_at
)
SELECT 
  indicator_id,
  current_score,
  score_with_ia,
  score_type,
  number_of_customers,
  avg_value_per_customer,
  current_churn_rate_percentage,
  churn_rate_with_ia_percentage,
  customer_acquisition_cost,
  avg_support_tickets_per_month,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE current_score IS NOT NULL
   OR score_with_ia IS NOT NULL
   OR number_of_customers IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar dados de CAPACIDADE ANALÍTICA
INSERT INTO indicator_capacidade_analitica_data (
  indicator_id,
  analyses_before,
  analyses_after,
  value_per_analysis,
  created_at,
  updated_at
)
SELECT 
  indicator_id,
  analyses_before,
  analyses_after,
  value_per_analysis,
  created_at,
  updated_at
FROM indicator_type_specific_data
WHERE analyses_before IS NOT NULL
   OR analyses_after IS NOT NULL
ON CONFLICT (indicator_id) DO NOTHING;

-- Migrar delta_produtividade para indicator_calculated_metrics
INSERT INTO indicator_calculated_metrics (indicator_id, delta_produtividade, calculation_date, updated_at)
SELECT 
  indicator_id,
  delta_produtividade,
  NOW(),
  NOW()
FROM indicator_type_specific_data
WHERE delta_produtividade IS NOT NULL AND delta_produtividade != 0
ON CONFLICT (indicator_id) DO UPDATE SET
  delta_produtividade = EXCLUDED.delta_produtividade,
  updated_at = NOW();

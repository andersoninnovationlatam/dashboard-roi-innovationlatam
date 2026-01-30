# Estrutura Completa de Colunas Normalizadas por Tipo de Indicador

## ✅ Status: Estrutura Completa Implementada

Todas as colunas necessárias foram criadas nas tabelas apropriadas para cada tipo de indicador.

## 📊 Tabelas e Colunas por Tipo de Indicador

### 1. **PRODUTIVIDADE** (`productivity`)
**Não precisa de colunas específicas em `indicator_type_specific_data`**

Dados armazenados em:
- `persons_involved` (com frequências)
- `tools_costs`
- `indicators_normalized` (frequências gerais)

**Colunas em `persons_involved`:**
- `frequency_real_quantity` (INTEGER)
- `frequency_real_unit` (frequency_unit ENUM)
- `frequency_desired_quantity` (INTEGER)
- `frequency_desired_unit` (frequency_unit ENUM)
- `person_name`, `role`, `hourly_rate`, `time_spent_minutes`, `is_validation_only`

### 2. **INCREMENTO RECEITA** (`revenue_increase`)
**Colunas em `indicator_type_specific_data`:**
- `revenue_before` (DECIMAL(15,2)) - Receita antes da IA
- `revenue_after` (DECIMAL(15,2)) - Receita depois da IA

### 3. **MELHORIA MARGEM** (`margin_improvement`)
**Colunas em `indicator_type_specific_data`:**
- `gross_revenue_monthly` (DECIMAL(15,2)) - Receita bruta mensal
- `total_cost_monthly` (DECIMAL(15,2)) - Custo total mensal
- `current_margin_percentage` (DECIMAL(5,2)) - Margem bruta atual (%)
- `estimated_margin_percentage` (DECIMAL(5,2)) - Margem bruta estimada com IA (%)
- `transaction_volume` (INTEGER) - Volume de transações

### 4. **REDUÇÃO DE RISCO** (`risk_reduction`)
**Colunas em `indicator_type_specific_data`:**
- `risk_type` (VARCHAR(100)) - Tipo de risco
- `current_probability_percentage` (DECIMAL(5,2)) - Probabilidade atual (%)
- `probability_with_ia_percentage` (DECIMAL(5,2)) - Probabilidade com IA (%)
- `financial_impact` (DECIMAL(15,2)) - Impacto financeiro
- `mitigation_cost_current` (DECIMAL(15,2)) - Custo de mitigação atual
- `mitigation_cost_with_ia` (DECIMAL(15,2)) - Custo de mitigação com IA
- `evaluation_frequency` (INTEGER) - Frequência de avaliação
- `evaluation_period` (VARCHAR(20)) - Período de avaliação ('dia', 'semana', 'mês', 'ano')

### 5. **QUALIDADE DECISÃO** (`decision_quality`)
**Colunas em `indicator_type_specific_data`:**
- `decisions_per_period` (INTEGER) - Número de decisões por período
- `decisions_period` (VARCHAR(20)) - Período ('dia', 'semana', 'mês')
- `current_accuracy_percentage` (DECIMAL(5,2)) - Taxa de acerto atual (%)
- `accuracy_with_ia_percentage` (DECIMAL(5,2)) - Taxa de acerto com IA (%)
- `avg_cost_wrong_decision` (DECIMAL(15,2)) - Custo médio por decisão errada
- `avg_cost_wrong_decision_with_ia` (DECIMAL(15,2)) - Custo médio por decisão errada com IA
- `avg_decision_time_minutes` (INTEGER) - Tempo médio de decisão (minutos)
- `avg_decision_time_with_ia_minutes` (INTEGER) - Tempo médio de decisão com IA (minutos)
- `people_involved` (INTEGER) - Pessoas envolvidas
- `people_involved_with_ia` (INTEGER) - Pessoas envolvidas com IA
- `avg_hourly_rate` (DECIMAL(10,2)) - Valor hora médio

### 6. **VELOCIDADE** (`speed`)
**Colunas em `indicator_type_specific_data`:**
- `current_delivery_time` (DECIMAL(10,2)) - Tempo médio de entrega atual
- `delivery_time_with_ia` (DECIMAL(10,2)) - Tempo médio de entrega com IA
- `delivery_time_unit` (VARCHAR(20)) - Unidade de tempo ('dias', 'horas')
- `deliveries_per_period` (INTEGER) - Número de entregas por período
- `deliveries_period` (VARCHAR(20)) - Período ('dia', 'semana', 'mês', 'ano')
- `cost_per_delay` (DECIMAL(15,2)) - Custo por atraso
- `cost_per_delay_reduced` (DECIMAL(15,2)) - Custo por atraso reduzido
- `work_time_per_delivery_hours` (DECIMAL(10,2)) - Tempo de trabalho por entrega (horas)
- `work_time_per_delivery_with_ia_hours` (DECIMAL(10,2)) - Tempo de trabalho por entrega com IA (horas)

### 7. **SATISFAÇÃO** (`satisfaction`)
**Colunas em `indicator_type_specific_data`:**
- `current_score` (DECIMAL(5,2)) - Score atual
- `score_with_ia` (DECIMAL(5,2)) - Score com IA
- `score_type` (VARCHAR(20)) - Tipo de score ('NPS', 'CSAT', 'outro')
- `number_of_customers` (INTEGER) - Número de clientes
- `avg_value_per_customer` (DECIMAL(15,2)) - Valor médio por cliente
- `current_churn_rate_percentage` (DECIMAL(5,2)) - Taxa de churn atual (%)
- `churn_rate_with_ia_percentage` (DECIMAL(5,2)) - Taxa de churn com IA (%)
- `customer_acquisition_cost` (DECIMAL(15,2)) - Custo de aquisição por cliente
- `avg_support_tickets_per_month` (INTEGER) - Ticket médio de suporte por mês

### 8. **CAPACIDADE ANALÍTICA** (`analytical_capacity`)
**Colunas em `indicator_type_specific_data`:**
- `analyses_before` (INTEGER) - Quantidade de análises antes
- `analyses_after` (INTEGER) - Quantidade de análises depois
- `value_per_analysis` (DECIMAL(15,2)) - Valor por análise

## 🔧 Estrutura das Tabelas

### `indicator_type_specific_data`
- **Total de colunas:** 55 colunas
- **Relação:** 1:1 com `indicators_normalized`
- **Índices:** 
  - `idx_type_specific_indicator_id` (indicator_id)
  - `idx_type_specific_risk_type` (risk_type)
  - `idx_type_specific_score_type` (score_type)
- **Trigger:** `update_indicator_type_specific_data_updated_at` (atualiza `updated_at` automaticamente)

### `persons_involved`
- **Total de colunas:** 13 colunas
- **Colunas de frequência adicionadas:**
  - `frequency_real_quantity`
  - `frequency_real_unit`
  - `frequency_desired_quantity`
  - `frequency_desired_unit`

### `indicators_normalized`
- **Colunas de frequência:**
  - `frequency_value` (INTEGER)
  - `frequency_unit` (frequency_unit ENUM)
  - `baseline_frequency_real` (INTEGER)
  - `baseline_frequency_desired` (INTEGER)
  - `post_ia_frequency` (INTEGER)

## 📋 Enum Values

### `improvement_type`
- `productivity`
- `analytical_capacity`
- `revenue_increase`
- `cost_reduction`
- `risk_reduction`
- `decision_quality`
- `speed`
- `satisfaction`
- `margin_improvement` ✅ (adicionado)

### `frequency_unit`
- `hour`
- `day`
- `week`
- `month`
- `quarter`
- `year`

## ✅ Verificação de Status

### Indicadores Existentes
1. **"Incremento"** (`revenue_increase`)
   - Status: SEM DADOS ESPECÍFICOS (esperado - criado antes da implementação)
   - Ferramentas: 1

2. **"Classificar comentários de NPS"** (`productivity`)
   - Status: SEM DADOS ESPECÍFICOS (normal - PRODUTIVIDADE não usa esta tabela)
   - Pessoas: 2 (1 baseline, 1 post_ia)

## 🎯 Próximos Passos

1. ✅ Tabela `indicator_type_specific_data` criada
2. ✅ Colunas de frequência adicionadas em `persons_involved`
3. ✅ Enum `margin_improvement` adicionado
4. ✅ Código atualizado para salvar em colunas normalizadas
5. ⏳ Testar criação/edição de indicadores de cada tipo
6. ⏳ Migrar dados existentes (se necessário)

## 📝 Notas Importantes

- **PRODUTIVIDADE** não precisa de colunas em `indicator_type_specific_data` porque seus dados são armazenados em `persons_involved` e `tools_costs`
- Todos os outros tipos têm colunas específicas em `indicator_type_specific_data`
- Os dados são salvos diretamente nas colunas, não em JSONB
- A tabela `indicator_type_specific_data` tem relação 1:1 com `indicators_normalized` (UNIQUE constraint em `indicator_id`)

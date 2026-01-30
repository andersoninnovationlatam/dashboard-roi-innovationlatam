# Migração de JSONB para Colunas Normalizadas - Opção B

## 📋 Resumo

Implementação da **Opção B**: Criação da tabela `indicator_type_specific_data` separada para armazenar dados específicos de cada tipo de indicador em colunas normalizadas, substituindo o armazenamento em JSONB.

## ✅ O que foi implementado

### 1. Nova Tabela: `indicator_type_specific_data`

Tabela criada para armazenar todos os dados específicos de cada tipo de indicador em colunas dedicadas:

- **INCREMENTO RECEITA**: `revenue_before`, `revenue_after`
- **MELHORIA MARGEM**: `gross_revenue_monthly`, `total_cost_monthly`, `current_margin_percentage`, `estimated_margin_percentage`, `transaction_volume`
- **REDUÇÃO DE RISCO**: `risk_type`, `current_probability_percentage`, `probability_with_ia_percentage`, `financial_impact`, `mitigation_cost_current`, `mitigation_cost_with_ia`, `evaluation_frequency`, `evaluation_period`
- **QUALIDADE DECISÃO**: `decisions_per_period`, `decisions_period`, `current_accuracy_percentage`, `accuracy_with_ia_percentage`, `avg_cost_wrong_decision`, `avg_cost_wrong_decision_with_ia`, `avg_decision_time_minutes`, `avg_decision_time_with_ia_minutes`, `people_involved`, `people_involved_with_ia`, `avg_hourly_rate`
- **VELOCIDADE**: `current_delivery_time`, `delivery_time_with_ia`, `delivery_time_unit`, `deliveries_per_period`, `deliveries_period`, `cost_per_delay`, `cost_per_delay_reduced`, `work_time_per_delivery_hours`, `work_time_per_delivery_with_ia_hours`
- **SATISFAÇÃO**: `current_score`, `score_with_ia`, `score_type`, `number_of_customers`, `avg_value_per_customer`, `current_churn_rate_percentage`, `churn_rate_with_ia_percentage`, `customer_acquisition_cost`, `avg_support_tickets_per_month`
- **CAPACIDADE ANALÍTICA**: `analyses_before`, `analyses_after`, `value_per_analysis`

### 2. Colunas de Frequência em `persons_involved`

Adicionadas colunas para armazenar frequências diretamente na tabela de pessoas:

- `frequency_real_quantity` (INTEGER)
- `frequency_real_unit` (frequency_unit ENUM)
- `frequency_desired_quantity` (INTEGER)
- `frequency_desired_unit` (frequency_unit ENUM)

### 3. Migrations Criadas

#### `009_create_indicator_type_specific_data.sql`
- Cria a tabela `indicator_type_specific_data`
- Adiciona colunas de frequência em `persons_involved`
- Cria índices e triggers necessários

#### `010_migrate_jsonb_to_columns.sql`
- Migra dados existentes de JSONB para as novas colunas
- Atualiza frequências em `persons_involved`
- Popula `indicator_type_specific_data` com dados dos tipos específicos

### 4. Serviços Atualizados

#### `indicatorServiceSupabase.js`
- **Método `create`**: Agora salva dados em `indicator_type_specific_data` e frequências em `persons_involved`
- **Método `update`**: Atualiza dados nas novas colunas
- **Método `getCompleteById`**: Lê dados das novas colunas e popula `baselineData` e `postIAData`
- **Novo método `_saveTypeSpecificData`**: Extrai e salva dados específicos por tipo

#### `personInvolvedService.js`
- **Método `create`**: Suporta colunas de frequência
- **Método `createMany`**: Suporta colunas de frequência
- **Método `update`**: Suporta atualização de frequências

## 🔄 Fluxo de Dados

### Ao Criar/Atualizar Indicador

1. Dados do formulário chegam em `indicatorData.baseline_data` e `indicatorData.post_ia_data` (formato JSONB legado)
2. `indicatorServiceSupabase.create/update` extrai dados específicos por tipo
3. Dados são salvos em:
   - `indicators_normalized` (dados gerais)
   - `indicator_type_specific_data` (dados específicos por tipo)
   - `persons_involved` (com frequências nas novas colunas)
   - `tools_costs` (ferramentas)
   - `custom_metrics` (métricas customizadas)

### Ao Ler Indicador

1. `getCompleteById` busca dados de todas as tabelas relacionadas
2. Dados de `indicator_type_specific_data` são mapeados para `baselineData` e `postIAData`
3. Frequências são lidas de `persons_involved.frequency_*` e mapeadas para formato legado
4. Retorna objeto no formato esperado pelos componentes (compatibilidade mantida)

## 📝 Como Usar

### 1. Executar Migrations

Execute as migrations na ordem:

```sql
-- 1. Criar estrutura
\i migrations/009_create_indicator_type_specific_data.sql

-- 2. Migrar dados existentes (se houver)
\i migrations/010_migrate_jsonb_to_columns.sql
```

### 2. Código Frontend

O código frontend **não precisa ser alterado**. Os serviços mantêm compatibilidade com o formato legado:

- Formulários continuam enviando `baseline_data` e `post_ia_data` em formato JSONB
- Serviços convertem automaticamente para colunas normalizadas
- Leitura retorna dados no formato esperado pelos componentes

### 3. Novos Indicadores

Ao criar novos indicadores, os dados serão automaticamente salvos nas novas colunas. O formato de entrada continua o mesmo (JSONB), mas internamente tudo é normalizado.

## 🎯 Benefícios

1. **Performance**: Consultas SQL diretas nas colunas são mais rápidas que consultas JSONB
2. **Cálculos**: Fácil realizar cálculos e agregações usando SQL nativo
3. **Validação**: Constraints e tipos podem ser aplicados diretamente nas colunas
4. **Indexação**: Índices podem ser criados em colunas específicas
5. **Manutenibilidade**: Estrutura mais clara e fácil de entender

## ⚠️ Notas Importantes

1. **Compatibilidade Mantida**: O código frontend continua funcionando sem alterações
2. **Dados Legados**: A migration `010` migra dados existentes da tabela `indicators` (se ainda existir)
3. **Formato de Entrada**: Formulários continuam usando formato JSONB, mas dados são normalizados internamente
4. **Rollback**: Se necessário, os dados JSONB originais ainda podem estar na tabela `indicators` (se não foi removida)

## 🔍 Verificação

Para verificar se a migração foi bem-sucedida:

```sql
-- Verificar se a tabela foi criada
SELECT COUNT(*) FROM indicator_type_specific_data;

-- Verificar se frequências foram migradas
SELECT 
  scenario,
  COUNT(*) as total,
  COUNT(frequency_real_quantity) as com_frequencia
FROM persons_involved
GROUP BY scenario;

-- Verificar dados específicos por tipo
SELECT 
  i.improvement_type,
  COUNT(itsd.id) as registros
FROM indicators_normalized i
LEFT JOIN indicator_type_specific_data itsd ON i.id = itsd.indicator_id
GROUP BY i.improvement_type;
```

## 📚 Arquivos Modificados

- `migrations/009_create_indicator_type_specific_data.sql` (novo)
- `migrations/010_migrate_jsonb_to_columns.sql` (novo)
- `services/indicatorServiceSupabase.js` (atualizado)
- `services/personInvolvedService.js` (atualizado)

## ✅ Status

- ✅ Tabela `indicator_type_specific_data` criada
- ✅ Colunas de frequência adicionadas em `persons_involved`
- ✅ Serviços atualizados para salvar em colunas normalizadas
- ✅ Serviços atualizados para ler de colunas normalizadas
- ✅ Compatibilidade com código frontend mantida
- ✅ Migrations criadas para migração de dados existentes

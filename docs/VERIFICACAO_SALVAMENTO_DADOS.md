# Verificação de Salvamento de Dados nas Colunas Normalizadas

## ✅ Status Atual

### Estrutura do Banco de Dados
- ✅ Tabela `indicator_type_specific_data` criada com 51 colunas
- ✅ Colunas de frequência adicionadas em `persons_involved`
- ✅ RLS (Row Level Security) configurado com 4 políticas:
  - SELECT: Usuários podem ver dados da sua organização
  - INSERT: Analistas podem criar dados
  - UPDATE: Analistas podem atualizar dados
  - DELETE: Apenas admins/managers podem deletar

### Indicadores Existentes
1. **"Incremento"** (`revenue_increase`)
   - ID: `dfb1e4d5-b066-438e-a363-8cd3aaeba175`
   - Status: SEM DADOS ESPECÍFICOS (criado antes da implementação)
   - Esperado: Ao editar e salvar, os dados devem ser salvos em `revenue_before` e `revenue_after`

2. **"Classificar comentários de NPS"** (`productivity`)
   - ID: `b7ae5db9-702f-4fea-b164-35d5f15367b3`
   - Status: SEM DADOS ESPECÍFICOS (normal - PRODUTIVIDADE não usa esta tabela)
   - Pessoas envolvidas: 2 (1 baseline, 1 post_ia)
   - Frequências: NULL (esperado para indicadores antigos)

### Problema Identificado e Resolvido
- ❌ **Problema**: Erro 403 ao tentar salvar e erro 406 ao tentar ler `indicator_type_specific_data`
- ✅ **Causa**: RLS habilitado mas sem políticas configuradas
- ✅ **Solução**: Políticas RLS criadas seguindo o padrão das outras tabelas

## 🔍 Verificações Realizadas

### 1. Estrutura da Tabela
```sql
-- Total de colunas: 51
-- Todas as colunas necessárias para todos os tipos de indicadores estão presentes
```

### 2. Políticas RLS
```sql
-- 4 políticas criadas:
-- 1. SELECT: "Users can view organization indicator type data"
-- 2. INSERT: "Analysts can create indicator type data"
-- 3. UPDATE: "Analysts can update indicator type data"
-- 4. DELETE: "Managers can delete indicator type data"
```

### 3. Código de Salvamento
- ✅ Método `_saveTypeSpecificData` implementado corretamente
- ✅ Usa `.upsert()` com `onConflict: 'indicator_id'`
- ✅ Logs de debug adicionados
- ✅ Tratamento de erros implementado

### 4. Mapeamento de Tipos
- ✅ Todos os tipos mapeados corretamente:
  - `revenue_increase` → `INCREMENTO RECEITA`
  - `margin_improvement` → `MELHORIA MARGEM`
  - `risk_reduction` → `REDUÇÃO DE RISCO`
  - `decision_quality` → `QUALIDADE DECISÃO`
  - `speed` → `VELOCIDADE`
  - `satisfaction` → `SATISFAÇÃO`
  - `analytical_capacity` → `CAPACIDADE ANALÍTICA`
  - `productivity` → `PRODUTIVIDADE` (não usa esta tabela)

## 🧪 Como Testar

### Teste 1: Criar Novo Indicador de INCREMENTO RECEITA
1. Criar novo indicador do tipo "Incremento Receita"
2. Preencher "Valor da Receita Antes" na aba Baseline
3. Preencher "Valor da Receita Depois" na aba Pós-IA
4. Salvar o indicador
5. **Verificar no console do navegador:**
   - `📝 IndicatorForm - Dados antes de salvar` (deve mostrar `baselineData` e `postIAData` com `tipo`)
   - `🔍 _saveTypeSpecificData - INÍCIO` (deve mostrar os dados recebidos)
   - `💾 _saveTypeSpecificData - Salvando` (deve mostrar `dataToSave` com `revenue_before` e `revenue_after`)
   - `✅ Dados específicos salvos com sucesso` (deve aparecer se salvou corretamente)
6. **Verificar no Supabase:**
   ```sql
   SELECT * FROM indicator_type_specific_data 
   WHERE indicator_id = 'id-do-indicador-criado';
   ```
   - Deve retornar um registro com `revenue_before` e `revenue_after` preenchidos

### Teste 2: Editar Indicador Existente
1. Editar o indicador "Incremento" existente
2. Preencher os campos de receita
3. Salvar
4. Verificar os mesmos logs e consulta SQL acima

### Teste 3: Outros Tipos de Indicadores
Repetir o processo para cada tipo:
- **MELHORIA MARGEM**: Verificar se salva `gross_revenue_monthly`, `total_cost_monthly`, `current_margin_percentage`, etc.
- **REDUÇÃO DE RISCO**: Verificar se salva `risk_type`, `current_probability_percentage`, etc.
- **QUALIDADE DECISÃO**: Verificar se salva `decisions_per_period`, `current_accuracy_percentage`, etc.
- **VELOCIDADE**: Verificar se salva `current_delivery_time`, `delivery_time_with_ia`, etc.
- **SATISFAÇÃO**: Verificar se salva `current_score`, `score_with_ia`, etc.
- **CAPACIDADE ANALÍTICA**: Verificar se salva `analyses_before`, `analyses_after`, etc.

## 📊 Verificação de Dados Salvos

### Query para Verificar Todos os Indicadores
```sql
SELECT 
  i.id,
  i.name,
  i.improvement_type,
  CASE WHEN itsd.id IS NULL THEN 'SEM DADOS' ELSE 'COM DADOS' END as status,
  itsd.revenue_before,
  itsd.revenue_after,
  itsd.gross_revenue_monthly,
  itsd.current_margin_percentage,
  itsd.current_score,
  itsd.analyses_before
FROM indicators_normalized i
LEFT JOIN indicator_type_specific_data itsd ON i.id = itsd.indicator_id
ORDER BY i.created_at DESC;
```

### Query para Verificar Frequências em persons_involved
```sql
SELECT 
  pi.indicator_id,
  i.name,
  pi.scenario,
  pi.person_name,
  pi.frequency_real_quantity,
  pi.frequency_real_unit,
  pi.frequency_desired_quantity,
  pi.frequency_desired_unit
FROM persons_involved pi
JOIN indicators_normalized i ON pi.indicator_id = i.id
WHERE pi.frequency_real_quantity IS NOT NULL
ORDER BY pi.created_at DESC;
```

## ⚠️ Possíveis Problemas

### Se os dados não estiverem sendo salvos:

1. **Verificar logs do console do navegador**
   - Se aparecer `⚠️ _saveTypeSpecificData: Nenhum dado para salvar`, significa que `baselineData` ou `postIAData` não têm os campos esperados
   - Verificar se `baselineData.tipo` está definido

2. **Verificar se há erro 403**
   - Se ainda aparecer erro 403, verificar se o usuário tem permissão (role: admin, manager ou analyst)
   - Verificar se o usuário pertence à mesma organização do projeto

3. **Verificar estrutura dos dados**
   - `baselineData` deve ter `tipo: 'INCREMENTO RECEITA'`
   - `baselineData` deve ter `valorReceitaAntes`
   - `postIAData` deve ter `valorReceitaDepois`

## ✅ Próximos Passos

1. Testar criação de novo indicador de INCREMENTO RECEITA
2. Testar edição do indicador "Incremento" existente
3. Verificar se os dados aparecem corretamente no Dashboard
4. Testar outros tipos de indicadores
5. Verificar se as frequências estão sendo salvas em `persons_involved`

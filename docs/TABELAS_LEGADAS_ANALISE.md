# Análise de Tabelas Legadas - Relatório Completo

## 📊 Status da Migração

✅ **Migração concluída com sucesso:**
- 7 indicadores migrados de `indicators` → `indicators_normalized`
- 10 pessoas envolvidas migradas
- 1 ferramenta/custo migrado
- Todas as tabelas novas criadas e funcionais

## 🔍 Referências Encontradas

### ❌ Código que AINDA usa a tabela antiga `indicators`

#### 1. Hooks TypeScript (CRÍTICO - Precisam ser atualizados)

**`src/hooks/useBaseline.ts`** (linha 29)
```typescript
.from('indicators')  // ❌ Tabela antiga
.update({
  baseline_data: baselineData,  // ❌ Campo JSONB antigo
})
```

**`src/hooks/usePostIA.ts`** (linha 29)
```typescript
.from('indicators')  // ❌ Tabela antiga
.update({
  post_ia_data: postIAData,  // ❌ Campo JSONB antigo
})
```

**Ação necessária:** 
- Atualizar para usar `indicators_normalized` e serviços normalizados
- OU remover se não estiverem mais em uso

#### 2. Serviços com Compatibilidade Legada (OK - Mantém compatibilidade)

**`services/roiCalculatorService.js`**
- ✅ Tem compatibilidade com formato legado (baselineData, postIAData, custos_data)
- ✅ Já suporta estrutura normalizada
- **Ação:** Manter por enquanto para transição suave

**`services/indicatorMetricsService.js`**
- ✅ Tem compatibilidade com formato legado (baseline_data, post_ia_data, info_data)
- ✅ Já suporta estrutura normalizada
- **Ação:** Manter por enquanto para transição suave

#### 3. Scripts de Migração (OK - Devem manter referências)

**`migrations/002_migrate_existing_data.sql`**
- ✅ Usa `indicators` para migração (correto)
- **Ação:** Manter

**`migrations/004_migrate_production_data.sql`**
- ✅ Referencia `indicators` para validação (correto)
- **Ação:** Manter

**`scripts/validate_migration.js`**
- ✅ Referencia `indicators` para comparação (correto)
- **Ação:** Manter

### ✅ Código já atualizado para estrutura normalizada

- ✅ `services/indicatorServiceSupabase.js` - Usa `indicators_normalized`
- ✅ `services/projectServiceSupabase.js` - Usa `indicators_normalized`
- ✅ `services/personInvolvedService.js` - Nova estrutura
- ✅ `services/toolCostService.js` - Nova estrutura
- ✅ `services/customMetricService.js` - Nova estrutura
- ✅ `services/trackingService.js` - Nova estrutura
- ✅ `services/calculatedResultsService.js` - Nova estrutura

## 📋 Tabelas que Podem Ser Removidas

### 1. `indicators` (Tabela Antiga com JSONB)

**Status:** ⚠️ **AGUARDANDO ATUALIZAÇÃO DOS HOOKS**

**Dados migrados:**
- ✅ 7 indicadores migrados para `indicators_normalized`
- ✅ 10 pessoas envolvidas migradas
- ✅ 1 ferramenta migrada

**Referências no código:**
- ❌ `src/hooks/useBaseline.ts` - Precisa atualizar
- ❌ `src/hooks/usePostIA.ts` - Precisa atualizar
- ✅ Scripts de migração (OK manter)
- ✅ Serviços com compatibilidade (OK manter temporariamente)

**Recomendação:**
1. Atualizar ou remover os hooks `useBaseline.ts` e `usePostIA.ts`
2. Verificar se algum componente ainda usa esses hooks
3. Após validação, remover a tabela `indicators`

### 2. `project_indicators` (Tabela Alternativa)

**Status:** ✅ **PODE SER REMOVIDA IMEDIATAMENTE**

**Dados:**
- 0 registros
- Não está sendo usada

**Referências no código:**
- Nenhuma encontrada

**Recomendação:**
- ✅ Remover imediatamente (não há risco)

## 🎯 Plano de Ação

### Fase 1: Atualizar Hooks (URGENTE)

1. **Verificar uso dos hooks:**
   ```bash
   grep -r "useBaseline\|usePostIA" dash-roi-v2/
   ```

2. **Opções:**
   - **Opção A:** Atualizar hooks para usar estrutura normalizada
   - **Opção B:** Remover hooks se não estiverem em uso

### Fase 2: Remover `project_indicators` (IMEDIATO)

```sql
-- Pode ser removida imediatamente (0 registros, não usada)
DROP TABLE IF EXISTS project_indicators CASCADE;
```

### Fase 3: Remover `indicators` (APÓS FASE 1)

```sql
-- APENAS após atualizar/remover os hooks
-- 1. Verificar que não há mais referências
-- 2. Fazer backup
-- 3. Remover constraints
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_project_id_fkey;
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_user_id_fkey;

-- 4. Remover tabela
DROP TABLE IF EXISTS indicators CASCADE;
```

## ✅ Checklist de Validação

Antes de remover `indicators`:

- [ ] Verificar uso de `useBaseline` e `usePostIA` no código
- [ ] Atualizar ou remover hooks legados
- [ ] Testar criação de indicadores com nova estrutura
- [ ] Testar edição de indicadores com nova estrutura
- [ ] Validar que cálculos funcionam corretamente
- [ ] Fazer backup completo do banco
- [ ] Executar script de validação: `node scripts/validate_migration.js`

## 📝 Notas Importantes

1. **Compatibilidade Temporária:** Os serviços `roiCalculatorService` e `indicatorMetricsService` mantêm compatibilidade com formato legado. Isso é **intencional** para permitir transição suave.

2. **Scripts de Migração:** Os scripts de migração devem continuar referenciando a tabela antiga para validação e rollback.

3. **RLS:** A tabela `indicators` antiga não tem RLS configurado. A nova `indicators_normalized` tem RLS completo.

4. **Performance:** A estrutura normalizada é mais eficiente para queries e cálculos.

## 🔄 Próximos Passos Recomendados

1. ✅ **IMEDIATO:** Remover `project_indicators` (sem risco)
2. ⚠️ **URGENTE:** Atualizar hooks `useBaseline.ts` e `usePostIA.ts`
3. ⏳ **APÓS VALIDAÇÃO:** Remover tabela `indicators` antiga

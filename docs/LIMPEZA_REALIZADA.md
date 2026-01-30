# Limpeza de Código Legado - Realizada

## ✅ Ações Executadas

### 1. Hooks Legados Removidos ✅

**Removidos:**
- ✅ `src/hooks/useBaseline.ts` - Hook que usava tabela `indicators` antiga
- ✅ `src/hooks/usePostIA.ts` - Hook que usava tabela `indicators` antiga

**Motivo:** 
- Não estavam sendo usados em produção
- Apenas em exemplos/documentação
- Usavam estrutura JSONB antiga (`baseline_data`, `post_ia_data`)

### 2. Exemplos Atualizados ✅

**Atualizados:**
- ✅ `src/features/projects/BaselineForm.example.tsx` - Atualizado para usar `indicatorServiceSupabase`
- ✅ `src/features/projects/BaselineForm.README.md` - Documentação atualizada

**Mudança:**
- Antes: Usava `useBaseline` hook com tabela antiga
- Agora: Usa `indicatorServiceSupabase` com estrutura normalizada

### 3. Script de Limpeza Criado ✅

**Criado:**
- ✅ `migrations/005_cleanup_legacy_tables.sql` - Script para limpeza segura

**Funcionalidades:**
- Remove `project_indicators` automaticamente (se vazia)
- Marca `indicators` como DEPRECATED (não remove ainda)
- Validação pós-limpeza
- Instruções para remoção futura de `indicators`

## 📋 Próximos Passos

### Executar Migração de Limpeza

```sql
-- Executar no Supabase SQL Editor
-- migrations/005_cleanup_legacy_tables.sql
```

Este script irá:
1. ✅ Remover `project_indicators` (se vazia)
2. ⚠️ Marcar `indicators` como DEPRECATED (mantém por segurança)
3. ✅ Validar migração

### Remover Tabela `indicators` no Futuro

**Quando:** Após validação completa (30 dias recomendado)

**Checklist:**
- [ ] Todos os testes passando
- [ ] Nenhum erro em produção
- [ ] Backup completo feito
- [ ] Validação executada: `node scripts/validate_migration.js`

**Script de Remoção Final:**
```sql
-- Executar APENAS após completar checklist acima
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_project_id_fkey;
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_user_id_fkey;
DROP TABLE IF EXISTS indicators CASCADE;
```

## 🎯 Status Atual

### ✅ Código Limpo
- Hooks legados removidos
- Exemplos atualizados
- Documentação atualizada

### ⚠️ Tabelas
- `project_indicators` - Será removida pela migração 005
- `indicators` - Marcada como DEPRECATED, mantida temporariamente

### ✅ Estrutura Normalizada
- `indicators_normalized` - Em uso
- `persons_involved` - Em uso
- `tools_costs` - Em uso
- Todos os serviços atualizados

## 📝 Notas

1. **Compatibilidade Mantida:** Os serviços `roiCalculatorService` e `indicatorMetricsService` ainda mantêm compatibilidade com formato legado. Isso é intencional para transição suave.

2. **Segurança:** A tabela `indicators` antiga foi mantida temporariamente para permitir rollback se necessário.

3. **Performance:** A estrutura normalizada é significativamente mais eficiente.

4. **RLS:** A tabela antiga não tem RLS. A nova tem RLS completo.

## ✅ Conclusão

A limpeza de código legado foi realizada com sucesso. O código agora usa exclusivamente a estrutura normalizada, mantendo compatibilidade temporária nos serviços de cálculo para transição suave.

A tabela `indicators` antiga permanece marcada como DEPRECATED e pode ser removida após período de validação (recomendado: 30 dias).

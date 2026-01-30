# Recomendações para Remoção de Tabelas Legadas

## ✅ Resumo Executivo

**Status:** Migração concluída com sucesso ✅

**Tabelas que podem ser removidas:**
1. ✅ `project_indicators` - **PODE SER REMOVIDA IMEDIATAMENTE** (0 registros, não usada)
2. ⚠️ `indicators` - **AGUARDAR** (7 registros migrados, hooks legados encontrados)

## 📊 Análise Detalhada

### 1. Tabela `project_indicators` 

**Status:** ✅ **REMOVER IMEDIATAMENTE**

**Motivos:**
- 0 registros na tabela
- Nenhuma referência no código de produção
- Não faz parte da especificação técnica
- Não tem RLS configurado

**Script de Remoção:**
```sql
-- Pode ser removida imediatamente sem risco
DROP TABLE IF EXISTS project_indicators CASCADE;
```

### 2. Tabela `indicators` (Antiga com JSONB)

**Status:** ⚠️ **AGUARDAR ATUALIZAÇÃO**

**Motivos para aguardar:**
- Hooks legados encontrados (`useBaseline.ts`, `usePostIA.ts`)
- Usados apenas em exemplos/documentação (não em produção)
- Compatibilidade mantida em serviços (intencional)

**Dados migrados:**
- ✅ 7 indicadores → `indicators_normalized`
- ✅ 10 pessoas envolvidas → `persons_involved`
- ✅ 1 ferramenta → `tools_costs`

**Referências encontradas:**

#### ❌ Hooks TypeScript (Precisam ser atualizados ou removidos)
- `src/hooks/useBaseline.ts` - Usa `.from('indicators')` e `baseline_data` JSONB
- `src/hooks/usePostIA.ts` - Usa `.from('indicators')` e `post_ia_data` JSONB

**Uso atual:** Apenas em exemplos (`BaselineForm.example.tsx`) e documentação

#### ✅ Serviços (Compatibilidade mantida - OK)
- `services/roiCalculatorService.js` - Compatibilidade legada (intencional)
- `services/indicatorMetricsService.js` - Compatibilidade legada (intencional)

#### ✅ Scripts (Devem manter - OK)
- Scripts de migração e validação

## 🎯 Plano de Ação Recomendado

### Fase 1: Remover `project_indicators` (IMEDIATO)

```sql
-- Executar agora - sem risco
DROP TABLE IF EXISTS project_indicators CASCADE;
```

### Fase 2: Atualizar/Remover Hooks Legados (URGENTE)

**Opção A: Remover hooks se não estão em uso**
```bash
# Verificar uso real
grep -r "useBaseline\|usePostIA" dash-roi-v2/pages/ dash-roi-v2/components/
```

Se não houver uso em produção:
```bash
# Remover hooks legados
rm dash-roi-v2/src/hooks/useBaseline.ts
rm dash-roi-v2/src/hooks/usePostIA.ts
```

**Opção B: Atualizar hooks para usar estrutura normalizada**
- Atualizar para usar `indicatorServiceSupabase` e estrutura normalizada
- Manter interface similar para compatibilidade

### Fase 3: Remover `indicators` (APÓS FASE 2)

**Checklist antes de remover:**
- [ ] Hooks `useBaseline` e `usePostIA` atualizados ou removidos
- [ ] Nenhum componente de produção usa tabela antiga
- [ ] Testes passando com estrutura normalizada
- [ ] Backup completo do banco feito
- [ ] Validação executada: `node scripts/validate_migration.js`

**Script de Remoção:**
```sql
-- APENAS após completar checklist acima

-- 1. Verificar que não há mais dados não migrados
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM indicators;
  SELECT COUNT(*) INTO new_count FROM indicators_normalized;
  
  IF old_count > new_count THEN
    RAISE EXCEPTION 'Ainda há indicadores não migrados!';
  END IF;
END $$;

-- 2. Remover constraints
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_project_id_fkey;
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_user_id_fkey;

-- 3. Remover tabela
DROP TABLE IF EXISTS indicators CASCADE;

-- 4. Verificar remoção
SELECT COUNT(*) FROM indicators; -- Deve retornar erro (tabela não existe)
```

## 📋 Checklist Final

### Antes de remover `indicators`:

- [ ] ✅ `project_indicators` removida
- [ ] ⚠️ Hooks `useBaseline` e `usePostIA` atualizados/removidos
- [ ] ⚠️ Verificado que nenhum componente usa tabela antiga
- [ ] ⚠️ Testes de criação/edição de indicadores passando
- [ ] ⚠️ Cálculos de ROI funcionando corretamente
- [ ] ⚠️ Backup completo do banco feito
- [ ] ⚠️ Validação executada com sucesso

## 🔍 Comandos de Verificação

```bash
# 1. Verificar uso dos hooks
grep -r "useBaseline\|usePostIA" dash-roi-v2/pages/ dash-roi-v2/components/ dash-roi-v2/src/features/

# 2. Verificar referências à tabela antiga
grep -r "\.from('indicators')\|\.from(\"indicators\")" dash-roi-v2/

# 3. Verificar uso de campos JSONB antigos
grep -r "baseline_data\|post_ia_data\|custos_data\|ia_data\|info_data" dash-roi-v2/pages/ dash-roi-v2/components/
```

## ⚠️ Notas Importantes

1. **Compatibilidade Temporária:** Os serviços mantêm compatibilidade com formato legado para transição suave. Isso é **intencional** e pode ser mantido temporariamente.

2. **Scripts de Migração:** Devem continuar referenciando tabelas antigas para validação e rollback.

3. **RLS:** A tabela `indicators` antiga não tem RLS. A nova `indicators_normalized` tem RLS completo.

4. **Performance:** A estrutura normalizada é significativamente mais eficiente para queries e cálculos.

## ✅ Conclusão

**Ação Imediata:**
- ✅ Remover `project_indicators` agora (sem risco)

**Ação Urgente:**
- ⚠️ Atualizar ou remover hooks `useBaseline` e `usePostIA`

**Ação Futura:**
- ⏳ Remover `indicators` após validação completa

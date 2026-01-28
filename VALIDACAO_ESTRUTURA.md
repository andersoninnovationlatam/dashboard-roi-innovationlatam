# Validação de Estrutura - Abas, Colunas e Dados

## 📋 Mapeamento Abas → Colunas JSONB

| Aba | Coluna Supabase | Campo no Código | Status |
|-----|-----------------|-----------------|--------|
| **INFO** | `info_data` | `indicatorDataService.saveInfo()` | ✅ |
| **BASELINE** | `baseline_data` | `formData.baselineData` | ✅ |
| **PÓS-IA** | `post_ia_data` | `formData.postIAData` | ✅ |
| **IA** | `ia_data` | `formData.comIA` | ✅ |
| **CUSTOS** | `custos_data` | `formData.custos` | ✅ |

## 🔍 Validação Detalhada

### 1. Aba INFO → `info_data`

**Estrutura Esperada (Supabase):**
```json
{
  "nome": "string",
  "tipoIndicador": "string",
  "descricao": "string",
  "camposEspecificos": {}
}
```

**Código de Salvamento:**
```javascript
// IndicatorForm.jsx:453-458
indicatorDataService.saveInfo(indicatorIdToUse, {
  nome: formData.nome,
  tipoIndicador: formData.tipoIndicador,
  descricao: formData.descricao,
  camposEspecificos: formData.camposEspecificos
})
```

**Status:** ✅ **CORRETO** - Campos correspondem exatamente

---

### 2. Aba BASELINE → `baseline_data`

**Estrutura Esperada (Supabase):**
```json
{
  "tipo": "PRODUTIVIDADE" | "INCREMENTO RECEITA" | "CUSTOS RELACIONADOS" | "OUTROS" | ...,
  "pessoas": [...], // Para PRODUTIVIDADE
  "valorReceitaAntes": number, // Para INCREMENTO RECEITA
  "ferramentas": [...], // Para CUSTOS RELACIONADOS
  "nomeIndicador": string, // Para OUTROS
  "valorIndicador": number, // Para OUTROS
  "custoTotalBaseline": number // Calculado
}
```

**Código de Salvamento:**
```javascript
// IndicatorForm.jsx:461-470
if (formData.baselineData) {
  indicatorDataService.saveBaseline(indicatorIdToUse, {
    baselineData: formData.baselineData, // ✅ Estrutura completa
    pessoas: formData.baseline.pessoas // ⚠️ Mantém compatibilidade (legado)
  })
}
```

**Problema Identificado:** ⚠️
- O código salva `baselineData` (estrutura completa) E `pessoas` (legado)
- Isso pode causar duplicação de dados
- **Recomendação:** Remover `pessoas` do objeto salvo, usar apenas `baselineData`

**Status:** ⚠️ **PARCIALMENTE CORRETO** - Precisa ajuste

---

### 3. Aba PÓS-IA → `post_ia_data`

**Estrutura Esperada (Supabase):**
```json
{
  "tipo": "PRODUTIVIDADE" | "INCREMENTO RECEITA" | ...,
  "pessoas": [...], // Para PRODUTIVIDADE
  "valorReceitaDepois": number, // Para INCREMENTO RECEITA
  "custoTotalPostIA": number,
  "deltaProdutividade": number,
  "deltaReceita": number
}
```

**Código de Salvamento:**
```javascript
// IndicatorForm.jsx:483-487
if (formData.postIAData) {
  indicatorDataService.savePostIA(indicatorIdToUse, {
    postIAData: formData.postIAData // ✅ Estrutura completa
  })
}
```

**Status:** ✅ **CORRETO** - Estrutura correta

---

### 4. Aba IA → `ia_data`

**Estrutura Esperada (Supabase):**
```json
{
  "precisaValidacao": boolean,
  "pessoas": [],
  "ias": [
    {
      "nome": "string",
      "tempoExecucao": number,
      "quantidadeOperacoes": number,
      "periodoOperacoes": "string",
      "capacidadeProcessamento": number,
      "precisao": number,
      "taxaErro": number,
      "custoPorOperacao": number
    }
  ]
}
```

**Código de Salvamento:**
```javascript
// IndicatorForm.jsx:472-476
indicatorDataService.saveIA(indicatorIdToUse, {
  precisaValidacao: formData.comIA.precisaValidacao,
  pessoas: formData.comIA.pessoas,
  ias: formData.comIA.ias
})
```

**Status:** ✅ **CORRETO** - Campos correspondem

---

### 5. Aba CUSTOS → `custos_data`

**Estrutura Esperada (Supabase):**
```json
{
  "custos": [
    {
      "nome": "string",
      "valor": number,
      "tipo": "mensal" | "anual"
    }
  ]
}
```

**Código de Salvamento:**
```javascript
// IndicatorForm.jsx:478-480
indicatorDataService.saveCustos(indicatorIdToUse, {
  custos: formData.custos
})
```

**Status:** ✅ **CORRETO** - Estrutura correta

---

## 🆔 Validação de IDs

### IDs de Indicador
- **Gerado por:** `createIndicator()` → `indicatorService.create()`
- **Tipo:** UUID (Supabase) ou string (localStorage temporário)
- **Relacionamento:** `project_id` (FK para `projects.id`)
- **Status:** ✅ **CORRETO**

### IDs de Pessoas/Ferramentas
**Código Atual:**
```typescript
// BaselineTab.tsx:231
id: Date.now().toString()
```

**Problema Identificado:** ⚠️
- Usa timestamp como ID (pode causar colisões)
- Não é UUID padrão
- **Recomendação:** Usar `crypto.randomUUID()` ou biblioteca UUID

**Status:** ⚠️ **FUNCIONAL MAS NÃO IDEAL**

---

## 🔗 Validação de Relacionamentos

### Tabela `indicators`
```sql
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**Código de Criação:**
```javascript
// IndicatorForm.jsx:440
const createResult = await createIndicator({ projetoId: id })
```

**Status Atual:**
- Sistema usa **localStorage temporariamente** (não Supabase ainda)
- `indicatorService.create()` salva `projetoId` no localStorage
- **Quando migrar para Supabase:** Precisa mapear `projetoId` → `project_id`

**Status:** ✅ **CORRETO PARA LOCALSTORAGE** | ⚠️ **PRECISA MAPEAMENTO PARA SUPABASE**

---

## 📊 Resumo de Problemas Encontrados

| # | Problema | Localização | Severidade | Ação Necessária |
|---|----------|-------------|------------|-----------------|
| 1 | Duplicação de dados no baseline | `IndicatorForm.jsx:464` | Média | Remover `pessoas` do objeto salvo |
| 2 | IDs não são UUIDs | `BaselineTab.tsx:231` | Baixa | Usar `crypto.randomUUID()` |
| 3 | Mapeamento `projetoId` → `project_id` | `IndicatorForm.jsx:440` | Baixa | Apenas quando migrar para Supabase |

---

## ✅ Checklist de Validação

- [x] Abas mapeadas para colunas corretas
- [x] Estrutura de dados JSONB validada
- [x] IDs sendo gerados (mas não são UUIDs - OK para localStorage)
- [x] Relacionamentos definidos no SQL
- [x] Mapeamento `projetoId` → `project_id` (OK para localStorage, pendente para Supabase)
- [ ] **PENDENTE:** Remover duplicação no baseline (`pessoas` duplicado)
- [ ] **OPCIONAL:** Migrar IDs para UUIDs (quando migrar para Supabase)

---

## 🔧 Correções Recomendadas

### 1. Remover Duplicação no Baseline
```javascript
// ANTES (IndicatorForm.jsx:461-465)
if (formData.baselineData) {
  indicatorDataService.saveBaseline(indicatorIdToUse, {
    baselineData: formData.baselineData,
    pessoas: formData.baseline.pessoas // ❌ REMOVER
  })
}

// DEPOIS
if (formData.baselineData) {
  indicatorDataService.saveBaseline(indicatorIdToUse, {
    baselineData: formData.baselineData // ✅ Apenas estrutura completa
  })
}
```

### 2. Usar UUIDs para IDs
```typescript
// ANTES
id: Date.now().toString()

// DEPOIS
id: crypto.randomUUID() // ou import { v4 as uuidv4 } from 'uuid'; uuidv4()
```

### 3. Verificar Mapeamento projetoId
```javascript
// Verificar em indicatorService.create() se faz:
// { projetoId } → { project_id }
```

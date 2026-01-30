# Plano de Implementação: Serviço de Cálculos Centralizados

## 📋 Situação Atual

### ✅ O que já existe:
1. **Estrutura de Dados:**
   - ✅ `projects` - tabela de projetos
   - ✅ `indicators_normalized` - tabela de indicadores
   - ✅ Tabelas individuais por tipo com colunas `baseline_*` e `post_ia_*`:
     - `indicator_produtividade_data`
     - `indicator_incremento_receita_data`
     - `indicator_melhoria_margem_data`
     - `indicator_reducao_risco_data`
     - `indicator_qualidade_decisao_data`
     - `indicator_velocidade_data`
     - `indicator_satisfacao_data`
     - `indicator_capacidade_analitica_data`
   - ✅ `indicator_calculated_metrics` - tabela com valores calculados

2. **Cálculos Atuais:**
   - ❌ Cálculos são feitos no **frontend** (PostIATab.tsx)
   - ❌ Valores calculados são salvos apenas quando o indicador é salvo via formulário
   - ❌ Não há recálculo automático baseado nos dados do banco
   - ❌ Se dados mudarem diretamente no banco, cálculos ficam desatualizados

### ❌ Problemas Identificados:
1. **Cálculos no Frontend:** Lógica de cálculo espalhada no componente React
2. **Sem Recálculo Automático:** Não há serviço que recalcula quando dados mudam
3. **Dependência do Formulário:** Cálculos só são salvos quando usuário salva via UI
4. **Inconsistência:** Dados no banco podem não refletir os cálculos corretos

---

## 🎯 Objetivo

Criar um **serviço centralizado de cálculos** que:
1. Lê dados das tabelas individuais (baseline_* e post_ia_*)
2. Realiza todos os cálculos usando fórmulas centralizadas
3. Salva resultados em `indicator_calculated_metrics`
4. Pode ser chamado automaticamente ou manualmente
5. Dashboard usa apenas os dados calculados

---

## 📐 Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    DADOS DE ENTRADA                          │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Tabelas Baseline │  │ Tabelas Post-IA  │                 │
│  │ (baseline_*)     │  │ (post_ia_*)      │                 │
│  └──────────────────┘  └──────────────────┘                 │
│           │                    │                              │
│           └────────┬───────────┘                              │
│                    ▼                                           │
│  ┌──────────────────────────────────────────┐                │
│  │  indicatorCalculationService.js            │                │
│  │  (Serviço Centralizado de Cálculos)      │                │
│  │                                            │                │
│  │  - calculateIndicatorMetrics(indicatorId) │                │
│  │  - calculateProdutividade()               │                │
│  │  - calculateIncrementoReceita()           │                │
│  │  - calculateMelhoriaMargem()              │                │
│  │  - calculateReducaoRisco()                │                │
│  │  - calculateQualidadeDecisao()            │                │
│  │  - calculateVelocidade()                  │                │
│  │  - calculateSatisfacao()                  │                │
│  │  - calculateCapacidadeAnalitica()         │                │
│  └──────────────────────────────────────────┘                │
│                    │                                           │
│                    ▼                                           │
│  ┌──────────────────────────────────────────┐                │
│  │  indicator_calculated_metrics             │                │
│  │  (Valores Calculados)                    │                │
│  └──────────────────────────────────────────┘                │
│                    │                                           │
│                    ▼                                           │
│  ┌──────────────────────────────────────────┐                │
│  │  Dashboard.jsx                            │                │
│  │  (Usa apenas dados calculados)            │                │
│  └──────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementação

### 1. Criar `indicatorCalculationService.js`

**Localização:** `dash-roi-v2/services/indicatorCalculationService.js`

**Responsabilidades:**
- Buscar dados das tabelas individuais (baseline e post-IA)
- Realizar cálculos para cada tipo de indicador
- Salvar resultados em `indicator_calculated_metrics`
- Fornecer função principal: `calculateAndSaveMetrics(indicatorId)`

**Estrutura:**
```javascript
export const indicatorCalculationService = {
  /**
   * Calcula e salva métricas de um indicador
   * Lê dados das tabelas individuais e calcula todas as métricas
   */
  async calculateAndSaveMetrics(indicatorId) {
    // 1. Buscar indicador completo (com dados das tabelas individuais)
    // 2. Identificar tipo do indicador
    // 3. Chamar função de cálculo específica do tipo
    // 4. Salvar em indicator_calculated_metrics
  },

  /**
   * Calcula métricas de PRODUTIVIDADE
   */
  async calculateProdutividade(indicatorId, baselineData, postIAData, personsBaseline, personsPostIA) {
    // Fórmulas:
    // - delta_produtividade = (HH Antes - HH Depois) × Valor Hora
    // - horas_economizadas_mes = soma das horas economizadas
    // - custo_total_baseline = soma dos custos baseline
    // - custo_total_post_ia = soma dos custos post-IA
  },

  /**
   * Calcula métricas de INCREMENTO RECEITA
   */
  async calculateIncrementoReceita(indicatorId, baselineData, postIAData) {
    // Fórmula:
    // - delta_receita = revenue_after - revenue_before
  },

  // ... outros tipos
}
```

### 2. Integrar com `indicatorServiceSupabase.js`

**Modificar método `_saveTypeSpecificData`:**
- Após salvar dados nas tabelas individuais
- Chamar `indicatorCalculationService.calculateAndSaveMetrics(indicatorId)`
- Garantir que cálculos são atualizados sempre que dados mudam

### 3. Criar Trigger no Banco (Opcional)

**Migration:** `019_create_calculation_trigger.sql`

Criar trigger PostgreSQL que:
- Detecta mudanças nas tabelas individuais
- Chama função de cálculo (via Edge Function ou webhook)
- Atualiza `indicator_calculated_metrics` automaticamente

**Alternativa mais simples:**
- Chamar cálculo sempre que `_saveTypeSpecificData` é executado
- Não precisa de trigger se cálculo for síncrono

### 4. Atualizar Dashboard

**Modificar `Dashboard.jsx`:**
- Remover cálculos em tempo real
- Usar apenas dados de `indicator_calculated_metrics`
- Se dados não existirem, chamar `calculateAndSaveMetrics` uma vez

### 5. Migrar Lógica de Cálculo

**De:** `PostIATab.tsx` (frontend)
**Para:** `indicatorCalculationService.js` (backend/service)

**Manter no Frontend:**
- Apenas preview dos cálculos (opcional)
- Validação de inputs

**Mover para Service:**
- Todas as fórmulas de cálculo
- Lógica de conversão de períodos
- Cálculos de ROI, payback, etc.

---

## 📝 Fórmulas por Tipo

### PRODUTIVIDADE
```javascript
// Delta Produtividade
delta_produtividade = Σ[(HH_baseline - HH_postIA) × valor_hora]

// Horas Economizadas
horas_economizadas_mes = Σ[(tempo_baseline - tempo_postIA) × frequencia_mensal]

// Custos
custo_total_baseline = Σ[(tempo_baseline / 60) × valor_hora × frequencia_mensal]
custo_total_post_ia = Σ[(tempo_postIA / 60) × valor_hora × frequencia_mensal]
```

### INCREMENTO RECEITA
```javascript
delta_receita = revenue_after - revenue_before
```

### MELHORIA MARGEM
```javascript
delta_margem = margem_estimada - margem_atual
delta_margem_reais = (receita_estimada - custo_estimado) - (receita_atual - custo_atual)
economia_mensal = delta_margem_reais
economia_anual = economia_mensal × 12
```

### REDUÇÃO DE RISCO
```javascript
reducao_probabilidade = probabilidade_atual - probabilidade_com_ia
valor_risco_evitado = impacto_financeiro × reducao_probabilidade / 100
economia_mitigacao = custo_mitigacao_atual - custo_mitigacao_com_ia
beneficio_anual = valor_risco_evitado + economia_mitigacao
```

### QUALIDADE DECISÃO
```javascript
melhoria_taxa_acerto = taxa_acerto_com_ia - taxa_acerto_atual
economia_erros_evitados = (decisoes_per_periodo × melhoria_taxa_acerto / 100) × custo_medio_erro
economia_tempo = (tempo_medio_atual - tempo_medio_com_ia) × decisoes_per_periodo
valor_tempo_economizado = economia_tempo × valor_hora_medio
beneficio_total_mensal = economia_erros_evitados + valor_tempo_economizado
```

### VELOCIDADE
```javascript
reducao_tempo_entrega = ((tempo_atual - tempo_com_ia) / tempo_atual) × 100
aumento_capacidade = (entregas_per_periodo_com_ia - entregas_per_periodo_atual)
economia_atrasos = (atrasos_evitados × custo_por_atraso)
```

### SATISFAÇÃO
```javascript
delta_satisfacao = score_com_ia - score_atual
reducao_churn = churn_atual - churn_com_ia
valor_retencao = (clientes × reducao_churn / 100) × valor_medio_cliente
```

---

## ✅ Checklist de Implementação

- [ ] 1. Criar `indicatorCalculationService.js`
- [ ] 2. Implementar função `calculateAndSaveMetrics()`
- [ ] 3. Implementar cálculos para cada tipo:
  - [ ] PRODUTIVIDADE
  - [ ] INCREMENTO RECEITA
  - [ ] MELHORIA MARGEM
  - [ ] REDUÇÃO DE RISCO
  - [ ] QUALIDADE DECISÃO
  - [ ] VELOCIDADE
  - [ ] SATISFAÇÃO
  - [ ] CAPACIDADE ANALÍTICA
- [ ] 4. Integrar com `indicatorServiceSupabase._saveTypeSpecificData()`
- [ ] 5. Atualizar `Dashboard.jsx` para usar apenas dados calculados
- [ ] 6. Remover cálculos do `PostIATab.tsx` (ou manter apenas preview)
- [ ] 7. Testar recálculo quando dados mudam
- [ ] 8. Criar função de recálculo manual (para admin)
- [ ] 9. Documentar fórmulas no código

---

## 🚀 Benefícios

1. **Consistência:** Cálculos sempre baseados nos dados do banco
2. **Manutenibilidade:** Lógica centralizada em um único arquivo
3. **Performance:** Dashboard não precisa calcular, apenas ler
4. **Confiabilidade:** Cálculos independentes do frontend
5. **Escalabilidade:** Fácil adicionar novos tipos de indicadores

---

## ⚠️ Considerações

1. **Performance:** Cálculos podem ser pesados, considerar cache
2. **Sincronização:** Garantir que cálculos são executados após salvar dados
3. **Erros:** Tratar casos onde dados necessários não existem
4. **Validação:** Validar dados antes de calcular
5. **Logs:** Registrar erros de cálculo para debug

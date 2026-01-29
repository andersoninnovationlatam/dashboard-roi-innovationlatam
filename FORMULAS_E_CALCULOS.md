# Fórmulas e Cálculos - Dashboard ROI

## Documentação Técnica das Métricas e Fórmulas

Este documento descreve todas as fórmulas utilizadas no sistema de cálculo de ROI, incluindo justificativas matemáticas e exemplos práticos.

---

## 1. Multiplicadores de Período

### Justificativa dos Valores

Os multiplicadores convertem frequências de diferentes períodos para uma base mensal comum:

#### **Diário: ×30**
- **Justificativa**: Um mês tem aproximadamente 30 dias (média entre 28-31 dias)
- **Cálculo**: `quantidade × 30 = execuções por mês`
- **Exemplo**: 5 vezes/dia = 5 × 30 = 150 execuções/mês

#### **Semanal: ×4.33**
- **Justificativa**: Um ano tem 52 semanas e 12 meses
- **Cálculo**: `52 semanas ÷ 12 meses = 4.333... semanas/mês`
- **Exemplo**: 2 vezes/semana = 2 × 4.33 = 8.66 execuções/mês
- **Precisão**: Usamos 4.33 para manter consistência com padrões contábeis

#### **Mensal: ×1**
- **Justificativa**: Já está na base mensal
- **Cálculo**: `quantidade × 1 = quantidade`
- **Exemplo**: 10 vezes/mês = 10 × 1 = 10 execuções/mês

### Função de Cálculo

```javascript
calcularHorasPorMes(quantidade, periodo) {
  switch (periodo) {
    case 'Diário': return quantidade * 30
    case 'Semanal': return quantidade * 4.33
    case 'Mensal': return quantidade
  }
}
```

---

## 2. Indicador: PRODUTIVIDADE

### 2.1. Estrutura de Dados

```typescript
interface ProdutividadePerson {
  id: string
  nome: string
  cargo: string
  valorHora: number          // R$ por hora
  tempoGasto: number         // minutos por execução
  frequenciaReal: {
    quantidade: number       // quantas vezes
    periodo: 'Diário' | 'Semanal' | 'Mensal'
  }
  frequenciaDesejada: {
    quantidade: number
    periodo: 'Diário' | 'Semanal' | 'Mensal'
  }
}
```

### 2.2. Custo Total Baseline (Mensal)

**Fórmula:**
```
Custo Total Baseline = Σ(Valor Hora × (Tempo Gasto / 60) × Horas por Mês)
```

**Onde:**
- `Horas por Mês = calcularHorasPorMes(frequenciaReal.quantidade, frequenciaReal.periodo)`
- `Tempo Gasto / 60` converte minutos para horas

**Exemplo:**
- Pessoa: R$ 100/hora, 30 min/execução, 5 vezes/semana
- Horas por Mês: 5 × 4.33 = 21.65 execuções/mês
- Horas Totais: (30 / 60) × 21.65 = 10.825 horas/mês
- Custo: 100 × 10.825 = **R$ 1,082.50/mês**

### 2.3. Horas Economizadas (HH Antes vs HH Depois)

**Fórmula:**
```
HH Antes = (Tempo Gasto Baseline / 60) × Horas por Mês (frequência real)
HH Depois = (Tempo Gasto Pós-IA / 60) × Horas por Mês (frequência real)
HH Economizadas = HH Antes - HH Depois
```

**Exemplo:**
- Baseline: 30 min/execução, 5 vezes/semana
- Pós-IA: 15 min/execução, 5 vezes/semana
- Horas por Mês: 5 × 4.33 = 21.65 execuções/mês
- HH Antes: (30 / 60) × 21.65 = **10.825 horas/mês**
- HH Depois: (15 / 60) × 21.65 = **5.4125 horas/mês**
- HH Economizadas: 10.825 - 5.4125 = **5.4125 horas/mês**

### 2.4. Custo de Horas Economizadas

**Fórmula:**
```
Custo Antes = HH Antes × Valor Hora
Custo Depois = HH Depois × Valor Hora
Custo Economizado = Custo Antes - Custo Depois
```

**Exemplo:**
- HH Antes: 10.825 h/mês, Valor Hora: R$ 100
- HH Depois: 5.4125 h/mês, Valor Hora: R$ 100
- Custo Antes: 10.825 × 100 = **R$ 1,082.50/mês**
- Custo Depois: 5.4125 × 100 = **R$ 541.25/mês**
- Custo Economizado: 1,082.50 - 541.25 = **R$ 541.25/mês**

### 2.5. Delta Produtividade

**Fórmula:**
```
Delta Produtividade = (HH Antes - HH Depois) × Valor Hora
```

**Exemplo:**
- HH Antes: 10.825 h/mês
- HH Depois: 5.4125 h/mês
- Valor Hora: R$ 100
- Delta: (10.825 - 5.4125) × 100 = **R$ 541.25/mês**

### 2.6. Tempo Economizado (Frequência Desejada)

**Fórmula:**
```
HH Antes (Freq. Desejada) = (Tempo Gasto Baseline / 60) × Horas por Mês (freq. desejada)
HH Depois (Freq. Desejada) = (Tempo Gasto Pós-IA / 60) × Horas por Mês (freq. desejada)
HH Economizadas (Freq. Desejada) = HH Antes - HH Depois
```

**Exemplo:**
- Baseline: 30 min/execução, Frequência Desejada: 10 vezes/semana
- Pós-IA: 15 min/execução, Frequência Desejada: 10 vezes/semana
- Horas por Mês (Desejada): 10 × 4.33 = 43.3 execuções/mês
- HH Antes (Desejada): (30 / 60) × 43.3 = **21.65 horas/mês**
- HH Depois (Desejada): (15 / 60) × 43.3 = **10.825 horas/mês**
- HH Economizadas (Desejada): 21.65 - 10.825 = **10.825 horas/mês**

### 2.7. Custo Economizado (Frequência Desejada)

**Fórmula:**
```
Custo Economizado (Freq. Desejada) = (HH Antes - HH Depois) × Valor Hora
```

**Exemplo:**
- HH Antes (Desejada): 21.65 h/mês
- HH Depois (Desejada): 10.825 h/mês
- Valor Hora: R$ 100
- Custo Economizado: (21.65 - 10.825) × 100 = **R$ 1,082.50/mês**

---

## 3. Indicador: INCREMENTO RECEITA

### 3.1. Estrutura de Dados

```typescript
interface IncrementoReceitaBaseline {
  tipo: 'INCREMENTO RECEITA'
  valorReceitaAntes: number  // R$
}

interface PostIAIncrementoReceita {
  tipo: 'INCREMENTO RECEITA'
  valorReceitaDepois: number // R$
  deltaReceita: number        // Calculado
}
```

### 3.2. Delta Receita

**Fórmula:**
```
Delta Receita = Receita Depois - Receita Antes
```

**Exemplo:**
- Receita Antes: R$ 50,000/mês
- Receita Depois: R$ 65,000/mês
- Delta Receita: 65,000 - 50,000 = **R$ 15,000/mês**

---

## 4. Cálculos Gerais de ROI

### 4.1. Tempo Economizado Anual

**Fórmula:**
```
Tempo Economizado (horas/mês) = HH Antes - HH Depois
Tempo Economizado Anual (horas) = Tempo Economizado (horas/mês) × 12
```

### 4.2. Economia Bruta Anual

**Fórmula:**
```
Economia Bruta Anual = Tempo Economizado Anual (horas) × Custo Hora Médio
```

**Onde:**
- `Custo Hora Médio = média dos valores hora de todas as pessoas no baseline`

### 4.3. Custo Anual Recorrente da IA

**Fórmula:**
```
Custo Mensal Total = Custo Mensal Ferramentas + Custo Mensal Manutenção
Custo Anual Recorrente = Custo Mensal Total × 12
```

### 4.4. Economia Líquida Anual

**Fórmula:**
```
Economia Líquida Anual = Economia Bruta Anual - Custo Anual Recorrente
```

### 4.5. ROI Percentual (1º Ano)

**Fórmula:**
```
Investimento Total Ano 1 = Custo Implementação + Custo Anual Recorrente
ROI (%) = ((Economia Bruta Anual - Investimento Total Ano 1) / Investimento Total Ano 1) × 100
```

**Exemplo:**
- Economia Bruta Anual: R$ 120,000
- Custo Implementação: R$ 20,000
- Custo Anual Recorrente: R$ 12,000
- Investimento Total: 20,000 + 12,000 = R$ 32,000
- ROI: ((120,000 - 32,000) / 32,000) × 100 = **275%**

### 4.6. ROI Anos Seguintes (%)

**Fórmula:**
```
ROI Anos Seguintes (%) = ((Economia Bruta Anual - Custo Anual Recorrente) / Custo Anual Recorrente) × 100
```

### 4.7. Payback (Meses)

**Fórmula:**
```
Economia Líquida Mensal = Economia Líquida Anual / 12
Payback (meses) = Custo Implementação / Economia Líquida Mensal
```

**Exemplo:**
- Custo Implementação: R$ 20,000
- Economia Líquida Anual: R$ 108,000
- Economia Líquida Mensal: 108,000 / 12 = R$ 9,000/mês
- Payback: 20,000 / 9,000 = **2.22 meses**

### 4.8. Ganho de Produtividade (%)

**Fórmula:**
```
Ganho Produtividade (%) = ((Tempo Baseline - Tempo Pós-IA) / Tempo Baseline) × 100
```

### 4.9. Ganho de Capacidade (%)

**Fórmula:**
```
Ganho Capacidade (%) = ((Volume Pós-IA / Volume Baseline) - 1) × 100
```

### 4.10. Eficiência do Processo (%)

**Fórmula:**
```
Tempo Médio Baseline = Tempo Total Baseline (min) / Volume Baseline
Tempo Médio Pós-IA = Tempo Total Pós-IA (min) / Volume Pós-IA
Eficiência (%) = (1 - (Tempo Médio Pós-IA / Tempo Médio Baseline)) × 100
```

---

## 5. Validações e Regras

### 5.1. Validações Obrigatórias

1. **Divisão por Zero**: Todas as divisões devem verificar se o denominador é maior que zero
2. **Valores Negativos**: Tempos economizados e custos economizados não podem ser negativos (usar `Math.max(0, valor)`)
3. **Valores Nulos**: Converter `null`, `undefined` e strings vazias para `0`

### 5.2. Precisão Decimal

- **Moeda (R$)**: 2 casas decimais
- **Percentuais (%)**: 2 casas decimais
- **Horas**: 2 casas decimais
- **Meses**: 2 casas decimais

---

## 6. Exemplo Completo de Cálculo

### Cenário: Indicador de Produtividade

**Baseline:**
- Pessoa: João Silva, Analista
- Valor Hora: R$ 100
- Tempo Gasto: 30 minutos
- Frequência Real: 5 vezes/semana
- Frequência Desejada: 10 vezes/semana

**Pós-IA:**
- Tempo Gasto: 15 minutos (redução de 50%)
- Frequência Real: 5 vezes/semana (mantida)
- Valor Hora: R$ 100 (mantido)

**Cálculos:**

1. **Horas por Mês (Frequência Real)**: 5 × 4.33 = 21.65 execuções/mês
2. **HH Antes**: (30 / 60) × 21.65 = 10.825 horas/mês
3. **HH Depois**: (15 / 60) × 21.65 = 5.4125 horas/mês
4. **HH Economizadas**: 10.825 - 5.4125 = 5.4125 horas/mês
5. **Custo Economizado**: (10.825 - 5.4125) × 100 = R$ 541.25/mês
6. **Custo Economizado Anual**: 541.25 × 12 = R$ 6,495/ano

**Frequência Desejada:**
1. **Horas por Mês (Desejada)**: 10 × 4.33 = 43.3 execuções/mês
2. **HH Antes (Desejada)**: (30 / 60) × 43.3 = 21.65 horas/mês
3. **HH Depois (Desejada)**: (15 / 60) × 43.3 = 10.825 horas/mês
4. **HH Economizadas (Desejada)**: 21.65 - 10.825 = 10.825 horas/mês
5. **Custo Economizado (Desejada)**: (21.65 - 10.825) × 100 = R$ 1,082.50/mês
6. **Custo Economizado Anual (Desejada)**: 1,082.50 × 12 = R$ 12,990/ano

---

## 7. Referências

- **Multiplicador Semanal**: Baseado em 52 semanas/ano ÷ 12 meses = 4.333... semanas/mês
- **Multiplicador Diário**: Baseado em média de 30 dias/mês (padrão contábil)
- **Conversão Minutos para Horas**: 1 hora = 60 minutos, então `horas = minutos / 60`

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0

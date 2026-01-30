# BaselineForm

Componente de formulário para cadastro de Baseline de indicadores de ROI, baseado na aba 'Tracking Mensal' da planilha.

## Características

- ✅ Dropdown para seleção do Tipo de Indicador
- ✅ Renderização dinâmica de campos baseada no tipo selecionado
- ✅ Tooltips com HelpCircle (Lucide) mostrando descrição e métrica principal
- ✅ Listas dinâmicas para PRODUTIVIDADE e CUSTOS RELACIONADOS
- ✅ Cálculo automático de Custo Total Baseline
- ✅ Frequência Real vs Frequência Desejada (com diferenciação visual)
- ✅ React Hook Form para gerenciamento de estado
- ✅ Salva dados como JSONB no Supabase
- ✅ Design Tailwind CSS clean

## Tipos de Indicador Suportados

### 1. PRODUTIVIDADE
- Lista dinâmica de pessoas
- Campos por pessoa:
  - Nome
  - Cargo
  - Valor da Hora (R$)
  - Tempo Gasto (min)
  - **Frequência Real**: Quantidade + Período (Diário/Semanal/Mensal)
  - **Frequência Desejada**: Quantidade + Período
- Cálculo automático: `Custo Total Baseline = Σ(Pessoas × Valor Hora × Tempo × Frequência Real)`

### 2. INCREMENTO RECEITA
- Campo: Valor da Receita Antes (R$)

### 3. CUSTOS RELACIONADOS
- Lista dinâmica de ferramentas
- Campos por ferramenta:
  - Nome da Ferramenta
  - Custo Mensal (R$)
  - Outros Custos (R$)

### 4. OUTROS
- Nome do Indicador
- Valor do Indicador

## Uso

```tsx
import { BaselineForm } from './features/projects/BaselineForm'
import { indicatorServiceSupabase } from '../../services/indicatorServiceSupabase'
import { BaselineData } from './types/baseline'

function MyComponent() {
  const indicatorId = 'indicator-123'
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: BaselineData) => {
    setLoading(true)
    try {
      // Usar indicatorServiceSupabase para salvar dados normalizados
      const indicator = await indicatorServiceSupabase.getCompleteById(indicatorId)
      if (indicator) {
        // O serviço gerencia a conversão para estrutura normalizada
        await indicatorServiceSupabase.update(indicatorId, {
          // Dados serão convertidos automaticamente
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaselineForm
      value={existingBaseline}
      onChange={(data) => console.log('Dados alterados:', data)}
      onSubmit={handleSubmit}
    />
  )
}
```

## Estrutura de Dados (JSONB)

Os dados são salvos no campo `baseline_data` do tipo JSONB no Supabase:

```typescript
// PRODUTIVIDADE
{
  tipo: 'PRODUTIVIDADE',
  pessoas: [
    {
      id: string,
      nome: string,
      cargo: string,
      valorHora: number,
      tempoGasto: number,
      frequenciaReal: { quantidade: number, periodo: 'Diário' | 'Semanal' | 'Mensal' },
      frequenciaDesejada: { quantidade: number, periodo: 'Diário' | 'Semanal' | 'Mensal' }
    }
  ],
  custoTotalBaseline: number
}

// INCREMENTO RECEITA
{
  tipo: 'INCREMENTO RECEITA',
  valorReceitaAntes: number
}

// CUSTOS RELACIONADOS
{
  tipo: 'CUSTOS RELACIONADOS',
  ferramentas: [
    {
      id: string,
      nomeFerramenta: string,
      custoMensal: number,
      outrosCustos: number
    }
  ]
}

// OUTROS
{
  tipo: 'OUTROS',
  nomeIndicador: string,
  valorIndicador: number
}
```

## SQL para Criar Tabela no Supabase

```sql
-- Adicionar coluna baseline_data na tabela indicators (se não existir)
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS baseline_data JSONB;

-- Criar índice GIN para melhorar performance de consultas JSONB
CREATE INDEX IF NOT EXISTS idx_indicators_baseline_data 
ON indicators USING GIN (baseline_data);
```

## Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `value` | `BaselineData \| null` | Dados iniciais do baseline |
| `onChange` | `(data: BaselineData) => void` | Callback quando dados mudam |
| `onSubmit` | `(data: BaselineData) => Promise<void>` | Callback para submit (opcional) |
| `className` | `string` | Classes CSS adicionais |

## Dependências

- `react-hook-form` - Gerenciamento de formulários
- `zod` - Validação
- `lucide-react` - Ícones
- `@radix-ui/react-tooltip` - Tooltips acessíveis

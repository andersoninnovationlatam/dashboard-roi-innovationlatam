# IndicatorSelector

Componente para seleção de indicadores de ROI com categorias, nome e valor de baseline.

## Características

- ✅ Dropdown (Select) para escolher a Categoria do ROI
- ✅ Ícone HelpCircle (lucide-react) ao lado do label
- ✅ Tooltip (Radix UI) com descrição técnica ao passar o mouse
- ✅ Campos de input para "Nome do Indicador" e "Valor de Baseline"
- ✅ Estilização Tailwind: cards brancos, bordas cinza claro, estados de hover
- ✅ Suporte a dark mode
- ✅ Componente controlado (controlled component)

## Categorias Disponíveis

1. **Produtividade** - Redução de tempo em tarefas existentes
2. **Capacidade Analítica** - Aumento na capacidade de análise de dados
3. **Incremento Receita** - Aumento direto na receita
4. **Melhoria Margem** - Otimização de custos e processos
5. **Redução de Risco** - Prevenção de eventos negativos
6. **Qualidade Decisão** - Melhoria na qualidade das decisões
7. **Velocidade** - Redução no tempo de entrega
8. **Satisfação** - Aumento na satisfação de clientes/colaboradores

## Uso

```tsx
import { IndicatorSelector } from './features/projects/IndicatorSelector'
import { useState } from 'react'

function MyComponent() {
  const [indicatorData, setIndicatorData] = useState({
    category: '',
    name: '',
    baselineValue: '',
  })

  return (
    <IndicatorSelector
      value={indicatorData}
      onChange={setIndicatorData}
    />
  )
}
```

## Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `value` | `{ category: string, name: string, baselineValue: string }` | Valores atuais do formulário |
| `onChange` | `(value) => void` | Callback chamado quando qualquer campo muda |
| `className` | `string` | Classes CSS adicionais para o container |

## Estilização

O componente usa:
- Cards brancos (`bg-white`) com dark mode (`dark:bg-slate-800`)
- Bordas cinza claro (`border-slate-200`) com hover (`hover:shadow-md`)
- Transições suaves em todos os elementos
- Focus states com ring indigo para acessibilidade

## Dependências

- `lucide-react` - Ícones
- `@radix-ui/react-tooltip` - Tooltip acessível

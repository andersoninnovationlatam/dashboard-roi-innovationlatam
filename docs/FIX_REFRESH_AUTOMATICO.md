# Correção: Remoção do Refresh Automático e Correção do Reset de Abas

## Problema Identificado

1. **Refresh automático a cada 60 segundos** no `DataContext` causando re-renders desnecessários
2. **Reset automático da aba** no formulário de indicadores - ao acessar um indicador, a tela atualizava e voltava para a aba "Info"
3. **Perda de estado** durante edição devido aos re-renders constantes

## Causa Raiz

- O `setInterval` no `DataContext` chamava `loadData()` a cada 60 segundos
- Quando `loadData()` executava, atualizava o estado (`setProjects`, `setIndicators`)
- Isso causava re-render de todos os componentes que usavam `useData()`
- O componente `IndicatorForm` re-renderizava
- O componente `Tabs` era recriado e voltava para `defaultTab = 0` (aba Info)

## Soluções Aplicadas

### 1. Removido Refresh Automático no `DataContext.jsx`

**Antes:**
```javascript
// OTIMIZAÇÃO: Revalida a cada 60 segundos
const intervalId = setInterval(() => {
  if (document.visibilityState === 'visible') {
    loadData()
  }
}, 60000) // 60 segundos

return () => {
  clearInterval(intervalId)
}
```

**Depois:**
```javascript
// REMOVIDO: Refresh automático não é mais necessário
// Com dados normalizados nas colunas, não há necessidade de polling constante
// Se precisar de atualizações em tempo real, usar Supabase Realtime subscriptions
// O refresh automático causava re-renders desnecessários que resetavam o estado dos formulários
```

**Por que remover?**
- ✅ Dados agora estão normalizados em colunas específicas
- ✅ Não há necessidade de polling constante
- ✅ Evita re-renders desnecessários
- ✅ Melhora performance
- ✅ Se precisar de atualizações em tempo real, usar Supabase Realtime subscriptions

### 2. Corrigido Componente `Tabs.jsx` para Manter Estado

**Antes:**
```javascript
const Tabs = ({ tabs, defaultTab = 0, children, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  // Problema: sempre resetava para defaultTab em re-renders
}
```

**Depois:**
```javascript
const Tabs = ({ tabs, defaultTab = 0, children, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const isInitialMount = useRef(true)
  const lastDefaultTab = useRef(defaultTab)

  // Atualizar quando defaultTab mudar externamente (mas não resetar em re-renders)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastDefaultTab.current = defaultTab
      return
    }
    
    // Só atualiza se defaultTab realmente mudou (não é apenas um re-render)
    if (defaultTab !== lastDefaultTab.current) {
      setActiveTab(defaultTab)
      lastDefaultTab.current = defaultTab
    }
  }, [defaultTab])

  const handleTabChange = (index) => {
    setActiveTab(index)
    lastDefaultTab.current = index
    if (onChange) {
      onChange(index)
    }
  }
}
```

**Melhorias:**
- ✅ Usa `useRef` para rastrear mudanças reais de `defaultTab`
- ✅ Não reseta a aba em re-renders do componente
- ✅ Mantém o estado da aba mesmo quando o componente re-renderiza
- ✅ Só atualiza quando `defaultTab` realmente muda

### 3. Adicionado Controle de Aba no `IndicatorForm.jsx`

**Adicionado:**
```javascript
const [activeTab, setActiveTab] = useState(0) // Estado para controlar qual aba está ativa

// Passar para o componente Tabs
<Tabs 
  tabs={tabs} 
  defaultTab={activeTab}
  onChange={(index) => setActiveTab(index)}
>
```

**Benefícios:**
- ✅ Estado da aba controlado pelo componente pai
- ✅ Não perde a aba ativa em re-renders
- ✅ Permite controle programático da aba se necessário

## Resultados Esperados

1. ✅ **Sem refresh automático** - A tela não atualiza sozinha a cada 60 segundos
2. ✅ **Aba mantém estado** - Ao acessar um indicador, a aba permanece na que você estava
3. ✅ **Melhor performance** - Menos re-renders desnecessários
4. ✅ **Melhor UX** - Não perde o contexto durante a edição

## Quando Usar Refresh Automático?

Se no futuro precisar de atualizações em tempo real, use **Supabase Realtime subscriptions**:

```javascript
// Exemplo de como implementar se necessário:
useEffect(() => {
  if (!user?.id) return

  const channel = supabase
    .channel('indicators-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'indicators_normalized' },
      (payload) => {
        // Atualizar apenas os dados específicos que mudaram
        loadData()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user?.id])
```

## Arquivos Modificados

1. `contexts/DataContext.jsx` - Removido `setInterval` de refresh automático
2. `components/common/Tabs.jsx` - Adicionado lógica para manter estado em re-renders
3. `pages/indicators/IndicatorForm.jsx` - Adicionado controle de estado da aba

## Testes Recomendados

1. ✅ Acessar um indicador e mudar para aba "Baseline" ou "Pós-IA"
2. ✅ Aguardar alguns segundos - a aba deve permanecer na mesma
3. ✅ Preencher dados em qualquer aba - não deve perder ao digitar
4. ✅ Verificar que não há mais refresh automático no console

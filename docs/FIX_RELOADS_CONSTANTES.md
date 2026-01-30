# Correção: Reloads Constantes e Timeouts Repetidos

## Problema Identificado

A plataforma estava apresentando:
1. **Reloads constantes** causando perda de dados ao digitar
2. **Timeouts repetidos** no console: `userServiceSupabase.js:114 Erro ao buscar usuário: Error: Timeout: query demorou mais de 5 segundos`
3. **Re-renders desnecessários** causando recarregamento de dados

## Causas Raiz Identificadas

### 1. `authServiceSupabase.onAuthStateChange()` chamando `getById()` em TODOS os eventos
- **Problema**: O método chamava `userServiceSupabase.getById()` em TODOS os eventos de auth, incluindo `TOKEN_REFRESHED` que ocorre frequentemente (a cada renovação de token)
- **Impacto**: Causava timeouts repetidos e chamadas desnecessárias ao banco

### 2. `DataContext.loadData` dependendo do objeto `user` inteiro
- **Problema**: `useCallback` tinha `user` como dependência, então qualquer mudança no objeto recriava `loadData`
- **Impacto**: `useEffect` que depende de `loadData` executava novamente, causando reload constante

### 3. `AuthContext` atualizando estado em `TOKEN_REFRESHED` e `INITIAL_SESSION` desnecessariamente
- **Problema**: Eventos `TOKEN_REFRESHED` e `INITIAL_SESSION` causavam `setUser()` mesmo quando o usuário não mudou
- **Impacto**: Re-renders em cascata que disparavam `loadData()` novamente

## Correções Aplicadas

### 1. `authServiceSupabase.js` - Linha 348-377
```javascript
// ANTES: Chamava getById() em TODOS os eventos
if (session?.user) {
  const userRecord = await userServiceSupabase.getById(session.user.id)
  // ...
}

// DEPOIS: Ignora TOKEN_REFRESHED completamente
if (event === 'TOKEN_REFRESHED') {
  // Retorna dados básicos SEM chamar getById()
  callback(userData, event)
  return
}
```

**Resultado**: `getById()` não é mais chamado em `TOKEN_REFRESHED`, eliminando timeouts repetidos.

### 2. `DataContext.jsx` - Linha 90
```javascript
// ANTES: Dependência do objeto user inteiro
}, [user, logout])

// DEPOIS: Dependência apenas de user?.id e user?.organization_id
}, [user?.id, user?.organization_id, logout])
```

**Resultado**: `loadData` só é recriado quando `user.id` ou `organization_id` realmente mudam, não em qualquer atualização do objeto `user`.

### 3. `AuthContext.jsx` - Linhas 108-165
```javascript
// ANTES: Atualizava em INITIAL_SESSION sempre
if (event === 'INITIAL_SESSION') {
  if (newUser) {
    setUser(newUser) // Sempre atualizava
  }
}

// DEPOIS: Só atualiza se ID mudou
if (event === 'INITIAL_SESSION') {
  if (newUser && newUser.id !== userRef.current?.id) {
    setUser(newUser)
  }
  return
}
```

```javascript
// ANTES: Tentava atualizar em TOKEN_REFRESHED
} else if (event === 'TOKEN_REFRESHED') {
  if (newUser?.id !== user?.id) {
    setUser(newUser)
  }
}

// DEPOIS: Ignora completamente
} else if (event === 'TOKEN_REFRESHED') {
  return // Não atualiza estado - apenas token mudou
}
```

```javascript
// ANTES: Atualizava sempre em USER_UPDATED
} else if (event === 'USER_UPDATED') {
  setUser(newUser)
}

// DEPOIS: Compara campos relevantes antes de atualizar
} else if (event === 'USER_UPDATED') {
  if (newUser && newUser.id === userRef.current?.id) {
    const currentUser = userRef.current
    // Só atualiza se campos relevantes mudaram
    if (newUser.email !== currentUser?.email || 
        newUser.organization_id !== currentUser?.organization_id ||
        newUser.role !== currentUser?.role) {
      setUser(newUser)
    }
  } else {
    setUser(newUser)
  }
}
```

**Resultado**: Re-renders desnecessários eliminados, `loadData()` não é mais disparado por eventos de auth que não alteram dados relevantes.

## Resultados Esperados

✅ **Timeouts eliminados**: `getById()` não é mais chamado em `TOKEN_REFRESHED`
✅ **Reloads eliminados**: `loadData` só muda quando `user.id` realmente muda
✅ **Dados preservados**: Formulários não perdem dados ao digitar
✅ **Performance melhorada**: Menos chamadas ao banco e menos re-renders

## Testes Recomendados

1. ✅ Login na plataforma - deve funcionar normalmente
2. ✅ Atualizar página (F5) - não deve causar reloads constantes
3. ✅ Digitar em formulários - dados não devem ser perdidos
4. ✅ Verificar console - não deve haver timeouts repetidos
5. ✅ Aguardar renovação de token - não deve causar reloads

## Data da Correção

2025-01-XX

## Arquivos Modificados

- `dash-roi-v2/services/authServiceSupabase.js`
- `dash-roi-v2/contexts/DataContext.jsx`
- `dash-roi-v2/contexts/AuthContext.jsx`

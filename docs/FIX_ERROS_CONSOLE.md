# Correção: Erros no Console do Navegador

## Problemas Identificados

### 1. Erros `ERR_CONNECTION_REFUSED` (Múltiplos)
**Erro:**
```
POST http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1 net::ERR_CONNECTION_REFUSED
```

**Causa:**
- Código de debug/logging tentando enviar dados para um servidor local (`http://127.0.0.1:7242/ingest/...`)
- O servidor não está rodando, então todas essas requisições falham
- Esses logs estavam espalhados em vários arquivos:
  - `services/userServiceSupabase.js`
  - `services/authServiceSupabase.js`
  - `contexts/AuthContext.jsx`
  - `pages/auth/Login.jsx`
  - `utils/debugLogger.js`

**Solução:**
1. ✅ Desabilitado `DEBUG_LOGS_ENABLED` em `utils/debugLogger.js` (mudado de `import.meta.env.DEV || false` para `false`)
2. ✅ Removidos todos os blocos de debug inline (`#region agent log ... #endregion`) dos arquivos principais usando script Python
3. ✅ O utilitário `debugLogger.js` ainda existe mas não executa mais (flag desabilitada)

### 2. Erro 406 em `indicator_type_specific_data`
**Erro:**
```
GET https://npdgtwcnjfmdkrqgcmqj.supabase.co/rest/v1/indicator_type_specific_data?select=*&indicator_id=eq.b7ae5db9-702f-4fea-b164-35d5f15367b3 406 (Not Acceptable)
```

**Causa:**
- Uso de `.single()` quando pode não haver registro na tabela
- `.single()` retorna erro quando não encontra registro (código `PGRST116`)
- Erro 406 pode ocorrer quando RLS bloqueia ou quando não há registro

**Solução:**
- ✅ Alterado de `.single()` para `.maybeSingle()` em `indicatorServiceSupabase.js`
- ✅ `.maybeSingle()` retorna `null` quando não há registro (ao invés de erro)
- ✅ Adicionado tratamento para códigos de erro específicos (`PGRST116` e `PGRST301`)

**Código Antes:**
```javascript
supabase.from('indicator_type_specific_data').select('*').eq('indicator_id', id).single().then(({ data, error }) => {
  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar dados específicos:', error)
  }
  return data || null
})
```

**Código Depois:**
```javascript
supabase.from('indicator_type_specific_data').select('*').eq('indicator_id', id).maybeSingle().then(({ data, error }) => {
  // maybeSingle() retorna null quando não há registro (ao invés de erro)
  // Trata erros 406 (Not Acceptable) que podem ocorrer com RLS
  if (error && error.code !== 'PGRST116' && error.code !== 'PGRST301') {
    // PGRST116 = nenhum registro encontrado (ok com maybeSingle)
    // PGRST301 = múltiplos registros (não deveria acontecer, mas trata)
    console.error('Erro ao buscar dados específicos:', error)
  }
  return data || null
})
```

## Arquivos Modificados

1. ✅ `utils/debugLogger.js` - Desabilitado `DEBUG_LOGS_ENABLED`
2. ✅ `services/userServiceSupabase.js` - Removidos blocos de debug inline
3. ✅ `services/authServiceSupabase.js` - Removidos blocos de debug inline
4. ✅ `contexts/AuthContext.jsx` - Removidos blocos de debug inline
5. ✅ `pages/auth/Login.jsx` - Removidos blocos de debug inline
6. ✅ `services/indicatorServiceSupabase.js` - Alterado `.single()` para `.maybeSingle()`

## Resultados Esperados

1. ✅ **Sem erros `ERR_CONNECTION_REFUSED`** - Console limpo de erros de conexão
2. ✅ **Sem erro 406** - Query funciona corretamente mesmo quando não há registro
3. ✅ **Melhor performance** - Menos requisições HTTP desnecessárias
4. ✅ **Console mais limpo** - Apenas erros reais aparecem

## Notas

- O arquivo `utils/debugLogger.js` ainda existe mas não executa mais (flag desabilitada)
- Se no futuro precisar reativar os logs de debug, basta mudar `DEBUG_LOGS_ENABLED` para `true` e garantir que o servidor de debug esteja rodando
- A mudança de `.single()` para `.maybeSingle()` é mais apropriada quando o registro pode não existir

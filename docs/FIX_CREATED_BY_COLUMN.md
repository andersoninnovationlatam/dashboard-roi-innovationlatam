# 🔧 Fix: Adicionar coluna `created_by` à tabela `projects`

## 🐛 Problema

Ao criar um novo projeto, ocorre o erro:
```
POST https://npdgtwcnjfmdkrqgcmqj.supabase.co/rest/v1/projects?select=* 400 (Bad Request)
Erro ao criar projeto: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'created_by' column of 'projects' in the schema cache"}
```

## ✅ Solução

A coluna `created_by` não existe na tabela `projects`. É necessário adicioná-la.

## 📋 Instruções para Executar a Migration

### Opção 1: Executar Migration 006 (Recomendado)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Cole o seguinte SQL:

```sql
-- ============================================================================
-- MIGRATION: Adicionar coluna created_by à tabela projects
-- ============================================================================

-- Adicionar created_by se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES users(id);
    
    -- Criar índice para melhorar performance
    CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
  END IF;
END $$;
```

6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso

### Opção 2: Executar via Arquivo

1. Abra o arquivo: `dash-roi-v2/migrations/006_add_created_by_to_projects.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute

## ✅ Verificação

Após executar a migration, verifique se a coluna foi criada:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'created_by';
```

Deve retornar:
```
column_name | data_type
------------|----------
created_by  | uuid
```

## 🎯 Próximos Passos

Após executar a migration:
1. Recarregue a aplicação no navegador
2. Tente criar um novo projeto novamente
3. O erro não deve mais ocorrer

## 📝 Nota

A migration 001 foi atualizada para incluir esta coluna automaticamente em novas instalações. Esta migration 006 é necessária apenas para bancos que já foram migrados antes desta correção.

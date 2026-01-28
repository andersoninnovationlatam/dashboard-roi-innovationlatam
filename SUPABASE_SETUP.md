# Configuração do Supabase

## 1. Criar a tabela `projects`

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Criar tabela projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar performance de consultas por usuário
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários só podem ver seus próprios projetos
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Política RLS: Usuários só podem criar projetos para si mesmos
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política RLS: Usuários só podem atualizar seus próprios projetos
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política RLS: Usuários só podem deletar seus próprios projetos
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

Você pode encontrar essas informações em:
- Supabase Dashboard → Settings → API
- `URL` = Project URL
- `anon key` = Project API keys → anon/public

## 3. Atualizar AuthContext para usar Supabase

O `AuthContext` atual usa localStorage. Para usar Supabase Auth, você precisará atualizar o `contexts/AuthContext.jsx` para usar `supabase.auth`.

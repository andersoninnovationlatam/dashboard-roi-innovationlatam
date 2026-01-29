# Configuração do Campo de Tema na Tabela `profiles`

## SQL para Adicionar Campo `theme_preference`

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Adicionar coluna theme_preference na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'dark' 
CHECK (theme_preference IN ('dark', 'light'));

-- Criar índice (opcional, para melhor performance)
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON profiles(theme_preference);

-- Atualizar registros existentes para ter 'dark' como padrão
UPDATE profiles 
SET theme_preference = 'dark' 
WHERE theme_preference IS NULL;
```

## Estrutura da Coluna

- **Nome**: `theme_preference`
- **Tipo**: `VARCHAR(10)`
- **Valores permitidos**: `'dark'` ou `'light'`
- **Padrão**: `'dark'`
- **Nullable**: Não (sempre terá um valor)

## Comportamento

1. **Ao fazer login**: O sistema carrega o tema salvo do perfil do usuário
2. **Ao trocar tema**: O tema é salvo automaticamente no perfil do usuário
3. **Sem login**: Usa preferência do navegador ou 'dark' como padrão
4. **Primeira vez**: Usuários novos terão 'dark' como padrão

## Notas

- O tema é salvo automaticamente quando o usuário clica no botão de troca de tema
- Se houver erro ao salvar, o tema ainda será aplicado localmente, mas não será persistido
- O sistema sempre inicia com tema 'dark' para evitar flash de conteúdo

# Guia de Migração - Plataforma de ROI

## Visão Geral

Este guia detalha o processo de migração da estrutura JSONB para a estrutura normalizada completa conforme especificação técnica.

## Pré-requisitos

1. Backup completo do banco de dados atual
2. Acesso ao SQL Editor do Supabase
3. Ambiente de desenvolvimento configurado
4. Variáveis de ambiente configuradas (`.env`)

## Passo a Passo

### 1. Backup do Banco de Dados

**IMPORTANTE**: Sempre faça backup antes de executar migrações!

No Supabase Dashboard:
1. Vá em **Database** → **Backups**
2. Crie um backup manual ou aguarde backup automático
3. Anote a data/hora do backup

### 2. Executar Migrações SQL

Execute os scripts na ordem exata:

#### 2.1. Criar Schema Normalizado
```sql
-- Execute: migrations/001_create_normalized_schema.sql
```
Este script cria:
- Todos os ENUMs necessários
- Tabela `organizations`
- Tabela `users` (vinculada a organizations)
- Atualiza tabela `projects` com novos campos
- Cria tabela `indicators_normalized`
- Cria tabelas auxiliares (persons_involved, tools_costs, etc.)
- Cria índices e triggers

#### 2.2. Migrar Dados Existentes
```sql
-- Execute: migrations/002_migrate_existing_data.sql
```
Este script:
- Cria organização padrão
- Migra usuários para nova estrutura
- Migra projetos existentes
- Extrai dados de JSONB e popula tabelas normalizadas

#### 2.3. Configurar RLS
```sql
-- Execute: migrations/003_setup_rls.sql
```
Este script configura todas as políticas de segurança.

#### 2.4. Validação (Produção)
```sql
-- Execute: migrations/004_migrate_production_data.sql
```
Este script valida a migração e cria backups.

### 3. Validar Migração

Execute o script de validação:

```bash
node scripts/validate_migration.js
```

O script irá:
- Comparar contagens de registros
- Validar integridade referencial
- Gerar relatório completo

### 4. Atualizar Código da Aplicação

O código já foi atualizado para usar a nova estrutura. Certifique-se de:

1. **Variáveis de Ambiente**: Verificar `.env`
2. **Dependências**: Executar `npm install` se necessário
3. **Build**: Testar build da aplicação

### 5. Testar Funcionalidades

Teste as seguintes funcionalidades:

- [ ] Login/Registro de usuários
- [ ] Criação de projetos
- [ ] Criação de indicadores
- [ ] Cálculo de ROI
- [ ] Visualização de dashboards
- [ ] Tracking mensal
- [ ] Exportação de relatórios

## Troubleshooting

### Erro: "Tabela já existe"
Se uma tabela já existe, o script usa `CREATE TABLE IF NOT EXISTS` e não deve causar erro. Se houver conflito, verifique se há dados na tabela antes de continuar.

### Erro: "ENUM já existe"
Os scripts removem ENUMs antes de criar. Se houver erro, execute manualmente:
```sql
DROP TYPE IF EXISTS nome_enum CASCADE;
```

### Dados não migrados
Verifique:
1. Se os dados JSONB estão no formato esperado
2. Se há erros no console do SQL Editor
3. Execute o script de validação para identificar problemas

### RLS bloqueando acesso
Verifique:
1. Se o usuário está autenticado
2. Se o usuário tem `organization_id` definido
3. Se as políticas RLS foram criadas corretamente

## Rollback

Se precisar reverter a migração:

1. **Restaurar Backup**: Use o backup criado antes da migração
2. **Remover Tabelas Novas**: Execute:
```sql
DROP TABLE IF EXISTS indicators_normalized CASCADE;
DROP TABLE IF EXISTS persons_involved CASCADE;
DROP TABLE IF EXISTS tools_costs CASCADE;
DROP TABLE IF EXISTS custom_metrics CASCADE;
DROP TABLE IF EXISTS calculated_results CASCADE;
DROP TABLE IF EXISTS tracking_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

3. **Remover Colunas Adicionadas**:
```sql
ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;
ALTER TABLE projects DROP COLUMN IF EXISTS status;
-- ... (outras colunas)
```

## Checklist Pós-Migração

- [ ] Backup criado
- [ ] Migrações executadas sem erros
- [ ] Validação passou sem erros
- [ ] Usuários podem fazer login
- [ ] Projetos podem ser criados/editados
- [ ] Indicadores podem ser criados/editados
- [ ] Cálculos de ROI funcionam corretamente
- [ ] Dashboards exibem dados corretos
- [ ] RLS está funcionando (testar com diferentes usuários/roles)
- [ ] Tracking mensal funciona
- [ ] Exportação funciona

## Suporte

Em caso de problemas:
1. Verifique os logs do Supabase
2. Execute o script de validação
3. Revise os erros no console do navegador
4. Consulte a documentação da especificação técnica

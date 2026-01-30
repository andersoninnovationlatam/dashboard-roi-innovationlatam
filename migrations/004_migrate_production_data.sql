-- ============================================================================
-- MIGRAÇÃO 004: Migração de Dados em Produção
-- Script seguro para migração em ambiente de produção
-- ============================================================================

-- IMPORTANTE: Execute este script em ambiente de produção com cuidado
-- Recomenda-se fazer backup completo antes de executar

-- ============================================================================
-- PASSO 1: Criar tabela de backup para rollback
-- ============================================================================

-- Criar tabela de backup dos indicadores antigos
CREATE TABLE IF NOT EXISTS indicators_backup AS
SELECT * FROM indicators;

-- Criar tabela de backup dos projetos antigos
CREATE TABLE IF NOT EXISTS projects_backup AS
SELECT * FROM projects;

-- ============================================================================
-- PASSO 2: Validar dados antes de migração
-- ============================================================================

DO $$
DECLARE
  projects_count INTEGER;
  indicators_count INTEGER;
  users_count INTEGER;
BEGIN
  -- Contar registros existentes
  SELECT COUNT(*) INTO projects_count FROM projects;
  SELECT COUNT(*) INTO indicators_count FROM indicators;
  SELECT COUNT(*) INTO users_count FROM auth.users;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO PRÉ-MIGRAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Projetos encontrados: %', projects_count;
  RAISE NOTICE 'Indicadores encontrados: %', indicators_count;
  RAISE NOTICE 'Usuários encontrados: %', users_count;
  RAISE NOTICE '========================================';

  -- Validar que há dados para migrar
  IF projects_count = 0 AND indicators_count = 0 THEN
    RAISE WARNING 'Nenhum dado encontrado para migração';
  END IF;
END $$;

-- ============================================================================
-- PASSO 3: Executar migração (chama script 002)
-- ============================================================================

-- Nota: O script 002_migrate_existing_data.sql já contém toda a lógica de migração
-- Este script apenas adiciona validações e segurança adicional

-- ============================================================================
-- PASSO 4: Validação pós-migração
-- ============================================================================

DO $$
DECLARE
  projects_count INTEGER;
  indicators_normalized_count INTEGER;
  persons_count INTEGER;
  tools_count INTEGER;
  organizations_count INTEGER;
  users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO projects_count FROM projects;
  SELECT COUNT(*) INTO indicators_normalized_count FROM indicators_normalized;
  SELECT COUNT(*) INTO persons_count FROM persons_involved;
  SELECT COUNT(*) INTO tools_count FROM tools_costs;
  SELECT COUNT(*) INTO organizations_count FROM organizations;
  SELECT COUNT(*) INTO users_count FROM users;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO PÓS-MIGRAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizações criadas: %', organizations_count;
  RAISE NOTICE 'Usuários migrados: %', users_count;
  RAISE NOTICE 'Projetos migrados: %', projects_count;
  RAISE NOTICE 'Indicadores normalizados: %', indicators_normalized_count;
  RAISE NOTICE 'Pessoas envolvidas: %', persons_count;
  RAISE NOTICE 'Ferramentas/Custos: %', tools_count;
  RAISE NOTICE '========================================';

  -- Validar integridade
  IF organizations_count = 0 THEN
    RAISE EXCEPTION 'ERRO: Nenhuma organização foi criada';
  END IF;

  IF users_count = 0 THEN
    RAISE EXCEPTION 'ERRO: Nenhum usuário foi migrado';
  END IF;
END $$;

-- ============================================================================
-- PASSO 5: Verificar integridade referencial
-- ============================================================================

DO $$
DECLARE
  orphan_indicators INTEGER;
  orphan_projects INTEGER;
BEGIN
  -- Verificar indicadores sem projeto válido
  SELECT COUNT(*) INTO orphan_indicators
  FROM indicators_normalized i
  WHERE NOT EXISTS (
    SELECT 1 FROM projects p WHERE p.id = i.project_id
  );

  -- Verificar projetos sem organização válida
  SELECT COUNT(*) INTO orphan_projects
  FROM projects p
  WHERE p.organization_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = p.organization_id
  );

  IF orphan_indicators > 0 THEN
    RAISE WARNING 'Encontrados % indicadores órfãos (sem projeto válido)', orphan_indicators;
  END IF;

  IF orphan_projects > 0 THEN
    RAISE WARNING 'Encontrados % projetos órfãos (sem organização válida)', orphan_projects;
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK (caso necessário)
-- ============================================================================

-- Para fazer rollback, execute:
-- DROP TABLE IF EXISTS indicators_normalized CASCADE;
-- DROP TABLE IF EXISTS persons_involved CASCADE;
-- DROP TABLE IF EXISTS tools_costs CASCADE;
-- DROP TABLE IF EXISTS custom_metrics CASCADE;
-- DROP TABLE IF EXISTS calculated_results CASCADE;
-- DROP TABLE IF EXISTS tracking_history CASCADE;
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;
-- ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE projects DROP COLUMN IF EXISTS status;
-- ALTER TABLE projects DROP COLUMN IF EXISTS development_type;
-- ALTER TABLE projects DROP COLUMN IF EXISTS start_date;
-- ALTER TABLE projects DROP COLUMN IF EXISTS go_live_date;
-- ALTER TABLE projects DROP COLUMN IF EXISTS end_date;
-- ALTER TABLE projects DROP COLUMN IF EXISTS implementation_cost;
-- ALTER TABLE projects DROP COLUMN IF EXISTS monthly_maintenance_cost;
-- ALTER TABLE projects DROP COLUMN IF EXISTS business_area;
-- ALTER TABLE projects DROP COLUMN IF EXISTS sponsor;
-- ALTER TABLE projects DROP COLUMN IF EXISTS created_by;

-- ============================================================================
-- MIGRAÇÃO 005: Limpeza de Tabelas Legadas
-- Remove tabelas não utilizadas após migração bem-sucedida
-- ============================================================================

-- ============================================================================
-- PASSO 1: Remover project_indicators (não utilizada, 0 registros)
-- ============================================================================

-- Verificar se a tabela existe e está vazia antes de remover
DO $$
DECLARE
  table_exists BOOLEAN;
  row_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_indicators'
  ) INTO table_exists;

  IF table_exists THEN
    SELECT COUNT(*) INTO row_count FROM project_indicators;
    
    IF row_count = 0 THEN
      RAISE NOTICE 'Removendo tabela project_indicators (vazia, não utilizada)';
      DROP TABLE IF EXISTS project_indicators CASCADE;
      RAISE NOTICE 'Tabela project_indicators removida com sucesso';
    ELSE
      RAISE WARNING 'Tabela project_indicators contém % registros. Não será removida automaticamente.', row_count;
    END IF;
  ELSE
    RAISE NOTICE 'Tabela project_indicators não existe. Pulando remoção.';
  END IF;
END $$;

-- ============================================================================
-- PASSO 2: Marcar tabela indicators como DEPRECATED (não remover ainda)
-- ============================================================================

-- Adicionar comentário indicando que a tabela está deprecated
COMMENT ON TABLE indicators IS 'DEPRECATED: Esta tabela foi substituída por indicators_normalized. Mantida temporariamente para rollback. Será removida após validação completa.';

-- ============================================================================
-- PASSO 3: Validação Final
-- ============================================================================

DO $$
DECLARE
  indicators_old_count INTEGER;
  indicators_new_count INTEGER;
  persons_count INTEGER;
  tools_count INTEGER;
BEGIN
  -- Contar registros nas tabelas
  SELECT COUNT(*) INTO indicators_old_count FROM indicators;
  SELECT COUNT(*) INTO indicators_new_count FROM indicators_normalized;
  SELECT COUNT(*) INTO persons_count FROM persons_involved;
  SELECT COUNT(*) INTO tools_count FROM tools_costs;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO PÓS-LIMPEZA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Indicadores (antigos - deprecated): %', indicators_old_count;
  RAISE NOTICE 'Indicadores (normalizados): %', indicators_new_count;
  RAISE NOTICE 'Pessoas envolvidas: %', persons_count;
  RAISE NOTICE 'Ferramentas/Custos: %', tools_count;
  RAISE NOTICE '========================================';
  
  IF indicators_new_count < indicators_old_count THEN
    RAISE WARNING 'ATENÇÃO: Há mais indicadores na tabela antiga do que na nova!';
  END IF;
END $$;

-- ============================================================================
-- NOTA: Para remover completamente a tabela indicators no futuro:
-- ============================================================================
/*
-- Execute APENAS após:
-- 1. Validar que todos os dados foram migrados
-- 2. Confirmar que nenhum código usa a tabela antiga
-- 3. Fazer backup completo do banco
-- 4. Testar aplicação completamente

-- Script de remoção completa (NÃO EXECUTAR AINDA):
-- ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_project_id_fkey;
-- ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_user_id_fkey;
-- DROP TABLE IF EXISTS indicators CASCADE;
*/

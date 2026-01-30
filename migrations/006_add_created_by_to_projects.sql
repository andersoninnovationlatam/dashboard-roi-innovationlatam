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

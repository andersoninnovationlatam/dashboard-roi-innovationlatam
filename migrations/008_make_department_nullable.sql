-- ============================================================================
-- MIGRATION: Tornar department nullable na tabela projects
-- ============================================================================

-- Tornar department nullable (se ainda não for)
DO $$
BEGIN
  -- Verificar se department existe e é NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'department'
    AND is_nullable = 'NO'
  ) THEN
    -- Preencher department com business_area se department for NULL
    UPDATE projects 
    SET department = business_area 
    WHERE department IS NULL AND business_area IS NOT NULL;
    
    -- Preencher com valor padrão se ainda for NULL
    UPDATE projects 
    SET department = 'Geral' 
    WHERE department IS NULL;
    
    -- Tornar nullable
    ALTER TABLE projects ALTER COLUMN department DROP NOT NULL;
  END IF;
END $$;

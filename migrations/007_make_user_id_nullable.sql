-- ============================================================================
-- MIGRATION: Tornar user_id nullable e usar created_by como principal
-- ============================================================================

-- Tornar user_id nullable (se ainda não for)
DO $$
BEGIN
  -- Verificar se user_id existe e é NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    -- Tornar nullable
    ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;
    
    -- Preencher user_id com created_by se user_id for NULL
    UPDATE projects 
    SET user_id = created_by 
    WHERE user_id IS NULL AND created_by IS NOT NULL;
  END IF;
END $$;

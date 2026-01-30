-- ============================================================================
-- MIGRAÇÃO 013: Adicionar coluna delta_produtividade
-- ============================================================================

-- Adicionar coluna para delta_produtividade na tabela indicator_type_specific_data
ALTER TABLE indicator_type_specific_data
ADD COLUMN IF NOT EXISTS delta_produtividade DECIMAL(15,2);

-- Comentário
COMMENT ON COLUMN indicator_type_specific_data.delta_produtividade IS 'Delta de produtividade em R$: (HH Antes - HH Depois) × Valor Hora (PRODUTIVIDADE)';

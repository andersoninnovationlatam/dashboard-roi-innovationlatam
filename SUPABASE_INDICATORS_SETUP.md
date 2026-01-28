# Configuração da Tabela `indicators` no Supabase

## Estrutura de Relacionamento

```
projects (id) 
  └── indicators (project_id) 
       ├── info_data (JSONB) - Aba INFO
       ├── baseline_data (JSONB) - Aba BASELINE
       ├── ia_data (JSONB) - Aba IA
       └── custos_data (JSONB) - Aba CUSTOS
```

## SQL para Criar a Tabela `indicators`

Execute o seguinte SQL no SQL Editor do Supabase na ordem apresentada:

```sql
-- PASSO 1: Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Criar tabela indicators
CREATE TABLE IF NOT EXISTS indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da aba INFO
  info_data JSONB DEFAULT '{}'::jsonb,
  
  -- Dados da aba BASELINE (estruturado)
  baseline_data JSONB DEFAULT '{}'::jsonb,
  
  -- Dados da aba IA
  ia_data JSONB DEFAULT '{}'::jsonb,
  
  -- Dados da aba CUSTOS
  custos_data JSONB DEFAULT '{}'::jsonb,
  
  -- Dados da aba PÓS-IA (cenário após implementação)
  post_ia_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_indicators_project_id ON indicators(project_id);
CREATE INDEX IF NOT EXISTS idx_indicators_user_id ON indicators(user_id);

-- Índices GIN para consultas JSONB
CREATE INDEX IF NOT EXISTS idx_indicators_info_data ON indicators USING GIN (info_data);
CREATE INDEX IF NOT EXISTS idx_indicators_baseline_data ON indicators USING GIN (baseline_data);
CREATE INDEX IF NOT EXISTS idx_indicators_ia_data ON indicators USING GIN (ia_data);
CREATE INDEX IF NOT EXISTS idx_indicators_custos_data ON indicators USING GIN (custos_data);
CREATE INDEX IF NOT EXISTS idx_indicators_post_ia_data ON indicators USING GIN (post_ia_data);

-- PASSO 4: Habilitar RLS (Row Level Security)
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Criar políticas RLS

-- Política RLS: Usuários só podem ver indicadores de seus próprios projetos
CREATE POLICY "Users can view indicators from own projects"
  ON indicators FOR SELECT
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = indicators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Política RLS: Usuários só podem criar indicadores em seus próprios projetos
CREATE POLICY "Users can insert indicators in own projects"
  ON indicators FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = indicators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Política RLS: Usuários só podem atualizar indicadores de seus próprios projetos
CREATE POLICY "Users can update indicators from own projects"
  ON indicators FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = indicators.project_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = indicators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Política RLS: Usuários só podem deletar indicadores de seus próprios projetos
CREATE POLICY "Users can delete indicators from own projects"
  ON indicators FOR DELETE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = indicators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- PASSO 6: Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_indicators_updated_at
  BEFORE UPDATE ON indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Estrutura dos Dados JSONB

### info_data
```json
{
  "nome": "Nome do Indicador",
  "tipoIndicador": "Produtividade",
  "descricao": "Descrição do indicador",
  "camposEspecificos": {}
}
```

### baseline_data
```json
{
  "tipo": "PRODUTIVIDADE",
  "pessoas": [
    {
      "id": "uuid",
      "nome": "Nome",
      "cargo": "Cargo",
      "valorHora": 100,
      "tempoGasto": 60,
      "frequenciaReal": {
        "quantidade": 5,
        "periodo": "Diário"
      },
      "frequenciaDesejada": {
        "quantidade": 3,
        "periodo": "Diário"
      }
    }
  ],
  "custoTotalBaseline": 15000
}
```

### ia_data
```json
{
  "precisaValidacao": false,
  "pessoas": [],
  "ias": [
    {
      "nome": "GPT-4",
      "tempoExecucao": 5,
      "quantidadeOperacoes": 100,
      "periodoOperacoes": "dias",
      "capacidadeProcessamento": 1000,
      "precisao": 95,
      "taxaErro": 5,
      "custoPorOperacao": 0.01
    }
  ]
}
```

### custos_data
```json
{
  "custos": [
    {
      "nome": "Licença de Software",
      "valor": 500,
      "tipo": "mensal"
    }
  ]
}
```

### post_ia_data
```json
{
  "tipo": "PRODUTIVIDADE",
  "pessoas": [
    {
      "id": "uuid",
      "nome": "Nome",
      "cargo": "Cargo",
      "valorHora": 100,
      "tempoGasto": 30,
      "frequenciaReal": {
        "quantidade": 5,
        "periodo": "Diário"
      },
      "frequenciaDesejada": {
        "quantidade": 3,
        "periodo": "Diário"
      }
    }
  ],
  "custoTotalPostIA": 7500,
  "deltaProdutividade": 15000
}
```

Para INCREMENTO RECEITA:
```json
{
  "tipo": "INCREMENTO RECEITA",
  "valorReceitaDepois": 15000,
  "deltaReceita": 5000
}
```

Para CUSTOS RELACIONADOS:
```json
{
  "tipo": "CUSTOS RELACIONADOS",
  "ferramentas": [
    {
      "id": "uuid",
      "nomeFerramenta": "Ferramenta X",
      "custoMensal": 500,
      "outrosCustos": 100,
      "custoImplementacao": 2000
    }
  ],
  "custoTotalImplementacao": 2000
}
```

## Relacionamento Garantido

✅ **Projeto** tem `id` (UUID)
✅ **Indicador** tem `id` (UUID) e `project_id` (FK para projects)
✅ **Cada aba** está relacionada ao indicador através do `id` do indicador
✅ **Cascata de exclusão**: Ao deletar um projeto, todos os indicadores são deletados
✅ **RLS**: Usuários só acessam indicadores de seus próprios projetos

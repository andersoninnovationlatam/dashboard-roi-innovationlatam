-- ============================================================================
-- MIGRAÇÃO 002: Migração de Dados Existentes
-- Migra dados do formato JSONB para estrutura normalizada
-- ============================================================================

-- ============================================================================
-- PASSO 1: Criar Organização Padrão para Usuários Existentes
-- ============================================================================

DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Criar organização padrão se não existir
  INSERT INTO organizations (name, slug, is_active)
  VALUES ('Organização Padrão', 'organizacao-padrao', true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO default_org_id;

  -- Se não criou, buscar a existente
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'organizacao-padrao' LIMIT 1;
  END IF;

  -- Criar registros na tabela users para usuários do auth.users que ainda não têm registro
  INSERT INTO users (
    id,
    organization_id,
    email,
    name,
    password_hash,
    role,
    is_active,
    created_at
  )
  SELECT 
    au.id,
    default_org_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    '' as password_hash, -- Senha já está no auth.users
    'manager'::user_role as role, -- Default para manager
    au.email_confirmed_at IS NOT NULL as is_active,
    COALESCE(au.created_at, NOW()) as created_at
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = au.id
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Organização padrão criada/verificada: %', default_org_id;
END $$;

-- ============================================================================
-- PASSO 2: Migrar Projetos Existentes
-- ============================================================================

DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Buscar organização padrão
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'organizacao-padrao' LIMIT 1;

  -- Atualizar projetos existentes com organization_id e campos padrão
  UPDATE projects
  SET 
    organization_id = COALESCE(organization_id, default_org_id),
    status = COALESCE(status, 'planning'::project_status),
    development_type = COALESCE(development_type, 'other'::development_type),
    implementation_cost = COALESCE(implementation_cost, 0),
    monthly_maintenance_cost = COALESCE(monthly_maintenance_cost, 0),
    business_area = COALESCE(business_area, department, 'Outros')
  WHERE organization_id IS NULL OR status IS NULL OR development_type IS NULL;

  RAISE NOTICE 'Projetos migrados com sucesso';
END $$;

-- ============================================================================
-- PASSO 3: Migrar Indicadores (JSONB → Tabelas Normalizadas)
-- ============================================================================

DO $$
DECLARE
  indicator_record RECORD;
  new_indicator_id UUID;
  person_record JSONB;
  tool_record JSONB;
  metric_record JSONB;
  baseline_pessoas JSONB;
  post_ia_pessoas JSONB;
  custos_data JSONB;
  info_data JSONB;
  baseline_data JSONB;
  post_ia_data JSONB;
  ia_data JSONB;
  frequency_multiplier INTEGER;
  frequency_value INTEGER;
  frequency_unit_text TEXT;
BEGIN
  -- Iterar sobre todos os indicadores existentes
  FOR indicator_record IN 
    SELECT * FROM indicators
  LOOP
    -- Extrair dados JSONB
    info_data := COALESCE(indicator_record.info_data, '{}'::jsonb);
    baseline_data := COALESCE(indicator_record.baseline_data, '{}'::jsonb);
    post_ia_data := COALESCE(indicator_record.post_ia_data, '{}'::jsonb);
    custos_data := COALESCE(indicator_record.custos_data, '{}'::jsonb);
    ia_data := COALESCE(indicator_record.ia_data, '{}'::jsonb);

    -- Determinar improvement_type baseado no tipo do indicador
    DECLARE
      improvement_type_value improvement_type;
      tipo_indicador TEXT;
    BEGIN
      tipo_indicador := COALESCE(info_data->>'tipoIndicador', '');
      
      CASE tipo_indicador
        WHEN 'Produtividade' THEN improvement_type_value := 'productivity';
        WHEN 'Capacidade Analítica' THEN improvement_type_value := 'analytical_capacity';
        WHEN 'Incremento Receita' THEN improvement_type_value := 'revenue_increase';
        WHEN 'Custos Relacionados' THEN improvement_type_value := 'cost_reduction';
        ELSE improvement_type_value := 'productivity'; -- Default
      END CASE;

      -- Extrair frequência
      frequency_value := 1;
      frequency_unit_text := 'month';
      
      IF baseline_data ? 'pessoas' AND jsonb_array_length(baseline_data->'pessoas') > 0 THEN
        DECLARE
          primeira_pessoa JSONB;
          freq_real JSONB;
        BEGIN
          primeira_pessoa := baseline_data->'pessoas'->0;
          freq_real := primeira_pessoa->'frequenciaReal';
          
          IF freq_real IS NOT NULL THEN
            frequency_value := COALESCE((freq_real->>'quantidade')::INTEGER, 1);
            frequency_unit_text := CASE 
              WHEN freq_real->>'periodo' = 'Diário' THEN 'day'
              WHEN freq_real->>'periodo' = 'Semanal' THEN 'week'
              WHEN freq_real->>'periodo' = 'Mensal' THEN 'month'
              ELSE 'month'
            END;
          END IF;
        END;
      END IF;

      -- Criar indicador normalizado
      INSERT INTO indicators_normalized (
        id,
        project_id,
        name,
        description,
        improvement_type,
        frequency_value,
        frequency_unit,
        baseline_frequency_real,
        post_ia_frequency,
        is_active,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        indicator_record.id,
        indicator_record.project_id,
        COALESCE(info_data->>'nome', 'Indicador sem nome'),
        info_data->>'descricao',
        improvement_type_value,
        frequency_value,
        frequency_unit_text::frequency_unit,
        frequency_value, -- baseline_frequency_real (mesmo valor inicialmente)
        frequency_value, -- post_ia_frequency (mesmo valor inicialmente)
        true,
        NULL,
        indicator_record.created_at,
        indicator_record.updated_at
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id INTO new_indicator_id;

      IF new_indicator_id IS NULL THEN
        new_indicator_id := indicator_record.id;
      END IF;

      -- Migrar pessoas do baseline
      IF baseline_data ? 'pessoas' THEN
        baseline_pessoas := baseline_data->'pessoas';
        
        IF jsonb_typeof(baseline_pessoas) = 'array' THEN
          FOR person_record IN SELECT * FROM jsonb_array_elements(baseline_pessoas)
          LOOP
            INSERT INTO persons_involved (
              indicator_id,
              scenario,
              person_name,
              role,
              hourly_rate,
              time_spent_minutes,
              is_validation_only,
              created_at
            )
            VALUES (
              new_indicator_id,
              'baseline'::scenario_type,
              COALESCE(person_record->>'nome', 'Sem nome'),
              COALESCE(person_record->>'cargo', 'Sem cargo'),
              COALESCE((person_record->>'valorHora')::DECIMAL, 0),
              COALESCE((person_record->>'tempoGasto')::INTEGER, 0),
              false,
              indicator_record.created_at
            )
            ON CONFLICT DO NOTHING;
          END LOOP;
        END IF;
      END IF;

      -- Migrar pessoas do pós-IA
      IF post_ia_data ? 'pessoas' THEN
        post_ia_pessoas := post_ia_data->'pessoas';
        
        IF jsonb_typeof(post_ia_pessoas) = 'array' THEN
          FOR person_record IN SELECT * FROM jsonb_array_elements(post_ia_pessoas)
          LOOP
            INSERT INTO persons_involved (
              indicator_id,
              scenario,
              person_name,
              role,
              hourly_rate,
              time_spent_minutes,
              is_validation_only,
              created_at
            )
            VALUES (
              new_indicator_id,
              'post_ia'::scenario_type,
              COALESCE(person_record->>'nome', 'Sem nome'),
              COALESCE(person_record->>'cargo', 'Sem cargo'),
              COALESCE((person_record->>'valorHora')::DECIMAL, 0),
              COALESCE((person_record->>'tempoGasto')::INTEGER, 0),
              COALESCE((person_record->>'isValidationOnly')::BOOLEAN, false),
              indicator_record.created_at
            )
            ON CONFLICT DO NOTHING;
          END LOOP;
        END IF;
      END IF;

      -- Migrar ferramentas/custos
      IF custos_data ? 'custos' THEN
        FOR tool_record IN SELECT * FROM jsonb_array_elements(custos_data->'custos')
        LOOP
          INSERT INTO tools_costs (
            indicator_id,
            scenario,
            tool_name,
            tool_category,
            monthly_cost,
            cost_per_execution,
            notes,
            created_at
          )
          VALUES (
            new_indicator_id,
            'post_ia'::scenario_type, -- Custos geralmente são pós-IA
            COALESCE(tool_record->>'nome', 'Ferramenta sem nome'),
            'other'::tool_category, -- Default, pode ser refinado depois
            CASE 
              WHEN tool_record->>'tipo' = 'anual' THEN COALESCE((tool_record->>'valor')::DECIMAL, 0) / 12
              ELSE COALESCE((tool_record->>'valor')::DECIMAL, 0)
            END,
            NULL,
            tool_record->>'tipo',
            indicator_record.created_at
          )
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;

      -- Migrar métricas customizadas (se existirem)
      IF info_data ? 'camposEspecificos' THEN
        DECLARE
          campos_especificos JSONB;
        BEGIN
          campos_especificos := info_data->'camposEspecificos';
          
          -- Verificar se há métricas customizadas para migrar
          -- Isso depende da estrutura específica dos dados
          -- Exemplo genérico:
          IF campos_especificos ? 'metric_name' THEN
            INSERT INTO custom_metrics (
              indicator_id,
              metric_name,
              metric_unit,
              baseline_value,
              post_ia_value,
              is_higher_better,
              created_at
            )
            VALUES (
              new_indicator_id,
              COALESCE(campos_especificos->>'metric_name', 'Métrica'),
              COALESCE(campos_especificos->>'metric_unit', 'unidades'),
              COALESCE((campos_especificos->>'baseline_value')::DECIMAL, 0),
              COALESCE((campos_especificos->>'post_ia_value')::DECIMAL, 0),
              COALESCE((campos_especificos->>'is_higher_better')::BOOLEAN, true),
              indicator_record.created_at
            )
            ON CONFLICT DO NOTHING;
          END IF;
        END;
      END IF;

    END;
  END LOOP;

  RAISE NOTICE 'Indicadores migrados com sucesso';
END $$;

-- ============================================================================
-- PASSO 4: Calcular e Popular calculated_results Inicial
-- ============================================================================

-- Esta função será chamada após a migração para calcular resultados iniciais
-- Os cálculos detalhados serão feitos pelo serviço de cálculo

DO $$
DECLARE
  indicator_record RECORD;
BEGIN
  FOR indicator_record IN 
    SELECT id FROM indicators_normalized
  LOOP
    -- Inserir registro inicial em calculated_results
    -- Os valores serão calculados pelo serviço de ROI
    INSERT INTO calculated_results (
      indicator_id,
      calculation_date,
      period_type,
      hours_saved,
      money_saved,
      cost_baseline,
      cost_post_ia,
      gross_savings,
      net_savings,
      roi_percentage,
      payback_months
    )
    VALUES (
      indicator_record.id,
      CURRENT_DATE,
      'monthly'::period_type,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      NULL
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Registros iniciais de calculated_results criados';
END $$;

-- ============================================================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================

DO $$
DECLARE
  projects_count INTEGER;
  indicators_count INTEGER;
  indicators_normalized_count INTEGER;
  persons_count INTEGER;
  tools_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO projects_count FROM projects;
  SELECT COUNT(*) INTO indicators_count FROM indicators;
  SELECT COUNT(*) INTO indicators_normalized_count FROM indicators_normalized;
  SELECT COUNT(*) INTO persons_count FROM persons_involved;
  SELECT COUNT(*) INTO tools_count FROM tools_costs;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO PÓS-MIGRAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Projetos: %', projects_count;
  RAISE NOTICE 'Indicadores (antigos): %', indicators_count;
  RAISE NOTICE 'Indicadores (normalizados): %', indicators_normalized_count;
  RAISE NOTICE 'Pessoas envolvidas: %', persons_count;
  RAISE NOTICE 'Ferramentas/Custos: %', tools_count;
  RAISE NOTICE '========================================';
END $$;

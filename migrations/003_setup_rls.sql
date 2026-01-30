-- ============================================================================
-- MIGRAÇÃO 003: Configuração de Row Level Security (RLS)
-- Políticas de segurança para todas as tabelas
-- ============================================================================

-- ============================================================================
-- FUNÇÃO AUXILIAR: Obter organization_id do usuário atual
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons_involved ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: organizations
-- ============================================================================

-- Usuários só podem ver sua própria organização
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

-- Apenas admins podem criar organizações (via service_role em produção)
DROP POLICY IF EXISTS "Admins can create organizations" ON organizations;
CREATE POLICY "Admins can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true); -- Será restringido via aplicação

-- Apenas admins podem atualizar organizações
DROP POLICY IF EXISTS "Admins can update own organization" ON organizations;
CREATE POLICY "Admins can update own organization"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id())
  WITH CHECK (
    id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = organizations.id 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: users
-- ============================================================================

-- Usuários podem ver outros usuários da mesma organização
DROP POLICY IF EXISTS "Users can view same organization users" ON users;
CREATE POLICY "Users can view same organization users"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Apenas admins podem criar usuários
DROP POLICY IF EXISTS "Admins can create users" ON users;
CREATE POLICY "Admins can create users"
  ON users FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role = 'admin'
    )
  );

-- Usuários podem atualizar seu próprio registro, admins podem atualizar qualquer usuário da org
DROP POLICY IF EXISTS "Users can update users" ON users;
CREATE POLICY "Users can update users"
  ON users FOR UPDATE
  USING (
    id = auth.uid() OR -- Próprio usuário
    (
      organization_id = get_user_organization_id() AND
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = get_user_organization_id() 
        AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    id = auth.uid() OR
    (
      organization_id = get_user_organization_id() AND
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = get_user_organization_id() 
        AND role = 'admin'
      )
    )
  );

-- Apenas admins podem deletar usuários da mesma organização
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: projects
-- ============================================================================

-- Usuários podem ver projetos da sua organização
DROP POLICY IF EXISTS "Users can view organization projects" ON projects;
CREATE POLICY "Users can view organization projects"
  ON projects FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Managers e Admins podem criar projetos
DROP POLICY IF EXISTS "Managers can create projects" ON projects;
CREATE POLICY "Managers can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role IN ('admin', 'manager')
    )
  );

-- Managers e Admins podem atualizar projetos
DROP POLICY IF EXISTS "Managers can update projects" ON projects;
CREATE POLICY "Managers can update projects"
  ON projects FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role IN ('admin', 'manager')
    )
  );

-- Apenas Admins podem deletar projetos
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = get_user_organization_id() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: indicators_normalized
-- ============================================================================

-- Usuários podem ver indicadores de projetos da sua organização
DROP POLICY IF EXISTS "Users can view organization indicators" ON indicators_normalized;
CREATE POLICY "Users can view organization indicators"
  ON indicators_normalized FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = indicators_normalized.project_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Analysts, Managers e Admins podem criar indicadores
DROP POLICY IF EXISTS "Analysts can create indicators" ON indicators_normalized;
CREATE POLICY "Analysts can create indicators"
  ON indicators_normalized FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.organization_id = p.organization_id
      WHERE p.id = indicators_normalized.project_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- Analysts, Managers e Admins podem atualizar indicadores
DROP POLICY IF EXISTS "Analysts can update indicators" ON indicators_normalized;
CREATE POLICY "Analysts can update indicators"
  ON indicators_normalized FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.organization_id = p.organization_id
      WHERE p.id = indicators_normalized.project_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.organization_id = p.organization_id
      WHERE p.id = indicators_normalized.project_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- Managers e Admins podem deletar indicadores
DROP POLICY IF EXISTS "Managers can delete indicators" ON indicators_normalized;
CREATE POLICY "Managers can delete indicators"
  ON indicators_normalized FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.organization_id = p.organization_id
      WHERE p.id = indicators_normalized.project_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: persons_involved
-- ============================================================================

-- Usuários podem ver pessoas envolvidas de indicadores da sua organização
DROP POLICY IF EXISTS "Users can view organization persons" ON persons_involved;
CREATE POLICY "Users can view organization persons"
  ON persons_involved FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = persons_involved.indicator_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Analysts, Managers e Admins podem gerenciar pessoas envolvidas
DROP POLICY IF EXISTS "Analysts can manage persons" ON persons_involved;
CREATE POLICY "Analysts can manage persons"
  ON persons_involved FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = persons_involved.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = persons_involved.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: tools_costs
-- ============================================================================

-- Usuários podem ver ferramentas de indicadores da sua organização
DROP POLICY IF EXISTS "Users can view organization tools" ON tools_costs;
CREATE POLICY "Users can view organization tools"
  ON tools_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = tools_costs.indicator_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Analysts, Managers e Admins podem gerenciar ferramentas
DROP POLICY IF EXISTS "Analysts can manage tools" ON tools_costs;
CREATE POLICY "Analysts can manage tools"
  ON tools_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = tools_costs.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = tools_costs.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: custom_metrics
-- ============================================================================

-- Usuários podem ver métricas customizadas de indicadores da sua organização
DROP POLICY IF EXISTS "Users can view organization metrics" ON custom_metrics;
CREATE POLICY "Users can view organization metrics"
  ON custom_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = custom_metrics.indicator_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Analysts, Managers e Admins podem gerenciar métricas customizadas
DROP POLICY IF EXISTS "Analysts can manage metrics" ON custom_metrics;
CREATE POLICY "Analysts can manage metrics"
  ON custom_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = custom_metrics.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = custom_metrics.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: calculated_results
-- ============================================================================

-- Usuários podem ver resultados calculados de indicadores da sua organização
DROP POLICY IF EXISTS "Users can view organization results" ON calculated_results;
CREATE POLICY "Users can view organization results"
  ON calculated_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = calculated_results.indicator_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Apenas sistema pode inserir/atualizar (via service_role)
DROP POLICY IF EXISTS "System can manage results" ON calculated_results;
CREATE POLICY "System can manage results"
  ON calculated_results FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS RLS: tracking_history
-- ============================================================================

-- Usuários podem ver tracking de indicadores da sua organização
DROP POLICY IF EXISTS "Users can view organization tracking" ON tracking_history;
CREATE POLICY "Users can view organization tracking"
  ON tracking_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = tracking_history.indicator_id
      AND p.organization_id = get_user_organization_id()
    )
  );

-- Analysts, Managers e Admins podem criar tracking
DROP POLICY IF EXISTS "Analysts can create tracking" ON tracking_history;
CREATE POLICY "Analysts can create tracking"
  ON tracking_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = tracking_history.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- Analysts, Managers e Admins podem atualizar tracking
DROP POLICY IF EXISTS "Analysts can update tracking" ON tracking_history;
CREATE POLICY "Analysts can update tracking"
  ON tracking_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = tracking_history.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM indicators_normalized i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.organization_id = p.organization_id
      WHERE i.id = tracking_history.indicator_id
      AND p.organization_id = get_user_organization_id()
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'analyst')
    )
  );

-- ============================================================================
-- POLÍTICAS RLS: audit_logs
-- ============================================================================

-- Usuários podem ver logs de auditoria da sua organização
DROP POLICY IF EXISTS "Users can view organization audit logs" ON audit_logs;
CREATE POLICY "Users can view organization audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id = get_user_organization_id() OR
    organization_id IS NULL -- Logs sem organização (sistema)
  );

-- Sistema pode inserir logs (via service_role ou aplicação)
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Ninguém pode atualizar ou deletar logs de auditoria
-- (sem políticas de UPDATE/DELETE = sem permissão)

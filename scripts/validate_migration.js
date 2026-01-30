/**
 * Script de Validação de Migração
 * Valida a migração comparando dados antigos e novos
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function validateMigration() {
  console.log('🔍 Iniciando validação de migração...\n')

  const report = {
    success: true,
    errors: [],
    warnings: [],
    stats: {}
  }

  try {
    // 1. Validar organizações
    console.log('📊 Validando organizações...')
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')

    if (orgError) {
      report.errors.push(`Erro ao buscar organizações: ${orgError.message}`)
      report.success = false
    } else {
      report.stats.organizations = organizations?.length || 0
      if (report.stats.organizations === 0) {
        report.warnings.push('Nenhuma organização encontrada')
      }
    }

    // 2. Validar usuários
    console.log('👥 Validando usuários...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      report.errors.push(`Erro ao buscar usuários: ${usersError.message}`)
      report.success = false
    } else {
      report.stats.users = users?.length || 0
      
      // Verificar usuários sem organização
      const usersWithoutOrg = users?.filter(u => !u.organization_id) || []
      if (usersWithoutOrg.length > 0) {
        report.warnings.push(`${usersWithoutOrg.length} usuários sem organização`)
      }
    }

    // 3. Validar projetos
    console.log('📁 Validando projetos...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')

    if (projectsError) {
      report.errors.push(`Erro ao buscar projetos: ${projectsError.message}`)
      report.success = false
    } else {
      report.stats.projects = projects?.length || 0
      
      // Verificar projetos sem organização
      const projectsWithoutOrg = projects?.filter(p => !p.organization_id) || []
      if (projectsWithoutOrg.length > 0) {
        report.warnings.push(`${projectsWithoutOrg.length} projetos sem organização`)
      }
    }

    // 4. Validar indicadores normalizados
    console.log('📈 Validando indicadores normalizados...')
    const { data: indicators, error: indicatorsError } = await supabase
      .from('indicators_normalized')
      .select('*')

    if (indicatorsError) {
      report.errors.push(`Erro ao buscar indicadores: ${indicatorsError.message}`)
      report.success = false
    } else {
      report.stats.indicators_normalized = indicators?.length || 0
      
      // Verificar indicadores sem projeto
      const indicatorsWithoutProject = indicators?.filter(i => !i.project_id) || []
      if (indicatorsWithoutProject.length > 0) {
        report.warnings.push(`${indicatorsWithoutProject.length} indicadores sem projeto`)
      }
    }

    // 5. Validar pessoas envolvidas
    console.log('👤 Validando pessoas envolvidas...')
    const { data: persons, error: personsError } = await supabase
      .from('persons_involved')
      .select('*')

    if (personsError) {
      report.errors.push(`Erro ao buscar pessoas envolvidas: ${personsError.message}`)
      report.success = false
    } else {
      report.stats.persons_involved = persons?.length || 0
    }

    // 6. Validar ferramentas/custos
    console.log('🛠️ Validando ferramentas/custos...')
    const { data: tools, error: toolsError } = await supabase
      .from('tools_costs')
      .select('*')

    if (toolsError) {
      report.errors.push(`Erro ao buscar ferramentas: ${toolsError.message}`)
      report.success = false
    } else {
      report.stats.tools_costs = tools?.length || 0
    }

    // 7. Validar métricas customizadas
    console.log('📊 Validando métricas customizadas...')
    const { data: metrics, error: metricsError } = await supabase
      .from('custom_metrics')
      .select('*')

    if (metricsError) {
      report.errors.push(`Erro ao buscar métricas: ${metricsError.message}`)
      report.success = false
    } else {
      report.stats.custom_metrics = metrics?.length || 0
    }

    // 8. Validar resultados calculados
    console.log('💰 Validando resultados calculados...')
    const { data: results, error: resultsError } = await supabase
      .from('calculated_results')
      .select('*')

    if (resultsError) {
      report.errors.push(`Erro ao buscar resultados: ${resultsError.message}`)
      report.success = false
    } else {
      report.stats.calculated_results = results?.length || 0
    }

    // 9. Comparar contagens (se houver tabela antiga)
    console.log('🔄 Comparando com dados antigos...')
    const { data: oldIndicators } = await supabase
      .from('indicators')
      .select('id', { count: 'exact' })

    if (oldIndicators !== null) {
      const oldCount = oldIndicators.length || 0
      const newCount = report.stats.indicators_normalized || 0
      
      if (oldCount > 0 && newCount === 0) {
        report.warnings.push('Nenhum indicador foi migrado da tabela antiga')
      } else if (oldCount !== newCount) {
        report.warnings.push(`Contagem diferente: ${oldCount} antigos vs ${newCount} novos`)
      }
    }

  } catch (error) {
    report.errors.push(`Erro geral: ${error.message}`)
    report.success = false
  }

  // Gerar relatório
  console.log('\n' + '='.repeat(50))
  console.log('📋 RELATÓRIO DE VALIDAÇÃO')
  console.log('='.repeat(50))
  console.log('\n📊 ESTATÍSTICAS:')
  console.log(`   Organizações: ${report.stats.organizations || 0}`)
  console.log(`   Usuários: ${report.stats.users || 0}`)
  console.log(`   Projetos: ${report.stats.projects || 0}`)
  console.log(`   Indicadores Normalizados: ${report.stats.indicators_normalized || 0}`)
  console.log(`   Pessoas Envolvidas: ${report.stats.persons_involved || 0}`)
  console.log(`   Ferramentas/Custos: ${report.stats.tools_costs || 0}`)
  console.log(`   Métricas Customizadas: ${report.stats.custom_metrics || 0}`)
  console.log(`   Resultados Calculados: ${report.stats.calculated_results || 0}`)

  if (report.warnings.length > 0) {
    console.log('\n⚠️  AVISOS:')
    report.warnings.forEach(warning => {
      console.log(`   - ${warning}`)
    })
  }

  if (report.errors.length > 0) {
    console.log('\n❌ ERROS:')
    report.errors.forEach(error => {
      console.log(`   - ${error}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  if (report.success && report.errors.length === 0) {
    console.log('✅ Migração validada com sucesso!')
  } else {
    console.log('❌ Migração possui problemas que precisam ser corrigidos')
  }
  console.log('='.repeat(50) + '\n')

  return report
}

// Executar validação
validateMigration()
  .then(report => {
    process.exit(report.success && report.errors.length === 0 ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erro ao executar validação:', error)
    process.exit(1)
  })

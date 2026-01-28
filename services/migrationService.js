/**
 * Serviço de Migração
 * Migra dados existentes do formato antigo para o novo formato modular
 */

import { indicatorService } from './indicatorService'
import { indicatorDataService } from './indicatorDataService'

const MIGRATION_KEY = 'roi_data_migrated_v2'

export const migrationService = {
  /**
   * Verifica se a migração já foi executada
   */
  isMigrated() {
    return localStorage.getItem(MIGRATION_KEY) === 'true'
  },

  /**
   * Marca migração como concluída
   */
  markAsMigrated() {
    localStorage.setItem(MIGRATION_KEY, 'true')
  },

  /**
   * Migra dados do formato antigo para o novo
   */
  migrate() {
    if (this.isMigrated()) {
      return { success: true, message: 'Migração já foi executada' }
    }

    try {
      // Busca indicadores no formato antigo
      const oldIndicators = indicatorService.getAll()
      
      let migratedCount = 0

      oldIndicators.forEach(indicator => {
        // Verifica se o indicador tem dados completos (formato antigo)
        if (indicator.nome || indicator.baseline || indicator.comIA || indicator.custos) {
          // Separa os dados por aba
          const infoData = {
            nome: indicator.nome || '',
            tipoIndicador: indicator.tipoIndicador || indicator.tipoMelhoria || 'Produtividade',
            descricao: indicator.descricao || '',
            camposEspecificos: indicator.camposEspecificos || {}
          }

          const baselineData = {
            pessoas: indicator.baseline?.pessoas || []
          }

          const iaData = {
            precisaValidacao: indicator.comIA?.precisaValidacao || false,
            pessoas: indicator.comIA?.pessoas || [],
            ias: indicator.comIA?.ias || []
          }

          const custosData = {
            custos: indicator.custos || []
          }

          // Salva em arquivos separados
          indicatorDataService.saveInfo(indicator.id, infoData)
          indicatorDataService.saveBaseline(indicator.id, baselineData)
          indicatorDataService.saveIA(indicator.id, iaData)
          indicatorDataService.saveCustos(indicator.id, custosData)

          migratedCount++
        }
      })

      // Marca migração como concluída
      this.markAsMigrated()

      return {
        success: true,
        message: `Migração concluída: ${migratedCount} indicadores migrados`,
        count: migratedCount
      }
    } catch (error) {
      console.error('Erro na migração:', error)
      return {
        success: false,
        error: error.message || 'Erro ao migrar dados'
      }
    }
  },

  /**
   * Executa migração se necessário
   */
  migrateIfNeeded() {
    if (!this.isMigrated()) {
      return this.migrate()
    }
    return { success: true, message: 'Migração não necessária' }
  }
}

/**
 * Serviço de Cálculo para Indicador de Produtividade
 * Calcula métricas de produtividade baseado em dados de baseline e pós-IA
 */

import { indicatorCalculatedBase } from './indicatorCalculatedBase'
import { indicatorCalculatedMetricsService } from '../indicatorCalculatedMetricsService'

export const indicatorProdutividadeCalculated = {
  /**
   * Converte período para horas por mês
   */
  calcularHorasPorMes(quantidade, periodo) {
    if (!quantidade || quantidade === 0) return 0

    switch (periodo) {
      case 'Diário':
        return quantidade * 30
      case 'Semanal':
        return quantidade * 4.33
      case 'Mensal':
        return quantidade
      default:
        return quantidade
    }
  },

  /**
   * Calcula custo total baseline mensal
   */
  calcularCustoTotalBaseline(pessoas) {
    if (!pessoas || !Array.isArray(pessoas)) return 0

    return pessoas.reduce((total, pessoa) => {
      const horasPorMes = this.calcularHorasPorMes(
        pessoa.frequenciaReal?.quantidade || 0,
        pessoa.frequenciaReal?.periodo || 'Mensal'
      )
      const horasTrabalhadas = (pessoa.tempoGasto || 0) / 60 // converter minutos para horas
      const custoMensal = (pessoa.valorHora || 0) * horasTrabalhadas * horasPorMes
      return total + custoMensal
    }, 0)
  },

  /**
   * Calcula custo total pós-IA mensal
   */
  calcularCustoTotalPostIA(pessoas) {
    if (!pessoas || !Array.isArray(pessoas)) return 0

    return pessoas.reduce((total, pessoa) => {
      const horasPorMes = this.calcularHorasPorMes(
        pessoa.frequenciaReal?.quantidade || 0,
        pessoa.frequenciaReal?.periodo || 'Mensal'
      )
      const horasTrabalhadas = (pessoa.tempoGasto || 0) / 60 // converter minutos para horas
      const custoMensal = (pessoa.valorHora || 0) * horasTrabalhadas * horasPorMes
      return total + custoMensal
    }, 0)
  },

  /**
   * Calcula delta de produtividade: (HH Antes - HH Depois) × Valor Hora
   */
  calcularDeltaProdutividade(pessoasBaseline, pessoasPostIA) {
    if (!pessoasBaseline || !pessoasPostIA || !Array.isArray(pessoasBaseline) || !Array.isArray(pessoasPostIA)) {
      return 0
    }

    return pessoasPostIA.reduce((total, pessoaPostIA) => {
      // Encontrar pessoa correspondente no baseline
      const pessoaBaseline = pessoasBaseline.find(p => p.id === pessoaPostIA.id)
      if (!pessoaBaseline) return total

      // Calcular horas por mês usando a frequência do baseline (mesmo volume de trabalho)
      const horasBaseline = this.calcularHorasPorMes(
        pessoaBaseline.frequenciaReal?.quantidade || 0,
        pessoaBaseline.frequenciaReal?.periodo || 'Mensal'
      )
      const horasPostIA = horasBaseline // Usa a mesma frequência para comparar o mesmo volume

      // Calcular horas-homem (HH)
      const hhAntes = (pessoaBaseline.tempoGasto || 0) / 60 * horasBaseline
      const hhDepois = (pessoaPostIA.tempoGasto || 0) / 60 * horasPostIA

      // Delta = (HH Antes - HH Depois) × Valor Hora
      const delta = (hhAntes - hhDepois) * (pessoaPostIA.valorHora || pessoaBaseline.valorHora || 0)

      return total + delta
    }, 0)
  },

  /**
   * Calcula horas economizadas por mês
   */
  calcularHorasEconomizadasMes(pessoasBaseline, pessoasPostIA) {
    if (!pessoasBaseline || !pessoasPostIA || !Array.isArray(pessoasBaseline) || !Array.isArray(pessoasPostIA)) {
      return 0
    }

    return pessoasPostIA.reduce((total, pessoaPostIA) => {
      const pessoaBaseline = pessoasBaseline.find(p => p.id === pessoaPostIA.id)
      if (!pessoaBaseline) return total

      const horasBaseline = this.calcularHorasPorMes(
        pessoaBaseline.frequenciaReal?.quantidade || 0,
        pessoaBaseline.frequenciaReal?.periodo || 'Mensal'
      )
      const horasPostIA = horasBaseline

      const hhAntes = (pessoaBaseline.tempoGasto || 0) / 60 * horasBaseline
      const hhDepois = (pessoaPostIA.tempoGasto || 0) / 60 * horasPostIA

      return total + (hhAntes - hhDepois)
    }, 0)
  },

  /**
   * Calcula todas as métricas de produtividade e salva no Supabase
   */
  async calculateAndSave(indicatorId, baselineData, postIAData) {
    if (!indicatorId) {
      return { success: false, error: 'ID do indicador é obrigatório' }
    }

    try {
      const pessoasBaseline = baselineData?.pessoas || []
      const pessoasPostIA = postIAData?.pessoas || []

      // Calcular métricas
      const custoTotalBaseline = this.calcularCustoTotalBaseline(pessoasBaseline)
      const custoTotalPostIA = this.calcularCustoTotalPostIA(pessoasPostIA)
      const deltaProdutividade = this.calcularDeltaProdutividade(pessoasBaseline, pessoasPostIA)
      const horasEconomizadasMes = this.calcularHorasEconomizadasMes(pessoasBaseline, pessoasPostIA)
      const horasEconomizadasAno = horasEconomizadasMes * 12

      // Preparar métricas para salvar
      const metrics = {
        delta_produtividade: deltaProdutividade,
        horas_economizadas_mes: horasEconomizadasMes,
        horas_economizadas_ano: horasEconomizadasAno,
        custo_total_baseline: custoTotalBaseline,
        custo_total_post_ia: custoTotalPostIA
      }

      // Salvar no Supabase
      const result = await indicatorCalculatedMetricsService.upsertMetrics(indicatorId, metrics)

      if (result.success) {
        return {
          success: true,
          metrics: {
            ...metrics,
            ...result.data
          }
        }
      }

      return result
    } catch (error) {
      console.error('Erro ao calcular métricas de produtividade:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Calcula métricas sem salvar (apenas retorna)
   */
  calculate(baselineData, postIAData) {
    const pessoasBaseline = baselineData?.pessoas || []
    const pessoasPostIA = postIAData?.pessoas || []

    const custoTotalBaseline = this.calcularCustoTotalBaseline(pessoasBaseline)
    const custoTotalPostIA = this.calcularCustoTotalPostIA(pessoasPostIA)
    const deltaProdutividade = this.calcularDeltaProdutividade(pessoasBaseline, pessoasPostIA)
    const horasEconomizadasMes = this.calcularHorasEconomizadasMes(pessoasBaseline, pessoasPostIA)
    const horasEconomizadasAno = horasEconomizadasMes * 12

    return {
      delta_produtividade: deltaProdutividade,
      horas_economizadas_mes: horasEconomizadasMes,
      horas_economizadas_ano: horasEconomizadasAno,
      custo_total_baseline: custoTotalBaseline,
      custo_total_post_ia: custoTotalPostIA
    }
  }
}

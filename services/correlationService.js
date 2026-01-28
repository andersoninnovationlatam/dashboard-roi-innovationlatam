/**
 * Serviço de Correlações
 * Calcula correlações automáticas entre dados das abas para análise de ROI
 */

import { projectService } from './projectService'
import { indicatorService } from './indicatorService'
import { indicatorDataService } from './indicatorDataService'
import { calcularROIIndicador } from './roiCalculatorService'

/**
 * Calcula correlação de Pearson entre dois arrays
 */
const calcularCorrelacao = (x, y) => {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0
  return numerator / denominator
}

export const correlationService = {
  /**
   * Calcula todas as correlações de um projeto
   */
  calculateCorrelations(projectId) {
    try {
      const project = projectService.getById(projectId)
      if (!project) {
        return { success: false, error: 'Projeto não encontrado' }
      }

      const indicators = indicatorService.getByProjectId(projectId)
      const completeIndicators = indicators.map(ind => 
        indicatorService.getCompleteById(ind.id)
      ).filter(Boolean)

      if (completeIndicators.length === 0) {
        return {
          success: true,
          correlations: [],
          insights: []
        }
      }

      const correlations = []
      const insights = []

      // 1. Correlação Baseline vs IA (Tempo)
      const temposBaseline = []
      const temposIA = []
      
      completeIndicators.forEach(indicator => {
        const baseline = indicatorDataService.getBaseline(indicator.id)
        const ia = indicatorDataService.getIA(indicator.id)

        if (baseline?.pessoas && baseline.pessoas.length > 0) {
          baseline.pessoas.forEach(pessoa => {
            if (pessoa.tempoOperacao) {
              temposBaseline.push(parseFloat(pessoa.tempoOperacao) || 0)
            }
          })
        }

        if (ia?.ias && ia.ias.length > 0) {
          ia.ias.forEach(iaItem => {
            if (iaItem.tempoExecucao) {
              temposIA.push(parseFloat(iaItem.tempoExecucao) || 0)
            }
          })
        }
      })

      if (temposBaseline.length > 0 && temposIA.length > 0) {
        const minLength = Math.min(temposBaseline.length, temposIA.length)
        const corrTempo = calcularCorrelacao(
          temposBaseline.slice(0, minLength),
          temposIA.slice(0, minLength)
        )
        
        correlations.push({
          type: 'baseline_vs_ia_tempo',
          label: 'Tempo Baseline vs Tempo IA',
          value: corrTempo,
          strength: this.getCorrelationStrength(corrTempo)
        })

        if (corrTempo > 0.7) {
          insights.push({
            type: 'positive',
            message: 'Alta correlação entre tempo baseline e IA sugere que a IA está otimizando processos proporcionalmente'
          })
        }
      }

      // 2. Correlação Custos vs Economia
      const custosTotais = []
      const economias = []

      completeIndicators.forEach(indicator => {
        const custos = indicatorDataService.getCustos(indicator.id)
        const metricas = calcularROIIndicador(indicator)

        let custoTotal = 0
        if (custos?.custos) {
          custos.custos.forEach(custo => {
            const valor = parseFloat(custo.valor) || 0
            if (custo.tipo === 'mensal') {
              custoTotal += valor * 12
            } else {
              custoTotal += valor
            }
          })
        }

        custosTotais.push(custoTotal)
        economias.push(metricas?.economiaAnual || 0)
      })

      if (custosTotais.length > 0 && economias.length > 0) {
        const corrCustoEconomia = calcularCorrelacao(custosTotais, economias)
        
        correlations.push({
          type: 'custos_vs_economia',
          label: 'Custos vs Economia',
          value: corrCustoEconomia,
          strength: this.getCorrelationStrength(corrCustoEconomia)
        })

        if (corrCustoEconomia > 0.5) {
          insights.push({
            type: 'positive',
            message: 'Investimentos maiores estão gerando economias proporcionais'
          })
        } else if (corrCustoEconomia < -0.3) {
          insights.push({
            type: 'warning',
            message: 'Alguns investimentos podem não estar gerando retorno esperado'
          })
        }
      }

      // 3. Correlação Tipo de Indicador vs ROI
      const tiposIndicador = []
      const rois = []

      completeIndicators.forEach(indicator => {
        const info = indicatorDataService.getInfo(indicator.id)
        const metricas = calcularROIIndicador(indicator)

        if (info?.tipoIndicador) {
          tiposIndicador.push(info.tipoIndicador)
          rois.push(metricas?.roiPercentual || 0)
        }
      })

      // Agrupa por tipo e calcula ROI médio
      const roiPorTipo = {}
      tiposIndicador.forEach((tipo, index) => {
        if (!roiPorTipo[tipo]) {
          roiPorTipo[tipo] = []
        }
        roiPorTipo[tipo].push(rois[index])
      })

      const tipoPerformance = Object.entries(roiPorTipo).map(([tipo, valores]) => {
        const media = valores.reduce((a, b) => a + b, 0) / valores.length
        return { tipo, media, count: valores.length }
      }).sort((a, b) => b.media - a.media)

      correlations.push({
        type: 'tipo_vs_roi',
        label: 'Performance por Tipo de Indicador',
        value: tipoPerformance,
        strength: 'analysis'
      })

      if (tipoPerformance.length > 0) {
        const melhorTipo = tipoPerformance[0]
        insights.push({
          type: 'info',
          message: `Tipo "${melhorTipo.tipo}" apresenta melhor ROI médio (${melhorTipo.media.toFixed(1)}%)`
        })
      }

      // 4. Correlação Pessoas vs IAs (Produtividade)
      const pessoasBaseline = []
      const pessoasIA = []
      const produtividades = []

      completeIndicators.forEach(indicator => {
        const baseline = indicatorDataService.getBaseline(indicator.id)
        const ia = indicatorDataService.getIA(indicator.id)
        const metricas = calcularROIIndicador(indicator)

        if (baseline?.pessoas) {
          pessoasBaseline.push(baseline.pessoas.length)
        } else {
          pessoasBaseline.push(0)
        }

        if (ia?.pessoas) {
          pessoasIA.push(ia.pessoas.length)
        } else {
          pessoasIA.push(0)
        }

        produtividades.push(metricas?.ganhoProdutividade || 0)
      })

      if (pessoasBaseline.length > 0 && produtividades.length > 0) {
        const corrPessoasProd = calcularCorrelacao(pessoasBaseline, produtividades)
        
        correlations.push({
          type: 'pessoas_vs_produtividade',
          label: 'Pessoas Baseline vs Ganho Produtividade',
          value: corrPessoasProd,
          strength: this.getCorrelationStrength(corrPessoasProd)
        })
      }

      // 5. Análise de Eficiência (Tempo economizado vs Investimento)
      const temposEconomizados = []
      const investimentos = []

      completeIndicators.forEach(indicator => {
        const metricas = calcularROIIndicador(indicator)
        const custos = indicatorDataService.getCustos(indicator.id)

        let investimento = 0
        if (custos?.custos) {
          custos.custos.forEach(custo => {
            const valor = parseFloat(custo.valor) || 0
            if (custo.tipo === 'mensal') {
              investimento += valor * 12
            } else {
              investimento += valor
            }
          })
        }

        temposEconomizados.push(metricas?.tempoEconomizadoAnualHoras || 0)
        investimentos.push(investimento)
      })

      if (temposEconomizados.length > 0 && investimentos.length > 0) {
        const corrEficiencia = calcularCorrelacao(temposEconomizados, investimentos)
        
        correlations.push({
          type: 'tempo_vs_investimento',
          label: 'Tempo Economizado vs Investimento',
          value: corrEficiencia,
          strength: this.getCorrelationStrength(corrEficiencia)
        })

        if (corrEficiencia > 0.6) {
          insights.push({
            type: 'positive',
            message: 'Investimentos estão gerando economia de tempo proporcional'
          })
        }
      }

      return {
        success: true,
        correlations,
        insights,
        summary: {
          totalCorrelations: correlations.length,
          strongCorrelations: correlations.filter(c => Math.abs(c.value) > 0.7).length,
          insightsCount: insights.length
        }
      }
    } catch (error) {
      console.error('Erro ao calcular correlações:', error)
      return {
        success: false,
        error: error.message || 'Erro ao calcular correlações'
      }
    }
  },

  /**
   * Retorna força da correlação
   */
  getCorrelationStrength(value) {
    const abs = Math.abs(value)
    if (abs >= 0.8) return 'muito_forte'
    if (abs >= 0.6) return 'forte'
    if (abs >= 0.4) return 'moderada'
    if (abs >= 0.2) return 'fraca'
    return 'muito_fraca'
  },

  /**
   * Formata valor de correlação para exibição
   */
  formatCorrelation(value) {
    return (value * 100).toFixed(1) + '%'
  }
}

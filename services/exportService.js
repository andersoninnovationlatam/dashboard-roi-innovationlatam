/**
 * Serviço de Exportação
 * Exporta projetos completos em PDF e CSV usando dados do Supabase
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { projectServiceSupabase } from './projectServiceSupabase'
import { indicatorServiceSupabase } from './indicatorServiceSupabase'
import { calcularROIProjeto } from './roiCalculatorService'
import { formatarMoeda, formatarPorcentagem, formatarHoras, formatarPayback, formatarROI } from '../utils/formatters'
import { supabase } from '../src/lib/supabase'

/**
 * Calcula horas por mês baseado na frequência
 */
function calcularHorasPorMes(quantidade, periodo) {
  const qtd = Number(quantidade) || 0
  if (qtd === 0) return 0
  
  const multiplicadores = {
    'Diário': 30,
    'Semanal': 4.33,
    'Mensal': 1
  }
  
  return qtd * (multiplicadores[periodo] || 1)
}

/**
 * Calcula custo total de uma pessoa no baseline
 */
function calcularCustoPessoa(pessoa) {
  if (!pessoa) return 0
  
  const tempoGasto = Number(pessoa.tempoGasto) || 0 // em minutos
  const valorHora = Number(pessoa.valorHora) || 0
  const quantidade = Number(pessoa.frequenciaReal?.quantidade) || 0
  const periodo = pessoa.frequenciaReal?.periodo || 'Mensal'
  
  const horasPorMes = calcularHorasPorMes(quantidade, periodo)
  const horasGastas = (tempoGasto / 60) * horasPorMes
  
  return horasGastas * valorHora
}

/**
 * Extrai dados formatados de um indicador completo para exportação
 */
function extractIndicatorData(indicator) {
  const info = {
    nome: indicator.name || indicator.nome || 'Indicador sem nome',
    tipoIndicador: indicator.tipoIndicador || '',
    descricao: indicator.description || indicator.descricao || ''
  }
  
  const baseline = indicator.baselineData || {}
  const postIA = indicator.postIAData || {}
  const custos = Array.isArray(indicator.custos) ? indicator.custos : []
  const ia = indicator.ia || {}
  
  return { info, baseline, postIA, custos, ia }
}

/**
 * Formata dados de PRODUTIVIDADE - Baseline
 */
function formatProdutividadeBaseline(baseline) {
  if (!baseline.pessoas || baseline.pessoas.length === 0) return null
  
  return baseline.pessoas.map(p => ({
    nome: p.nome || '',
    cargo: p.cargo || '',
    valorHora: Number(p.valorHora) || 0,
    tempoGasto: Number(p.tempoGasto) || 0,
    frequenciaReal: `${p.frequenciaReal?.quantidade || 0} ${p.frequenciaReal?.periodo || 'Mensal'}`,
    frequenciaDesejada: `${p.frequenciaDesejada?.quantidade || 0} ${p.frequenciaDesejada?.periodo || 'Mensal'}`,
    custoTotal: calcularCustoPessoa(p)
  }))
}

/**
 * Formata dados de PRODUTIVIDADE - Pós-IA
 */
function formatProdutividadePostIA(postIA) {
  if (!postIA.pessoas || postIA.pessoas.length === 0) return null
  
  return {
    pessoas: postIA.pessoas.map(p => ({
      nome: p.nome || '',
      cargo: p.cargo || '',
      valorHora: Number(p.valorHora) || 0,
      tempoGasto: Number(p.tempoGasto) || 0,
      frequenciaReal: `${p.frequenciaReal?.quantidade || 0} ${p.frequenciaReal?.periodo || 'Mensal'}`,
      frequenciaDesejada: `${p.frequenciaDesejada?.quantidade || 0} ${p.frequenciaDesejada?.periodo || 'Mensal'}`
    })),
    custoTotalPostIA: Number(postIA.custoTotalPostIA) || 0,
    deltaProdutividade: Number(postIA.deltaProdutividade) || 0
  }
}

/**
 * Formata dados de INCREMENTO RECEITA - Baseline
 */
function formatIncrementoReceitaBaseline(baseline) {
  return {
    valorReceitaAntes: Number(baseline.valorReceitaAntes) || 0
  }
}

/**
 * Formata dados de INCREMENTO RECEITA - Pós-IA
 */
function formatIncrementoReceitaPostIA(postIA) {
  return {
    valorReceitaDepois: Number(postIA.valorReceitaDepois) || 0,
    deltaReceita: Number(postIA.deltaReceita) || 0
  }
}

/**
 * Formata dados de CUSTOS RELACIONADOS - Baseline
 */
function formatCustosRelacionadosBaseline(baseline) {
  if (!baseline.ferramentas || baseline.ferramentas.length === 0) return null
  
  return baseline.ferramentas.map(f => ({
    nomeFerramenta: f.nomeFerramenta || '',
    custoMensal: Number(f.custoMensal) || 0,
    outrosCustos: Number(f.outrosCustos) || 0
  }))
}

/**
 * Formata dados de CUSTOS RELACIONADOS - Pós-IA
 */
function formatCustosRelacionadosPostIA(postIA) {
  if (!postIA.ferramentas || postIA.ferramentas.length === 0) return null
  
  return postIA.ferramentas.map(f => ({
    nomeFerramenta: f.nomeFerramenta || '',
    custoMensal: Number(f.custoMensal) || 0,
    outrosCustos: Number(f.outrosCustos) || 0,
    custoImplementacao: Number(f.custoImplementacao) || 0
  }))
}

/**
 * Formata dados de OUTROS - Baseline
 */
function formatOutrosBaseline(baseline) {
  return {
    nomeIndicador: baseline.nomeIndicador || '',
    valorIndicador: Number(baseline.valorIndicador) || 0
  }
}

/**
 * Formata dados de OUTROS - Pós-IA
 */
function formatOutrosPostIA(postIA) {
  return {
    nomeIndicador: postIA.nomeIndicador || '',
    valorIndicador: Number(postIA.valorIndicador) || 0,
    deltaIndicador: Number(postIA.deltaIndicador) || 0
  }
}

export const exportService = {
  /**
   * Exporta projeto completo em PDF
   */
  async exportProjectToPDF(projectId) {
    try {
      // 1. Buscar projeto
      const project = await projectServiceSupabase.getById(projectId)
      if (!project) {
        return { success: false, error: 'Projeto não encontrado' }
      }

      // 2. Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // 3. Buscar indicadores
      const indicators = await indicatorServiceSupabase.getByProjectId(projectId, user.id)
      const validIndicators = indicators.filter(ind => 
        indicatorServiceSupabase.isValidUUID(ind.id)
      )
      
      const completeIndicators = await Promise.all(
        validIndicators.map(async ind => 
          await indicatorServiceSupabase.getCompleteById(ind.id)
        )
      )
      const filteredIndicators = completeIndicators.filter(Boolean)

      // 4. Calcular métricas
      const metricas = await calcularROIProjeto(projectId, filteredIndicators)

      // 5. Gerar PDF
      const doc = new jsPDF()
      let yPosition = 20

      // Cabeçalho
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de ROI', 105, yPosition, { align: 'center' })
      yPosition += 10

      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text(`Projeto: ${project.name || project.nome}`, 105, yPosition, { align: 'center' })
      yPosition += 7

      if (project.department || project.area) {
        doc.setFontSize(12)
        doc.text(`Departamento: ${project.department || project.area}`, 105, yPosition, { align: 'center' })
        yPosition += 7
      }

      if (project.description || project.descricao) {
        doc.setFontSize(10)
        doc.text(`Descrição: ${project.description || project.descricao}`, 14, yPosition)
        yPosition += 10
      }

      yPosition += 5

      // Resumo Executivo
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo Executivo', 14, yPosition)
      yPosition += 10

      const summaryData = [
        ['Métrica', 'Valor'],
        ['Economia Anual Total', formatarMoeda(metricas?.economiaAnualTotal || 0)],
        ['Tempo Economizado/Ano', formatarHoras(metricas?.tempoEconomizadoAnualHoras || 0)],
        ['ROI 1º Ano', formatarROI(metricas?.roiGeral || 0)],
        ['Payback Médio', formatarPayback(metricas?.paybackMedioMeses || Infinity)],
        ['Total de Indicadores', (metricas?.totalIndicadores || 0).toString()],
        ['Custo Implementação', formatarMoeda(metricas?.custoImplementacaoTotal || 0)],
        ['Custo Anual Recorrente', formatarMoeda(metricas?.custoAnualRecorrenteTotal || 0)]
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 }
      })

      yPosition = doc.lastAutoTable.finalY + 15

      // Indicadores Detalhados
      if (filteredIndicators.length > 0) {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Indicadores Detalhados', 14, yPosition)
        yPosition += 10

        filteredIndicators.forEach((indicator, index) => {
          // Verifica se precisa de nova página
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          const { info, baseline, postIA, custos, ia } = extractIndicatorData(indicator)

          // Título do Indicador
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(`${index + 1}. ${info.nome}`, 14, yPosition)
          yPosition += 8

          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          if (info.tipoIndicador) {
            doc.text(`Tipo: ${info.tipoIndicador}`, 14, yPosition)
            yPosition += 6
          }
          if (info.descricao) {
            doc.text(`Descrição: ${info.descricao}`, 14, yPosition)
            yPosition += 6
          }

          // Baseline - Renderizar baseado no tipo
          if (baseline && baseline.tipo) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('Baseline:', 14, yPosition)
            yPosition += 6
            doc.setFont('helvetica', 'normal')

            switch (baseline.tipo) {
              case 'PRODUTIVIDADE': {
                const pessoasBaseline = formatProdutividadeBaseline(baseline)
                if (pessoasBaseline && pessoasBaseline.length > 0) {
                  const baselineTable = [
                    ['Nome', 'Cargo', 'Valor/Hora', 'Tempo (min)', 'Freq. Real', 'Freq. Desejada', 'Custo Total']
                  ]

                  pessoasBaseline.forEach(p => {
                    baselineTable.push([
                      p.nome,
                      p.cargo,
                      formatarMoeda(p.valorHora),
                      p.tempoGasto.toString(),
                      p.frequenciaReal,
                      p.frequenciaDesejada,
                      formatarMoeda(p.custoTotal)
                    ])
                  })

                  autoTable(doc, {
                    startY: yPosition,
                    head: [baselineTable[0]],
                    body: baselineTable.slice(1),
                    theme: 'striped',
                    headStyles: { fillColor: [239, 68, 68] },
                    styles: { fontSize: 8 }
                  })
                  yPosition = doc.lastAutoTable.finalY + 10
                }
                break
              }
              case 'INCREMENTO RECEITA': {
                const receitaBaseline = formatIncrementoReceitaBaseline(baseline)
                doc.text(`Receita Antes: ${formatarMoeda(receitaBaseline.valorReceitaAntes)}`, 14, yPosition)
                yPosition += 6
                break
              }
              case 'CUSTOS RELACIONADOS': {
                const ferramentasBaseline = formatCustosRelacionadosBaseline(baseline)
                if (ferramentasBaseline && ferramentasBaseline.length > 0) {
                  const ferramentasTable = [
                    ['Ferramenta', 'Custo Mensal', 'Outros Custos']
                  ]

                  ferramentasBaseline.forEach(f => {
                    ferramentasTable.push([
                      f.nomeFerramenta,
                      formatarMoeda(f.custoMensal),
                      formatarMoeda(f.outrosCustos)
                    ])
                  })

                  autoTable(doc, {
                    startY: yPosition,
                    head: [ferramentasTable[0]],
                    body: ferramentasTable.slice(1),
                    theme: 'striped',
                    headStyles: { fillColor: [239, 68, 68] },
                    styles: { fontSize: 8 }
                  })
                  yPosition = doc.lastAutoTable.finalY + 10
                }
                break
              }
              case 'OUTROS': {
                const outrosBaseline = formatOutrosBaseline(baseline)
                doc.text(`Nome: ${outrosBaseline.nomeIndicador}`, 14, yPosition)
                yPosition += 6
                doc.text(`Valor: ${formatarMoeda(outrosBaseline.valorIndicador)}`, 14, yPosition)
                yPosition += 6
                break
              }
              default:
                // Outros tipos podem ser adicionados aqui
                break
            }
          }

          // Pós-IA - Renderizar baseado no tipo
          if (postIA && postIA.tipo) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('Pós-IA:', 14, yPosition)
            yPosition += 6
            doc.setFont('helvetica', 'normal')

            switch (postIA.tipo) {
              case 'PRODUTIVIDADE': {
                const pessoasPostIA = formatProdutividadePostIA(postIA)
                if (pessoasPostIA && pessoasPostIA.pessoas && pessoasPostIA.pessoas.length > 0) {
                  const postIATable = [
                    ['Nome', 'Cargo', 'Valor/Hora', 'Tempo (min)', 'Freq. Real', 'Freq. Desejada']
                  ]

                  pessoasPostIA.pessoas.forEach(p => {
                    postIATable.push([
                      p.nome,
                      p.cargo,
                      formatarMoeda(p.valorHora),
                      p.tempoGasto.toString(),
                      p.frequenciaReal,
                      p.frequenciaDesejada
                    ])
                  })

                  autoTable(doc, {
                    startY: yPosition,
                    head: [postIATable[0]],
                    body: postIATable.slice(1),
                    theme: 'striped',
                    headStyles: { fillColor: [34, 197, 94] },
                    styles: { fontSize: 8 }
                  })
                  yPosition = doc.lastAutoTable.finalY + 10

                  // Delta Produtividade destacado
                  doc.setFont('helvetica', 'bold')
                  doc.text(`Delta Produtividade: ${formatarMoeda(pessoasPostIA.deltaProdutividade)}`, 14, yPosition)
                  yPosition += 8
                  doc.setFont('helvetica', 'normal')
                }
                break
              }
              case 'INCREMENTO RECEITA': {
                const receitaPostIA = formatIncrementoReceitaPostIA(postIA)
                doc.text(`Receita Depois: ${formatarMoeda(receitaPostIA.valorReceitaDepois)}`, 14, yPosition)
                yPosition += 6
                doc.setFont('helvetica', 'bold')
                doc.text(`Delta Receita: ${formatarMoeda(receitaPostIA.deltaReceita)}`, 14, yPosition)
                yPosition += 8
                doc.setFont('helvetica', 'normal')
                break
              }
              case 'CUSTOS RELACIONADOS': {
                const ferramentasPostIA = formatCustosRelacionadosPostIA(postIA)
                if (ferramentasPostIA && ferramentasPostIA.length > 0) {
                  const ferramentasTable = [
                    ['Ferramenta', 'Custo Mensal', 'Outros Custos', 'Custo Implementação']
                  ]

                  ferramentasPostIA.forEach(f => {
                    ferramentasTable.push([
                      f.nomeFerramenta,
                      formatarMoeda(f.custoMensal),
                      formatarMoeda(f.outrosCustos),
                      formatarMoeda(f.custoImplementacao)
                    ])
                  })

                  autoTable(doc, {
                    startY: yPosition,
                    head: [ferramentasTable[0]],
                    body: ferramentasTable.slice(1),
                    theme: 'striped',
                    headStyles: { fillColor: [34, 197, 94] },
                    styles: { fontSize: 8 }
                  })
                  yPosition = doc.lastAutoTable.finalY + 10
                }
                break
              }
              case 'OUTROS': {
                const outrosPostIA = formatOutrosPostIA(postIA)
                doc.text(`Nome: ${outrosPostIA.nomeIndicador}`, 14, yPosition)
                yPosition += 6
                doc.text(`Valor: ${formatarMoeda(outrosPostIA.valorIndicador)}`, 14, yPosition)
                yPosition += 6
                if (outrosPostIA.deltaIndicador !== undefined) {
                  doc.setFont('helvetica', 'bold')
                  doc.text(`Delta: ${formatarMoeda(outrosPostIA.deltaIndicador)}`, 14, yPosition)
                  yPosition += 8
                  doc.setFont('helvetica', 'normal')
                }
                break
              }
              default:
                break
            }
          }

          // Custos
          if (custos && custos.length > 0) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('Custos:', 14, yPosition)
            yPosition += 6

            const custosTable = [
              ['Nome', 'Valor', 'Tipo']
            ]

            custos.forEach(custo => {
              custosTable.push([
                custo.nome || '',
                formatarMoeda(custo.valor || 0),
                custo.tipo === 'mensal' ? 'Mensal' : 'Anual'
              ])
            })

            autoTable(doc, {
              startY: yPosition,
              head: [custosTable[0]],
              body: custosTable.slice(1),
              theme: 'striped',
              headStyles: { fillColor: [251, 191, 36] },
              styles: { fontSize: 8 }
            })
            yPosition = doc.lastAutoTable.finalY + 15
          }

          yPosition += 5
        })
      }

      // Rodapé
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // Download
      const fileName = `ROI_${(project.name || project.nome || 'projeto').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      return { success: true, fileName }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      return { success: false, error: error.message || 'Erro ao gerar PDF' }
    }
  },

  /**
   * Exporta projeto completo em CSV
   */
  async exportProjectToCSV(projectId) {
    try {
      // 1. Buscar projeto
      const project = await projectServiceSupabase.getById(projectId)
      if (!project) {
        return { success: false, error: 'Projeto não encontrado' }
      }

      // 2. Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // 3. Buscar indicadores
      const indicators = await indicatorServiceSupabase.getByProjectId(projectId, user.id)
      const validIndicators = indicators.filter(ind => 
        indicatorServiceSupabase.isValidUUID(ind.id)
      )
      
      const completeIndicators = await Promise.all(
        validIndicators.map(async ind => 
          await indicatorServiceSupabase.getCompleteById(ind.id)
        )
      )
      const filteredIndicators = completeIndicators.filter(Boolean)

      // 4. Calcular métricas
      const metricas = await calcularROIProjeto(projectId, filteredIndicators)

      // 5. Prepara dados para CSV
      const csvData = []

      // Cabeçalho do projeto
      csvData.push(['Relatório de ROI'])
      csvData.push(['Projeto', project.name || project.nome])
      if (project.department || project.area) csvData.push(['Departamento', project.department || project.area])
      if (project.description || project.descricao) csvData.push(['Descrição', project.description || project.descricao])
      csvData.push([])

      // Resumo Executivo
      csvData.push(['RESUMO EXECUTIVO'])
      csvData.push(['Métrica', 'Valor'])
      csvData.push(['Economia Anual Total', formatarMoeda(metricas?.economiaAnualTotal || 0)])
      csvData.push(['Tempo Economizado/Ano', formatarHoras(metricas?.tempoEconomizadoAnualHoras || 0)])
      csvData.push(['ROI 1º Ano', formatarROI(metricas?.roiGeral || 0)])
      csvData.push(['Payback Médio', formatarPayback(metricas?.paybackMedioMeses || Infinity)])
      csvData.push(['Total de Indicadores', (metricas?.totalIndicadores || 0).toString()])
      csvData.push(['Custo Implementação', formatarMoeda(metricas?.custoImplementacaoTotal || 0)])
      csvData.push(['Custo Anual Recorrente', formatarMoeda(metricas?.custoAnualRecorrenteTotal || 0)])
      csvData.push([])

      // Indicadores
      filteredIndicators.forEach((indicator, index) => {
        const { info, baseline, postIA, custos, ia } = extractIndicatorData(indicator)

        csvData.push([`INDICADOR ${index + 1}`])
        csvData.push(['Nome', info.nome])
        csvData.push(['Tipo', info.tipoIndicador])
        csvData.push(['Descrição', info.descricao])
        csvData.push([])

        // Baseline
        if (baseline && baseline.tipo) {
          csvData.push(['BASELINE'])
          switch (baseline.tipo) {
            case 'PRODUTIVIDADE': {
              const pessoasBaseline = formatProdutividadeBaseline(baseline)
              if (pessoasBaseline && pessoasBaseline.length > 0) {
                csvData.push(['Nome', 'Cargo', 'Valor/Hora', 'Tempo Gasto (min)', 'Freq. Real', 'Freq. Desejada', 'Custo Total'])
                pessoasBaseline.forEach(p => {
                  csvData.push([
                    p.nome,
                    p.cargo,
                    p.valorHora.toString(),
                    p.tempoGasto.toString(),
                    p.frequenciaReal,
                    p.frequenciaDesejada,
                    p.custoTotal.toString()
                  ])
                })
              }
              break
            }
            case 'INCREMENTO RECEITA': {
              const receitaBaseline = formatIncrementoReceitaBaseline(baseline)
              csvData.push(['Receita Antes', receitaBaseline.valorReceitaAntes.toString()])
              break
            }
            case 'CUSTOS RELACIONADOS': {
              const ferramentasBaseline = formatCustosRelacionadosBaseline(baseline)
              if (ferramentasBaseline && ferramentasBaseline.length > 0) {
                csvData.push(['Ferramenta', 'Custo Mensal', 'Outros Custos'])
                ferramentasBaseline.forEach(f => {
                  csvData.push([
                    f.nomeFerramenta,
                    f.custoMensal.toString(),
                    f.outrosCustos.toString()
                  ])
                })
              }
              break
            }
            case 'OUTROS': {
              const outrosBaseline = formatOutrosBaseline(baseline)
              csvData.push(['Nome Indicador', outrosBaseline.nomeIndicador])
              csvData.push(['Valor Indicador', outrosBaseline.valorIndicador.toString()])
              break
            }
            default:
              break
          }
          csvData.push([])
        }

        // Pós-IA
        if (postIA && postIA.tipo) {
          csvData.push(['PÓS-IA'])
          switch (postIA.tipo) {
            case 'PRODUTIVIDADE': {
              const pessoasPostIA = formatProdutividadePostIA(postIA)
              if (pessoasPostIA && pessoasPostIA.pessoas && pessoasPostIA.pessoas.length > 0) {
                csvData.push(['Nome', 'Cargo', 'Valor/Hora', 'Tempo Gasto (min)', 'Freq. Real', 'Freq. Desejada'])
                pessoasPostIA.pessoas.forEach(p => {
                  csvData.push([
                    p.nome,
                    p.cargo,
                    p.valorHora.toString(),
                    p.tempoGasto.toString(),
                    p.frequenciaReal,
                    p.frequenciaDesejada
                  ])
                })
                csvData.push(['Delta Produtividade', pessoasPostIA.deltaProdutividade.toString()])
              }
              break
            }
            case 'INCREMENTO RECEITA': {
              const receitaPostIA = formatIncrementoReceitaPostIA(postIA)
              csvData.push(['Receita Depois', receitaPostIA.valorReceitaDepois.toString()])
              csvData.push(['Delta Receita', receitaPostIA.deltaReceita.toString()])
              break
            }
            case 'CUSTOS RELACIONADOS': {
              const ferramentasPostIA = formatCustosRelacionadosPostIA(postIA)
              if (ferramentasPostIA && ferramentasPostIA.length > 0) {
                csvData.push(['Ferramenta', 'Custo Mensal', 'Outros Custos', 'Custo Implementação'])
                ferramentasPostIA.forEach(f => {
                  csvData.push([
                    f.nomeFerramenta,
                    f.custoMensal.toString(),
                    f.outrosCustos.toString(),
                    f.custoImplementacao.toString()
                  ])
                })
              }
              break
            }
            case 'OUTROS': {
              const outrosPostIA = formatOutrosPostIA(postIA)
              csvData.push(['Nome Indicador', outrosPostIA.nomeIndicador])
              csvData.push(['Valor Indicador', outrosPostIA.valorIndicador.toString()])
              if (outrosPostIA.deltaIndicador !== undefined) {
                csvData.push(['Delta Indicador', outrosPostIA.deltaIndicador.toString()])
              }
              break
            }
            default:
              break
          }
          csvData.push([])
        }

        // Custos
        if (custos && custos.length > 0) {
          csvData.push(['CUSTOS'])
          csvData.push(['Nome', 'Valor', 'Tipo'])
          custos.forEach(custo => {
            csvData.push([
              custo.nome || '',
              (custo.valor || 0).toString(),
              custo.tipo || ''
            ])
          })
          csvData.push([])
        }

        csvData.push([])
      })

      // Converte para CSV
      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `ROI_${(project.name || project.nome || 'projeto').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      return { success: false, error: error.message || 'Erro ao gerar CSV' }
    }
  }
}

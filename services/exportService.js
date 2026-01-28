/**
 * Serviço de Exportação
 * Exporta projetos completos em PDF e CSV
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { projectService } from './projectService'
import { indicatorService } from './indicatorService'
import { indicatorDataService } from './indicatorDataService'
import { calcularROIProjeto } from './roiCalculatorService'
import { formatarMoeda, formatarPorcentagem, formatarHoras, formatarPayback, formatarROI } from '../utils/formatters'

export const exportService = {
  /**
   * Exporta projeto completo em PDF
   */
  exportProjectToPDF(projectId) {
    try {
      const project = projectService.getById(projectId)
      if (!project) {
        return { success: false, error: 'Projeto não encontrado' }
      }

      const indicators = indicatorService.getByProjectId(projectId)
      const completeIndicators = indicators.map(ind => 
        indicatorService.getCompleteById(ind.id)
      ).filter(Boolean)

      const metricas = calcularROIProjeto(projectId, completeIndicators)

      // Cria documento PDF
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
      if (completeIndicators.length > 0) {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Indicadores Detalhados', 14, yPosition)
        yPosition += 10

        completeIndicators.forEach((indicator, index) => {
          // Verifica se precisa de nova página
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          const info = indicatorDataService.getInfo(indicator.id)
          const baseline = indicatorDataService.getBaseline(indicator.id)
          const ia = indicatorDataService.getIA(indicator.id)
          const custos = indicatorDataService.getCustos(indicator.id)

          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(`${index + 1}. ${info?.nome || 'Indicador sem nome'}`, 14, yPosition)
          yPosition += 8

          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          if (info?.tipoIndicador) {
            doc.text(`Tipo: ${info.tipoIndicador}`, 14, yPosition)
            yPosition += 6
          }
          if (info?.descricao) {
            doc.text(`Descrição: ${info.descricao}`, 14, yPosition)
            yPosition += 6
          }

          // Campos específicos
          if (info?.camposEspecificos && Object.keys(info.camposEspecificos).length > 0) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('Campos de Cálculo:', 14, yPosition)
            yPosition += 6
            doc.setFont('helvetica', 'normal')
            Object.entries(info.camposEspecificos).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                doc.text(`  • ${key}: ${value}`, 20, yPosition)
                yPosition += 5
              }
            })
          }

          // Baseline
          if (baseline?.pessoas && baseline.pessoas.length > 0) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('Baseline - Pessoas:', 14, yPosition)
            yPosition += 6

            const baselineTable = [
              ['Nome', 'Função', 'Valor/Hora', 'Tempo Op.', 'Qtd. Operações']
            ]

            baseline.pessoas.forEach(pessoa => {
              baselineTable.push([
                pessoa.nome || '',
                pessoa.funcao || '',
                pessoa.valorHora ? `R$ ${pessoa.valorHora}` : '',
                pessoa.tempoOperacao ? `${pessoa.tempoOperacao} min` : '',
                pessoa.quantidadeOperacoesTotal ? `${pessoa.quantidadeOperacoesTotal} ${pessoa.periodoOperacoesTotal || 'dias'}` : ''
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

          // IA
          if (ia) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('IA - Configuração:', 14, yPosition)
            yPosition += 6
            doc.setFont('helvetica', 'normal')
            doc.text(`Precisa Validação: ${ia.precisaValidacao ? 'Sim' : 'Não'}`, 14, yPosition)
            yPosition += 6

            if (ia.ias && ia.ias.length > 0) {
              const iaTable = [
                ['Nome', 'Tempo Exec.', 'Qtd. Operações', 'Precisão', 'Taxa Erro']
              ]

              ia.ias.forEach(iaItem => {
                iaTable.push([
                  iaItem.nome || '',
                  iaItem.tempoExecucao ? `${iaItem.tempoExecucao} min` : '',
                  iaItem.quantidadeOperacoes ? `${iaItem.quantidadeOperacoes} ${iaItem.periodoOperacoes || 'dias'}` : '',
                  iaItem.precisao ? `${iaItem.precisao}%` : '',
                  iaItem.taxaErro ? `${iaItem.taxaErro}%` : ''
                ])
              })

              autoTable(doc, {
                startY: yPosition,
                head: [iaTable[0]],
                body: iaTable.slice(1),
                theme: 'striped',
                headStyles: { fillColor: [34, 197, 94] },
                styles: { fontSize: 8 }
              })
              yPosition = doc.lastAutoTable.finalY + 10
            }
          }

          // Custos
          if (custos?.custos && custos.custos.length > 0) {
            yPosition += 3
            doc.setFont('helvetica', 'bold')
            doc.text('Custos:', 14, yPosition)
            yPosition += 6

            const custosTable = [
              ['Nome', 'Valor', 'Tipo']
            ]

            custos.custos.forEach(custo => {
              custosTable.push([
                custo.nome || '',
                custo.valor ? formatarMoeda(custo.valor) : '',
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
  exportProjectToCSV(projectId) {
    try {
      const project = projectService.getById(projectId)
      if (!project) {
        return { success: false, error: 'Projeto não encontrado' }
      }

      const indicators = indicatorService.getByProjectId(projectId)
      const completeIndicators = indicators.map(ind => 
        indicatorService.getCompleteById(ind.id)
      ).filter(Boolean)

      const metricas = calcularROIProjeto(projectId, completeIndicators)

      // Prepara dados para CSV
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
      completeIndicators.forEach((indicator, index) => {
        const info = indicatorDataService.getInfo(indicator.id)
        const baseline = indicatorDataService.getBaseline(indicator.id)
        const ia = indicatorDataService.getIA(indicator.id)
        const custos = indicatorDataService.getCustos(indicator.id)

        csvData.push([`INDICADOR ${index + 1}`])
        csvData.push(['Nome', info?.nome || ''])
        csvData.push(['Tipo', info?.tipoIndicador || ''])
        csvData.push(['Descrição', info?.descricao || ''])
        csvData.push([])

        // Campos específicos
        if (info?.camposEspecificos && Object.keys(info.camposEspecificos).length > 0) {
          csvData.push(['Campos de Cálculo'])
          Object.entries(info.camposEspecificos).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              csvData.push([key, value])
            }
          })
          csvData.push([])
        }

        // Baseline
        if (baseline?.pessoas && baseline.pessoas.length > 0) {
          csvData.push(['BASELINE - PESSOAS'])
          csvData.push(['Nome', 'Função', 'Valor/Hora', 'Tempo Operação', 'Quantidade Operações', 'Período'])
          baseline.pessoas.forEach(pessoa => {
            csvData.push([
              pessoa.nome || '',
              pessoa.funcao || '',
              pessoa.valorHora || '',
              pessoa.tempoOperacao || '',
              pessoa.quantidadeOperacoesTotal || '',
              pessoa.periodoOperacoesTotal || ''
            ])
          })
          csvData.push([])
        }

        // IA
        if (ia) {
          csvData.push(['IA - CONFIGURAÇÃO'])
          csvData.push(['Precisa Validação', ia.precisaValidacao ? 'Sim' : 'Não'])
          csvData.push([])

          if (ia.ias && ia.ias.length > 0) {
            csvData.push(['IA - LISTA'])
            csvData.push(['Nome', 'Tempo Execução', 'Quantidade Operações', 'Período', 'Precisão', 'Taxa Erro', 'Custo por Operação'])
            ia.ias.forEach(iaItem => {
              csvData.push([
                iaItem.nome || '',
                iaItem.tempoExecucao || '',
                iaItem.quantidadeOperacoes || '',
                iaItem.periodoOperacoes || '',
                iaItem.precisao || '',
                iaItem.taxaErro || '',
                iaItem.custoPorOperacao || ''
              ])
            })
            csvData.push([])
          }
        }

        // Custos
        if (custos?.custos && custos.custos.length > 0) {
          csvData.push(['CUSTOS'])
          csvData.push(['Nome', 'Valor', 'Tipo'])
          custos.custos.forEach(custo => {
            csvData.push([
              custo.nome || '',
              custo.valor || '',
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

// Tipos para dados de Pós-IA (cenário após implementação)

import { IndicatorType, ProdutividadePerson, CustosRelacionadosTool } from './baseline'

// Pessoas de Produtividade no Pós-IA (herda do Baseline)
export interface PostIAProdutividadePerson {
  id: string
  nome: string
  cargo: string
  valorHora: number
  tempoGasto: number // Novo tempo após IA
  frequenciaReal: {
    quantidade: number
    periodo: 'Diário' | 'Semanal' | 'Mensal'
  }
  frequenciaDesejada: {
    quantidade: number
    periodo: 'Diário' | 'Semanal' | 'Mensal'
  }
}

// Ferramentas de Custos Relacionados no Pós-IA (herda do Baseline + campo extra)
export interface PostIACustosRelacionadosTool {
  id: string
  nomeFerramenta: string
  custoMensal: number
  outrosCustos: number
  custoImplementacao: number // Campo exclusivo do Pós-IA
}

// Baseline para cálculos de Delta
export interface BaselineReference {
  tipo: IndicatorType
  pessoas?: ProdutividadePerson[]
  valorReceitaAntes?: number
  ferramentas?: CustosRelacionadosTool[]
}

// Dados de Pós-IA por tipo
export interface PostIAProdutividade {
  tipo: 'PRODUTIVIDADE'
  pessoaEnvolvida?: boolean // Campo para escolher se houve pessoa envolvida
  pessoas: PostIAProdutividadePerson[]
  custoTotalPostIA: number
  deltaProdutividade: number // Calculado: (HH Antes - HH Depois) × Valor Hora
}

export interface PostIAIncrementoReceita {
  tipo: 'INCREMENTO RECEITA'
  valorReceitaDepois: number
  deltaReceita: number // Calculado: Receita Depois - Receita Antes
}

export interface PostIACustosRelacionados {
  tipo: 'CUSTOS RELACIONADOS'
  ferramentas: PostIACustosRelacionadosTool[]
  custoTotalImplementacao: number // Soma dos custos de implementação
}

export interface PostIAOutros {
  tipo: 'OUTROS'
  nomeIndicador: string
  valorIndicadorDepois: number
  deltaIndicador: number
}

export interface PostIACapacidadeAnalitica {
  tipo: 'CAPACIDADE ANALÍTICA'
  camposQualitativos: Array<{
    id: string
    criterio: string
    valor: string
  }>
}

export interface PostIAMelhoriaMargem {
  tipo: 'MELHORIA MARGEM'
  receitaBrutaMensalEstimada: number    // R$
  custoTotalMensalEstimado: number      // R$
  margemBrutaEstimada: number           // %
  volumeTransacoesEstimado: number      // quantidade/mês
  // Métricas calculadas
  deltaMargem: number                   // % (margem estimada - margem atual)
  deltaMargemReais: number              // R$ (delta em valores absolutos)
  economiaMensal: number                // R$
  economiaAnual: number                 // R$
}

export interface PostIAReducaoRisco {
  tipo: 'REDUÇÃO DE RISCO'
  probabilidadeComIA: number             // 0-100 (%)
  impactoFinanceiroReduzido: number      // R$
  frequenciaAvaliacaoComIA: number       // vezes por período
  periodoAvaliacaoComIA: 'dia' | 'semana' | 'mês' | 'ano'
  custoMitigacaoComIA: number           // R$/mês
  // Métricas calculadas
  reducaoProbabilidade: number          // % (prob atual - prob com IA)
  valorRiscoEvitado: number             // R$ (diferença de exposição)
  economiaMitigacao: number             // R$/mês (custo atual - custo com IA)
  beneficioAnual: number                // R$ (economia + valor evitado)
  custoVsBeneficio: number              // Razão benefício/custo
  roiReducaoRisco: number               // % ROI
}

export interface PostIAQualidadeDecisao {
  tipo: 'QUALIDADE DECISÃO'
  numeroDecisoesPeriodoComIA: number      // quantidade de decisões com IA
  periodoComIA: 'dia' | 'semana' | 'mês' // período de referência
  taxaAcertoComIA: number                 // % (0-100)
  custoMedioDecisaoErradaComIA: number    // R$
  tempoMedioDecisaoComIA: number          // em minutos
  pessoasEnvolvidasComIA: number          // quantidade
  // Métricas calculadas (6 outputs)
  melhoriaTaxaAcerto: number              // % (taxa com IA - taxa atual)
  economiaErrosEvitados: number           // R$/mês
  economiaTempo: number                   // horas/mês
  valorTempoEconomizado: number           // R$
  beneficioTotalMensal: number            // R$
  roiMelhoria: number                     // %
}

export interface PostIAVelocidade {
  tipo: 'VELOCIDADE'
  tempoDepoisProcesso: number
  unidadeTempo: 'minutos' | 'horas' | 'dias'
  deltaTempo: number
}

export interface PostIASatisfacao {
  tipo: 'SATISFAÇÃO'
  scoreDepois: number
  tipoScore: 'NPS' | 'eNPS' | 'outro'
  deltaScore: number
}

export type PostIAData =
  | PostIAProdutividade
  | PostIAIncrementoReceita
  | PostIACustosRelacionados
  | PostIAOutros
  | PostIACapacidadeAnalitica
  | PostIAMelhoriaMargem
  | PostIAReducaoRisco
  | PostIAQualidadeDecisao
  | PostIAVelocidade
  | PostIASatisfacao

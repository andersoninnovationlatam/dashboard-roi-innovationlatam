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
  margemDepois: number
  tipoMargem: 'percentual' | 'valor'
  deltaMargem: number
}

export interface PostIAReducaoRisco {
  tipo: 'REDUÇÃO DE RISCO'
  probabilidadeDepois: number
  impactoFinanceiroDepois: number
  valorEvitadoDepois: number
  deltaValorEvitado: number
}

export interface PostIAQualidadeDecisao {
  tipo: 'QUALIDADE DECISÃO'
  criterios: Array<{
    id: string
    nome: string
    avaliacao: number
  }>
  scoreMedioDepois: number
  deltaScore: number
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

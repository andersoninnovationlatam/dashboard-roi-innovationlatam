// Tipos para dados de Baseline

export type IndicatorType = 
  | 'PRODUTIVIDADE'
  | 'INCREMENTO RECEITA'
  | 'CUSTOS RELACIONADOS'
  | 'OUTROS'
  | 'CAPACIDADE ANALÍTICA'
  | 'MELHORIA MARGEM'
  | 'REDUÇÃO DE RISCO'
  | 'QUALIDADE DECISÃO'
  | 'VELOCIDADE'
  | 'SATISFAÇÃO'

export interface ProdutividadePerson {
  id: string
  nome: string
  cargo: string
  valorHora: number
  tempoGasto: number // em minutos
  frequenciaReal: {
    quantidade: number
    periodo: 'Diário' | 'Semanal' | 'Mensal'
  }
  frequenciaDesejada: {
    quantidade: number
    periodo: 'Diário' | 'Semanal' | 'Mensal'
  }
}

export interface ProdutividadeBaseline {
  tipo: 'PRODUTIVIDADE'
  pessoas: ProdutividadePerson[]
  custoTotalBaseline: number
}

export interface IncrementoReceitaBaseline {
  tipo: 'INCREMENTO RECEITA'
  valorReceitaAntes: number
}

export interface CustosRelacionadosTool {
  id: string
  nomeFerramenta: string
  custoMensal: number
  outrosCustos: number
}

export interface CustosRelacionadosBaseline {
  tipo: 'CUSTOS RELACIONADOS'
  ferramentas: CustosRelacionadosTool[]
}

export interface OutrosBaseline {
  tipo: 'OUTROS'
  nomeIndicador: string
  valorIndicador: number
}

export interface CapacidadeAnaliticaBaseline {
  tipo: 'CAPACIDADE ANALÍTICA'
  camposQualitativos: Array<{
    id: string
    criterio: string
    valor: string
  }>
}

export interface MelhoriaMargemBaseline {
  tipo: 'MELHORIA MARGEM'
  receitaBrutaMensal: number        // R$
  custoTotalMensal: number           // R$
  margemBrutaAtual: number           // %
  volumeTransacoes: number           // quantidade/mês
}

export interface ReducaoRiscoBaseline {
  tipo: 'REDUÇÃO DE RISCO'
  tipoRisco: string                      // Descrição do tipo de risco
  probabilidadeAtual: number             // 0-100 (%)
  impactoFinanceiro: number              // R$
  frequenciaAvaliacao: number            // vezes por período
  periodoAvaliacao: 'dia' | 'semana' | 'mês' | 'ano'
  custoMitigacaoAtual: number           // R$/mês
}

export interface QualidadeDecisaoBaseline {
  tipo: 'QUALIDADE DECISÃO'
  criterios: Array<{
    id: string
    nome: string
    avaliacao: number // 0-100
  }>
  scoreMedio: number // Calculado
}

export interface VelocidadeBaseline {
  tipo: 'VELOCIDADE'
  tempoInicialProcesso: number // em minutos ou horas
  unidadeTempo: 'minutos' | 'horas' | 'dias'
}

export interface SatisfacaoBaseline {
  tipo: 'SATISFAÇÃO'
  scoreAtual: number // 0-100
  tipoScore: 'NPS' | 'eNPS' | 'outro'
}

export type BaselineData = 
  | ProdutividadeBaseline
  | IncrementoReceitaBaseline
  | CustosRelacionadosBaseline
  | OutrosBaseline
  | CapacidadeAnaliticaBaseline
  | MelhoriaMargemBaseline
  | ReducaoRiscoBaseline
  | QualidadeDecisaoBaseline
  | VelocidadeBaseline
  | SatisfacaoBaseline

// Descrições e métricas principais para tooltips
export interface IndicatorTypeInfo {
  descricao: string
  metricaPrincipal: string
}

export const INDICATOR_TYPE_INFO: Record<IndicatorType, IndicatorTypeInfo> = {
  'PRODUTIVIDADE': {
    descricao: 'Custo total das Horas Investidas Antes (HH×Custo). Mede a redução de tempo em tarefas existentes.',
    metricaPrincipal: 'Custo Total Baseline = Σ(Pessoas × Valor Hora × Tempo × Frequência Real)'
  },
  'INCREMENTO RECEITA': {
    descricao: 'Receita Antes. Aumento direto na receita através de novas oportunidades ou otimização de vendas.',
    metricaPrincipal: 'Valor da Receita Antes (R$)'
  },
  'CUSTOS RELACIONADOS': {
    descricao: 'Economia Financeira. Custos associados a ferramentas, serviços e outros recursos necessários para o processo.',
    metricaPrincipal: 'Custo Total = Σ(Custo Mensal + Outros Custos)'
  },
  'OUTROS': {
    descricao: 'Personalizado. Indicadores personalizados que não se enquadram nas categorias padrão.',
    metricaPrincipal: 'Valor do Indicador'
  },
  'CAPACIDADE ANALÍTICA': {
    descricao: 'Novos insights/decisões. Capacidade de gerar análises e insights que não eram possíveis antes.',
    metricaPrincipal: 'Campos qualitativos de análise'
  },
  'MELHORIA MARGEM': {
    descricao: 'Melhoria na margem de lucro através de otimização de processos ou redução de custos.',
    metricaPrincipal: 'Receita Bruta Mensal, Custo Total Mensal, Margem Bruta Atual (%), Volume de Transações'
  },
  'REDUÇÃO DE RISCO': {
    descricao: 'R$ evitados. Redução de riscos financeiros através de prevenção ou mitigação.',
    metricaPrincipal: 'Valor Evitado = Probabilidade × Impacto Financeiro'
  },
  'QUALIDADE DECISÃO': {
    descricao: 'Score qualitativo. Melhoria na qualidade das decisões tomadas através de dados e análises.',
    metricaPrincipal: 'Avaliação de critérios de decisão (0-100)'
  },
  'VELOCIDADE': {
    descricao: 'Tempo de ciclo. Redução no tempo necessário para completar processos ou entregas.',
    metricaPrincipal: 'Tempo Inicial do Processo'
  },
  'SATISFAÇÃO': {
    descricao: 'NPS, eNPS. Melhoria na satisfação de clientes ou funcionários.',
    metricaPrincipal: 'Score atual de satisfação (0-100)'
  }
}

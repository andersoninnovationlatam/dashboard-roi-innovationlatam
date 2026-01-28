// Configuração dos tipos de indicadores e seus campos específicos

export const TIPOS_INDICADOR = [
  'Produtividade',
  'Capacidade Analítica',
  'Incremento Receita',
  'Melhoria Margem',
  'Redução de Risco',
  'Qualidade Decisão',
  'Velocidade',
  'Satisfação'
]

// Configuração de campos por tipo de indicador
export const CAMPOS_POR_TIPO = {
  'Produtividade': {
    info: [
      { key: 'tempoAntes', label: 'Tempo Antes (min)', type: 'number', required: true },
      { key: 'tempoDepois', label: 'Tempo Depois (min)', type: 'number', required: true },
      { key: 'frequencia', label: 'Frequência', type: 'number', required: true },
      { key: 'periodoFrequencia', label: 'Período da Frequência', type: 'select', options: ['Por dia', 'Por semana', 'Por mês'], required: true },
      { key: 'custoHora', label: 'Custo/Hora (R$)', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: true,
      mostraTempoEntrega: true,
      mostraValorHora: true,
      mostraQuantidadeOperacoes: true,
      mostraValorPorAnalise: false
    },
    ia: {
      mostraTempoExecucao: true,
      mostraQuantidadeOperacoes: true,
      mostraValorPorAnalise: false
    }
  },
  'Capacidade Analítica': {
    info: [
      { key: 'valorDecisao', label: 'Valor da Decisão (R$)', type: 'number', required: true },
      { key: 'frequencia', label: 'Frequência de Análises', type: 'number', required: true },
      { key: 'periodoFrequencia', label: 'Período da Frequência', type: 'select', options: ['Por dia', 'Por semana', 'Por mês'], required: true }
    ],
    baseline: {
      mostraTempoOperacao: false,
      mostraTempoEntrega: false,
      mostraValorHora: false,
      mostraQuantidadeOperacoes: true,
      mostraValorPorAnalise: true
    },
    ia: {
      mostraTempoExecucao: false,
      mostraQuantidadeOperacoes: true,
      mostraValorPorAnalise: true
    }
  },
  'Incremento Receita': {
    info: [
      { key: 'receitaNova', label: 'Receita Nova (R$)', type: 'number', required: true },
      { key: 'receitaBase', label: 'Receita Base (R$)', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: false,
      mostraTempoEntrega: false,
      mostraValorHora: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    },
    ia: {
      mostraTempoExecucao: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    }
  },
  'Melhoria Margem': {
    info: [
      { key: 'margemNova', label: 'Margem Nova (%)', type: 'number', required: true },
      { key: 'margemAntiga', label: 'Margem Antiga (%)', type: 'number', required: true },
      { key: 'volume', label: 'Volume', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: false,
      mostraTempoEntrega: false,
      mostraValorHora: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    },
    ia: {
      mostraTempoExecucao: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    }
  },
  'Redução de Risco': {
    info: [
      { key: 'probabilidade', label: 'Probabilidade (%)', type: 'number', required: true },
      { key: 'impactoEvitado', label: 'Impacto Evitado (R$)', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: false,
      mostraTempoEntrega: false,
      mostraValorHora: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false,
      mostraImpactoEvitado: true
    },
    ia: {
      mostraTempoExecucao: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false,
      mostraImpactoEvitado: true
    }
  },
  'Qualidade Decisão': {
    info: [
      { key: 'avaliacaoAntes', label: 'Avaliação Antes (0-100)', type: 'number', required: true },
      { key: 'avaliacaoDepois', label: 'Avaliação Depois (0-100)', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: false,
      mostraTempoEntrega: false,
      mostraValorHora: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    },
    ia: {
      mostraTempoExecucao: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    }
  },
  'Velocidade': {
    info: [
      { key: 'reducaoPercentual', label: 'Redução % no Tempo de Entrega', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: true,
      mostraTempoEntrega: true,
      mostraValorHora: true,
      mostraQuantidadeOperacoes: true,
      mostraValorPorAnalise: false
    },
    ia: {
      mostraTempoExecucao: true,
      mostraQuantidadeOperacoes: true,
      mostraValorPorAnalise: false
    }
  },
  'Satisfação': {
    info: [
      { key: 'deltaScore', label: 'Delta em Score (0-100)', type: 'number', required: true }
    ],
    baseline: {
      mostraTempoOperacao: false,
      mostraTempoEntrega: false,
      mostraValorHora: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    },
    ia: {
      mostraTempoExecucao: false,
      mostraQuantidadeOperacoes: false,
      mostraValorPorAnalise: false
    }
  }
}

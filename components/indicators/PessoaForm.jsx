import React from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import InputWithPeriod from './InputWithPeriod'

const PessoaForm = ({ pessoa, index, onUpdate, onRemove, title = `Pessoa ${index + 1}`, tipoIndicador, camposConfig }) => {
  const mostraTempoOperacao = camposConfig?.mostraTempoOperacao !== false
  const mostraTempoEntrega = camposConfig?.mostraTempoEntrega !== false
  const mostraValorHora = camposConfig?.mostraValorHora !== false
  const mostraQuantidadeOperacoes = camposConfig?.mostraQuantidadeOperacoes !== false
  const mostraValorPorAnalise = camposConfig?.mostraValorPorAnalise === true
  const mostraImpactoEvitado = camposConfig?.mostraImpactoEvitado === true

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h4>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
          size="sm"
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
        >
          <i className="fas fa-trash mr-2"></i>
          Remover
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Nome"
          value={pessoa.nome || ''}
          onChange={(e) => onUpdate('nome', e.target.value)}
          placeholder="Nome da pessoa"
        />
        <Input
          label="Função"
          value={pessoa.funcao || ''}
          onChange={(e) => onUpdate('funcao', e.target.value)}
          placeholder="Função/Cargo"
        />
        {mostraValorHora && (
          <Input
            label="Valor Hora (R$)"
            type="number"
            min="0"
            step="0.01"
            value={pessoa.valorHora || ''}
            onChange={(e) => onUpdate('valorHora', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          />
        )}
        {mostraTempoOperacao && (
          <Input
            label="Tempo de Operação (min)"
            type="number"
            min="0"
            step="0.1"
            value={pessoa.tempoOperacao || ''}
            onChange={(e) => onUpdate('tempoOperacao', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          />
        )}
        {mostraTempoEntrega && (
          <Input
            label="Tempo de Entrega (dias)"
            type="number"
            min="0"
            step="1"
            value={pessoa.tempoEntrega || ''}
            onChange={(e) => onUpdate('tempoEntrega', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          />
        )}
        {mostraQuantidadeOperacoes && (
          <InputWithPeriod
            label="Quantidade de Operações"
            description="Frequência das operações"
            value={pessoa.quantidadeOperacoesTotal || ''}
            periodValue={pessoa.periodoOperacoesTotal || 'dias'}
            onValueChange={(value) => onUpdate('quantidadeOperacoesTotal', value === '' ? '' : value)}
            onPeriodChange={(value) => onUpdate('periodoOperacoesTotal', value)}
          />
        )}
        {mostraValorPorAnalise && (
          <Input
            label="Valor Médio por Análise (R$)"
            type="number"
            min="0"
            step="0.01"
            value={pessoa.valorPorAnalise || ''}
            onChange={(e) => onUpdate('valorPorAnalise', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
            placeholder="Valor gerado por cada análise"
          />
        )}
        {mostraImpactoEvitado && (
          <Input
            label="Impacto Evitado (R$)"
            type="number"
            min="0"
            step="0.01"
            value={pessoa.impactoEvitado || ''}
            onChange={(e) => onUpdate('impactoEvitado', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
            placeholder="Valor do impacto evitado"
          />
        )}
      </div>
    </div>
  )
}

export default PessoaForm

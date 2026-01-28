import React from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import InputWithPeriod from './InputWithPeriod'

const IAForm = ({ ia, index, onUpdate, onRemove, tipoIndicador, camposConfig }) => {
  const mostraTempoExecucao = camposConfig?.mostraTempoExecucao !== false
  const mostraQuantidadeOperacoes = camposConfig?.mostraQuantidadeOperacoes !== false
  const mostraValorPorAnalise = camposConfig?.mostraValorPorAnalise === true
  const mostraImpactoEvitado = camposConfig?.mostraImpactoEvitado === true

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white"></i>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">IA {index + 1}</h4>
        </div>
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
          label="Nome da IA"
          value={ia.nome || ''}
          onChange={(e) => onUpdate('nome', e.target.value)}
          placeholder="Ex: GPT-4, Claude, Gemini"
        />
        {mostraTempoExecucao && (
          <Input
            label="Tempo de Execução (min)"
            type="number"
            min="0"
            step="0.1"
            value={ia.tempoExecucao || ''}
            onChange={(e) => onUpdate('tempoExecucao', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          />
        )}
        {mostraQuantidadeOperacoes && (
          <InputWithPeriod
            label="Quantidade de Operações"
            description="Frequência das operações"
            value={ia.quantidadeOperacoes || ''}
            periodValue={ia.periodoOperacoes || 'dias'}
            onValueChange={(value) => onUpdate('quantidadeOperacoes', value === '' ? '' : value)}
            onPeriodChange={(value) => onUpdate('periodoOperacoes', value)}
          />
        )}
        {mostraValorPorAnalise && (
          <Input
            label="Valor Médio por Análise (R$)"
            type="number"
            min="0"
            step="0.01"
            value={ia.valorPorAnalise || ''}
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
            value={ia.impactoEvitado || ''}
            onChange={(e) => onUpdate('impactoEvitado', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
            placeholder="Valor do impacto evitado"
          />
        )}
        <Input
          label="Capacidade de Processamento"
          type="number"
          min="0"
          step="1"
          value={ia.capacidadeProcessamento || ''}
          onChange={(e) => onUpdate('capacidadeProcessamento', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          placeholder="Operações/hora"
        />
        <Input
          label="Precisão (%)"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={ia.precisao || ''}
          onChange={(e) => onUpdate('precisao', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          placeholder="0-100"
        />
        <Input
          label="Taxa de Erro (%)"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={ia.taxaErro || ''}
          onChange={(e) => onUpdate('taxaErro', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
          placeholder="0-100"
        />
        <Input
          label="Custo por Operação (R$)"
          type="number"
          min="0"
          step="0.01"
          value={ia.custoPorOperacao || ''}
          onChange={(e) => onUpdate('custoPorOperacao', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
        />
      </div>
    </div>
  )
}

export default IAForm

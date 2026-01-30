import React from 'react'
import Input from '../common/Input'
import Button from '../common/Button'

const CustoForm = ({ custo, index, onUpdate, onRemove }) => {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-coins text-white"></i>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Custo {index + 1}</h4>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Nome do Custo"
          value={custo.nome || ''}
          onChange={(e) => onUpdate('nome', e.target.value)}
          placeholder="Ex: Licença de Software"
        />
        <Input
          label="Valor (R$)"
          type="number"
          min="0"
          step="0.01"
          value={custo.valor || ''}
          onChange={(e) => onUpdate('valor', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
        />
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-300">
            Tipo
          </label>
          <select
            value={custo.tipo || 'mensal'}
            onChange={(e) => onUpdate('tipo', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
            <option value="unico">Único</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default CustoForm

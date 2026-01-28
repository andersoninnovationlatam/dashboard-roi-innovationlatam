import React from 'react'

const InputWithPeriod = ({ 
  label, 
  description,
  value, 
  periodValue,
  onValueChange,
  onPeriodChange,
  placeholder = "Quantidade"
}) => {
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</p>
      )}
      <div className="flex gap-2 w-full">
        <input
          type="number"
          min="0"
          step="1"
          value={value === 0 ? '' : value}
          onChange={(e) => {
            const val = e.target.value
            onValueChange(val === '' ? '' : (parseFloat(val) || ''))
          }}
          className="flex-1 min-w-0 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder={placeholder}
        />
        <select
          value={periodValue || 'dias'}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-[130px] flex-shrink-0 transition-all"
          title="Frequência: quantas operações por dia, semana ou mês"
        >
          <option value="dias">Por dia</option>
          <option value="semanas">Por semana</option>
          <option value="meses">Por mês</option>
        </select>
      </div>
    </div>
  )
}

export default InputWithPeriod

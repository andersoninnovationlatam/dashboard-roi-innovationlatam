import React from 'react'
import Card from '../common/Card'

/**
 * Componente de Card de KPI para Dashboard
 * Exibe métricas principais com ícone e valor formatado
 * 
 * @param {string} label - Rótulo do card (ex: "Economia Líquida/Ano")
 * @param {string|number} value - Valor a ser exibido (já formatado)
 * @param {string} icon - Classe do ícone FontAwesome (ex: "fas fa-piggy-bank")
 * @param {'green'|'cyan'|'purple'|'blue'|'red'|'yellow'} color - Cor do tema do card
 * @param {string} subLabel - Rótulo secundário opcional (ex: "/ano")
 * @param {boolean} isPositive - Se true, usa cor positiva; se false, usa vermelho (para valores negativos)
 */
/**
 * Verifica se um valor é válido para exibição (não é null, undefined, NaN, ou string vazia)
 */
const isValidValue = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return false
  return true
}

const KPICard = ({
  label,
  value,
  icon,
  color = 'blue',
  subLabel,
  isPositive = true
}) => {
  // Se o valor não for válido, não renderiza o card
  if (!isValidValue(value)) {
    return null
  }

  const colorClasses = {
    green: {
      bg: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/20',
      text: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    cyan: {
      bg: 'from-cyan-500/10 to-blue-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400'
    },
    purple: {
      bg: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/20',
      text: isPositive ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    blue: {
      bg: 'from-blue-500/10 to-indigo-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    red: {
      bg: 'from-red-500/10 to-rose-500/10',
      border: 'border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    yellow: {
      bg: 'from-yellow-500/10 to-amber-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    }
  }

  const colors = colorClasses[color] || colorClasses.blue

  return (
    <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} overflow-hidden h-full`}>
      <div className="flex items-center justify-between gap-3 min-w-0 h-full">
        {/* Conteúdo do texto - flex-1 com min-w-0 para permitir shrink */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">
            {label}
          </p>
          <p className={`text-lg sm:text-sm xl:text-lg font-bold ${colors.text} break-words leading-tight`}>
            {value}
          </p>
          {subLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subLabel}
            </p>
          )}
        </div>

        {/* Ícone - flex-shrink-0 para não encolher */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <i className={`${icon} text-lg sm:text-xl lg:text-3xl ${colors.iconColor}`}></i>
        </div>
      </div>
    </Card>
  )
}

export default KPICard

import React from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Componente de diálogo de mensagem para sucesso, erro ou informação
 * Substitui os alerts nativos do navegador
 */
export const MessageDialog = ({
  isOpen,
  type = 'info', // 'success' | 'error' | 'info' | 'warning'
  title,
  message,
  onClose
}) => {
  if (!isOpen) return null

  const typeStyles = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      titleColor: 'text-green-900 dark:text-green-100',
      button: 'bg-green-600 hover:bg-green-700 text-white'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      titleColor: 'text-red-900 dark:text-red-100',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      titleColor: 'text-yellow-900 dark:text-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      titleColor: 'text-blue-900 dark:text-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const styles = typeStyles[type] || typeStyles.info
  const Icon = styles.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border-2 ${styles.border} animate-in zoom-in-95`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
              <Icon className={`w-5 h-5 ${styles.iconColor}`} />
            </div>
            <h3 className={`text-xl font-bold ${styles.titleColor}`}>
              {title || (type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : 'Informação')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className={`px-6 py-3 ${styles.button} rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageDialog

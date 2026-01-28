import React from 'react'
import { X, AlertTriangle } from 'lucide-react'

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200 dark:border-red-800'
    },
    warning: {
      icon: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    info: {
      icon: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-200 dark:border-blue-800'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border-2 border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.icon.replace('text-', 'bg-').replace('-600', '-100').replace('-400', '-900/20')}`}>
              <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
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
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 ${styles.button} rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

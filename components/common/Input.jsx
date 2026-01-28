import React from 'react'

const Input = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
        } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default Input

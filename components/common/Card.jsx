import React from 'react'

const Card = ({ 
  children, 
  title, 
  icon, 
  className = '',
  borderColor,
  ...props 
}) => {
  const borderClass = borderColor 
    ? `border-${borderColor}/20 dark:border-${borderColor}/30` 
    : 'border-slate-200 dark:border-slate-700'
  
  return (
    <div 
      className={`bg-white dark:bg-slate-800/50 border ${borderClass} rounded-2xl p-6 shadow-sm ${className}`}
      {...props}
    >
      {title && (
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {icon && <i className={`${icon} mr-2`}></i>}
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

export default Card

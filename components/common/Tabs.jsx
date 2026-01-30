import React, { useState, useEffect, useRef } from 'react'

const Tabs = ({ tabs, defaultTab = 0, children, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const isInitialMount = useRef(true)
  const lastDefaultTab = useRef(defaultTab)

  // Atualizar quando defaultTab mudar externamente (mas não resetar em re-renders)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastDefaultTab.current = defaultTab
      return
    }
    
    // Só atualiza se defaultTab realmente mudou (não é apenas um re-render)
    if (defaultTab !== lastDefaultTab.current) {
      setActiveTab(defaultTab)
      lastDefaultTab.current = defaultTab
    }
  }, [defaultTab])

  const handleTabChange = (index) => {
    setActiveTab(index)
    lastDefaultTab.current = index
    if (onChange) {
      onChange(index)
    }
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-8 break-inside-avoid">
        <nav className="flex space-x-2" role="tablist">
          {tabs.map((tab, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              onClick={() => handleTabChange(index)}
              className={`px-6 py-3 text-base font-semibold rounded-t-lg transition-all ${
                index === activeTab
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.icon && <i className={`${tab.icon} mr-2`}></i>}
              {tab.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {React.Children.map(children, (child, index) => {
          if (index === activeTab) {
            return (
              <div data-tab-content={index} className="break-inside-avoid">
                {child}
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

export default Tabs

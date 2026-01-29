import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const menuItems = [
    {
      icon: 'fas fa-folder',
      label: 'Projetos',
      path: '/projects',
      exact: false
    }
    // {
    //   icon: 'fas fa-chart-bar',
    //   label: 'Relatórios',
    //   path: '/reports',
    //   exact: false
    // }
  ]

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <Link to="/projects" className="flex items-center" onClick={() => isOpen && onClose()}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Dashboard ROI</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">SaaS Platform</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose()
                      }
                    }}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path, item.exact)
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <i className={`${item.icon} w-5 mr-3`}></i>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <Link
              to="/settings"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/settings', false)
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fas fa-cog w-5 mr-3"></i>
              <span className="font-medium">Configurações</span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
              © {new Date().getFullYear()} Dashboard ROI
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

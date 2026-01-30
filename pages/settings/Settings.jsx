import React from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const Settings = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Gerencie suas preferências e configurações da conta</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            <i className="fas fa-user mr-2 text-blue-500"></i>
            Perfil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={user?.nome || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <Button variant="outline" className="w-full">
              <i className="fas fa-edit mr-2"></i>
              Editar Perfil
            </Button>
          </div>
        </Card>

        {/* Aparência */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            <i className="fas fa-palette mr-2 text-purple-500"></i>
            Aparência
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tema
              </label>
              <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {theme === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  {theme === 'dark' ? (
                    <i className="fas fa-sun text-xl"></i>
                  ) : (
                    <i className="fas fa-moon text-xl"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Notificações */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            <i className="fas fa-bell mr-2 text-yellow-500"></i>
            Notificações
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Notificações por Email</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Receba atualizações por email</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Alertas de ROI</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notificações sobre métricas importantes</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
            </label>
          </div>
        </Card>

        {/* Segurança */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            <i className="fas fa-shield-alt mr-2 text-green-500"></i>
            Segurança
          </h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full">
              <i className="fas fa-key mr-2"></i>
              Alterar Senha
            </Button>
            <Button variant="outline" className="w-full">
              <i className="fas fa-download mr-2"></i>
              Exportar Dados
            </Button>
          </div>
        </Card>
      </div>
      {/* Versão no canto inferior direito */}
      <div className="fixed bottom-4 right-4 text-xs text-slate-400 dark:text-slate-500">
        v0.2.8
      </div>
    </div>
  )
}

export default Settings

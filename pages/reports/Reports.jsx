import React from 'react'
import { useParams } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import Card from '../../components/common/Card'
import Loading from '../../components/common/Loading'

const Reports = () => {
  const { id } = useParams()
  const { getProjectById, loading } = useData()
  
  const project = getProjectById(id)

  if (loading) {
    return <Loading />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Projeto não encontrado</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Relatórios
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Gere relatórios detalhados e exporte os dados do projeto
        </p>
      </div>

      <Card>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-file-alt text-4xl text-green-500 dark:text-green-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Módulo de Relatórios
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Em breve você poderá gerar e exportar relatórios completos de ROI
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Reports

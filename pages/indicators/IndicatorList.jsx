import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Loading from '../../components/common/Loading'

const IndicatorList = () => {
  const { id } = useParams()
  const { getProjectById, getIndicatorsByProjectId, loading } = useData()
  
  const project = getProjectById(id)
  const indicators = getIndicatorsByProjectId(id)

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Indicadores
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie os indicadores de ROI do projeto
          </p>
        </div>
        <Link to={`/projects/${id}/indicators/new`}>
          <Button>
            <i className="fas fa-plus mr-2"></i>
            Novo Indicador
          </Button>
        </Link>
      </div>

      {indicators.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-chart-bar text-4xl text-purple-500 dark:text-purple-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum indicador encontrado
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Comece criando seu primeiro indicador de ROI
            </p>
            <Link to={`/projects/${id}/indicators/new`}>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Criar Primeiro Indicador
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {indicators.map((indicator) => (
            <Link 
              key={indicator.id}
              to={`/projects/${id}/indicators/${indicator.id}/edit`}
              className="block group"
            >
              <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-purple-500/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-1">
                    {indicator.nome}
                  </h3>
                  {indicator.tipoIndicador && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold flex-shrink-0 ml-2">
                      {indicator.tipoIndicador}
                    </span>
                  )}
                </div>
                
                {indicator.descricao && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {indicator.descricao}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:underline">
                    Editar indicador
                  </span>
                  <i className="fas fa-arrow-right text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default IndicatorList

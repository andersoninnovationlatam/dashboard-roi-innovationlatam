import React from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Loading from '../../components/common/Loading'
import { formatarMoeda } from '../../utils/formatters'

const ProjectList = () => {
  const { projects, loading, calculateProjectROI } = useData()

  if (loading) {
    return <Loading />
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Meus Projetos
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie seus projetos de ROI e acompanhe os resultados
            </p>
          </div>
          <Link to="/projects/new">
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Novo Projeto
            </Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-folder-open text-5xl text-blue-500 dark:text-blue-400"></i>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Comece criando seu primeiro projeto de ROI para medir o retorno sobre investimento em IA e automação
            </p>
            <Link to="/projects/new">
              <Button size="lg">
                <i className="fas fa-plus mr-2"></i>
                Criar Primeiro Projeto
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const metricas = calculateProjectROI(project.id)
            return (
              <Link 
                key={project.id} 
                to={`/projects/${project.id}/dashboard`}
                className="block group"
              >
                <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-blue-500/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name || project.nome}
                      </h3>
                      {(project.department || project.area) && (
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                          {project.department || project.area}
                        </span>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-folder text-white text-xl"></i>
                    </div>
                  </div>
                  
                  {(project.description || project.descricao) && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">
                      {project.description || project.descricao}
                    </p>
                  )}

                  {/* Métricas rápidas */}
                  {metricas && metricas.totalIndicadores > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Indicadores</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {metricas.totalIndicadores}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Economia/Ano</p>
                        <p className={`text-lg font-bold ${metricas.economiaAnualTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatarMoeda(metricas.economiaAnualTotal)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botão de ação */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                      Ver detalhes
                    </span>
                    <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProjectList

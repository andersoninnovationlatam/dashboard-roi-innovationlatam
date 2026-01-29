import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Loading from '../../components/common/Loading'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'

const IndicatorList = () => {
  const { id } = useParams()
  const { getProjectById, getIndicatorsByProjectId, deleteIndicator, loading } = useData()
  
  const project = getProjectById(id)
  const [indicators, setIndicators] = useState([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(true)
  const [indicatorToDelete, setIndicatorToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Carrega indicadores de forma assíncrona
  useEffect(() => {
    const loadIndicators = async () => {
      if (!id) {
        setIndicators([])
        setIndicatorsLoading(false)
        return
      }

      setIndicatorsLoading(true)
      try {
        const projectIndicators = await getIndicatorsByProjectId(id)
        // Garante que sempre seja um array
        setIndicators(Array.isArray(projectIndicators) ? projectIndicators : [])
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error)
        setIndicators([])
      } finally {
        setIndicatorsLoading(false)
      }
    }

    loadIndicators()
  }, [id, getIndicatorsByProjectId])

  const handleDeleteClick = (e, indicatorId) => {
    e.preventDefault()
    e.stopPropagation()
    setIndicatorToDelete(indicatorId)
  }

  const handleConfirmDelete = async () => {
    if (!indicatorToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteIndicator(indicatorToDelete)
      if (result.success) {
        // Recarrega a lista de indicadores
        const projectIndicators = await getIndicatorsByProjectId(id)
        setIndicators(Array.isArray(projectIndicators) ? projectIndicators : [])
      } else {
        console.error('Erro ao deletar indicador:', result.error)
        alert('Erro ao deletar indicador: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao deletar indicador:', error)
      alert('Erro ao deletar indicador: ' + error.message)
    } finally {
      setIsDeleting(false)
      setIndicatorToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setIndicatorToDelete(null)
  }

  // Busca o nome do indicador para exibir no diálogo
  const getIndicatorName = (indicatorId) => {
    const indicator = indicators.find(ind => ind.id === indicatorId)
    if (!indicator) return 'este indicador'
    const infoData = indicator.info_data || {}
    return indicator.nome || infoData.nome || 'este indicador'
  }

  if (loading || indicatorsLoading) {
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
          {indicators.map((indicator) => {
            // Extrai nome e tipoIndicador do info_data se necessário
            const infoData = indicator.info_data || {}
            const nome = indicator.nome || infoData.nome || 'Indicador sem nome'
            const tipoIndicador = indicator.tipoIndicador || infoData.tipoIndicador
            const descricao = indicator.descricao || infoData.descricao

            return (
              <div key={indicator.id} className="relative group">
                <Link 
                  to={`/projects/${id}/indicators/${indicator.id}/edit`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-purple-500/50">
                    {/* Botão de exclusão - posicionado no canto superior direito */}
                    <button
                      onClick={(e) => handleDeleteClick(e, indicator.id)}
                      className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                      title="Excluir indicador"
                      aria-label="Excluir indicador"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>

                    <div className="flex justify-between items-start mb-4 pr-8">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-1">
                        {nome}
                      </h3>
                      {tipoIndicador && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold flex-shrink-0 ml-2">
                          {tipoIndicador}
                        </span>
                      )}
                    </div>
                    
                    {descricao && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {descricao}
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
              </div>
            )
          })}
        </div>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={indicatorToDelete !== null}
        title="Excluir Indicador"
        message={`Tem certeza que deseja excluir o indicador "${getIndicatorName(indicatorToDelete)}"? Esta ação não pode ser desfeita.`}
        confirmText={isDeleting ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  )
}

export default IndicatorList

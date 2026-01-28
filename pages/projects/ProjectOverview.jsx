import React, { useState, useEffect } from 'react'
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { exportService } from '../../services/exportService'
import Loading from '../../components/common/Loading'
import Button from '../../components/common/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'

const ProjectOverview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getProjectById, getIndicatorsByProjectId, calculateProjectROI, deleteProject, loading } = useData()
  
  const project = getProjectById(id)
  const [indicators, setIndicators] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/dashboard')) return 0
    if (location.pathname.includes('/reports')) return 1
    if (location.pathname.includes('/indicators')) return 2
    return 0
  })

  // Carrega indicadores e métricas de forma assíncrona
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const projectIndicators = await getIndicatorsByProjectId(id)
        setIndicators(projectIndicators)
        
        if (project) {
          const projectMetricas = await calculateProjectROI(id)
          setMetricas(projectMetricas)
        }
      }
    }
    loadData()
  }, [id, project, getIndicatorsByProjectId, calculateProjectROI])

  useEffect(() => {
    // Redireciona para dashboard se acessar a rota base do projeto
    if (location.pathname === `/projects/${id}`) {
      navigate(`/projects/${id}/dashboard`, { replace: true })
      return
    }
    
    if (location.pathname.includes('/dashboard')) setActiveTab(0)
    else if (location.pathname.includes('/reports')) setActiveTab(1)
    else if (location.pathname.includes('/indicators')) setActiveTab(2)
  }, [location.pathname, id, navigate])

  if (loading) {
    return <Loading />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Projeto não encontrado</p>
        <Button onClick={() => navigate('/projects')} className="mt-4">
          Voltar para Projetos
        </Button>
      </div>
    )
  }

  const tabs = [
    { 
      title: 'Dashboard', 
      icon: 'fas fa-chart-line',
      path: `/projects/${id}/dashboard`
    },
    { 
      title: 'Relatórios', 
      icon: 'fas fa-file-alt',
      path: `/projects/${id}/reports`
    },
    { 
      title: 'Indicadores', 
      icon: 'fas fa-list',
      path: `/projects/${id}/indicators`
    }
  ]

  const handleTabChange = (index) => {
    setActiveTab(index)
    navigate(tabs[index].path)
  }

  return (
    <div>
      {/* Header do Projeto */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {project.name || project.nome}
            </h1>
            <div className="flex items-center gap-4">
              {(project.department || project.area) && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                  {project.department || project.area}
                </span>
              )}
              {metricas && (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <i className="fas fa-chart-bar mr-1"></i>
                    {metricas.totalIndicadores} Indicadores
                  </span>
                  {metricas.economiaAnualTotal > 0 && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      <i className="fas fa-piggy-bank mr-1"></i>
                      Economia: R$ {metricas.economiaAnualTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const result = exportService.exportProjectToPDF(id)
                if (!result.success) {
                  alert(`Erro ao exportar PDF: ${result.error}`)
                }
              }}
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const result = exportService.exportProjectToCSV(id)
                if (!result.success) {
                  alert(`Erro ao exportar CSV: ${result.error}`)
                }
              }}
            >
              <i className="fas fa-file-csv mr-2"></i>
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              <i className="fas fa-edit mr-2"></i>
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <i className="fas fa-trash mr-2"></i>
              Excluir
            </Button>
          </div>
        </div>
        
        {(project.description || project.descricao) && (
          <p className="text-slate-600 dark:text-slate-400 ml-12">
            {project.description || project.descricao}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
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
                <i className={`${tab.icon} mr-2`}></i>
                {tab.title}
              </button>
            ))}
          </nav>
        </div>
        <Outlet />
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Projeto"
        message="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e todos os indicadores associados serão removidos."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          setShowDeleteDialog(false)
          const result = await deleteProject(id)
          if (result.success) {
            navigate('/projects')
          } else {
            alert(`Erro ao excluir projeto: ${result.error || 'Erro desconhecido'}`)
          }
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}

export default ProjectOverview

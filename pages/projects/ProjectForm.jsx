import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const ProjectForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProjectById, createProject, updateProject } = useData()
  
  const isEditing = !!id && id !== 'new'

  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProject = async () => {
      if (isEditing && id) {
        // Aguarda um pouco para garantir que os projetos foram carregados
        await new Promise(resolve => setTimeout(resolve, 100))
        const project = getProjectById(id)
        if (project) {
          setName(project.name || project.nome || '')
          setDepartment(project.department || project.area || '')
          setDescription(project.description || project.descricao || '')
        }
      }
    }
    loadProject()
  }, [id, isEditing, getProjectById])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name.trim()) {
      setError('Nome do projeto é obrigatório')
      setLoading(false)
      return
    }

    const data = {
      name: name.trim(),
      department: department.trim(),
      description: description.trim()
    }

    const result = isEditing 
      ? await updateProject(id, data)
      : await createProject(data)

    if (result.success) {
      navigate('/projects')
    } else {
      setError(result.error || 'Erro ao salvar projeto')
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {isEditing ? 'Atualize as informações do projeto' : 'Crie um novo projeto de ROI'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Nome do Projeto"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Automação de Processos de RH"
          />

          <Input
            label="Departamento"
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Ex: Recursos Humanos, Financeiro, Vendas..."
          />

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Descreva o projeto..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProjectForm

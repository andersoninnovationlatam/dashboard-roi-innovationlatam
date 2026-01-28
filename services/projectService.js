/**
 * Serviço de Projetos
 * Gerencia CRUD de projetos
 */

const KEYS = {
  PROJECTS: 'roi_projects'
}

export const projectService = {
  /**
   * Inicializa estrutura de projetos
   */
  initialize() {
    if (!localStorage.getItem(KEYS.PROJECTS)) {
      localStorage.setItem(KEYS.PROJECTS, JSON.stringify([]))
    }
  },

  /**
   * Retorna todos os projetos
   */
  getAll() {
    const projectsStr = localStorage.getItem(KEYS.PROJECTS)
    return projectsStr ? JSON.parse(projectsStr) : []
  },

  /**
   * Retorna projeto por ID
   */
  getById(id) {
    const projects = this.getAll()
    return projects.find(p => p.id === id) || null
  },

  /**
   * Cria um novo projeto
   */
  create(data) {
    const projects = this.getAll()
    const novoProjeto = {
      id: this.generateId(),
      ...data,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    }
    projects.push(novoProjeto)
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects))
    return { success: true, project: novoProjeto }
  },

  /**
   * Atualiza um projeto existente
   */
  update(id, data) {
    const projects = this.getAll()
    const index = projects.findIndex(p => p.id === id)
    
    if (index === -1) {
      return { success: false, error: 'Projeto não encontrado' }
    }

    projects[index] = {
      ...projects[index],
      ...data,
      atualizadoEm: new Date().toISOString()
    }

    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects))
    return { success: true, project: projects[index] }
  },

  /**
   * Deleta um projeto
   */
  delete(id) {
    const projects = this.getAll()
    const filtered = projects.filter(p => p.id !== id)
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(filtered))
    return { success: true }
  },

  /**
   * Gera ID único
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

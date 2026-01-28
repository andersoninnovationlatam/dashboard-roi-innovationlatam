/**
 * Serviço de Autenticação
 * Gerencia login, registro e sessão do usuário
 */

const KEYS = {
  USERS: 'roi_users',
  CURRENT_USER: 'roi_current_user'
}

export const authService = {
  /**
   * Inicializa estruturas de autenticação
   */
  initialize() {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify([]))
    }
  },

  /**
   * Registra um novo usuário
   */
  register(nome, email, senha) {
    const usuarios = this.getUsers()

    if (usuarios.find(u => u.email === email)) {
      return { success: false, error: 'Email já cadastrado' }
    }

    const novoUsuario = {
      id: this.generateId(),
      nome,
      email,
      senha: this.hashPassword(senha),
      criadoEm: new Date().toISOString()
    }

    usuarios.push(novoUsuario)
    localStorage.setItem(KEYS.USERS, JSON.stringify(usuarios))

    return { success: true, user: novoUsuario }
  },

  /**
   * Faz login do usuário
   */
  login(email, senha) {
    const usuarios = this.getUsers()
    const usuario = usuarios.find(u => u.email === email)

    if (!usuario || usuario.senha !== this.hashPassword(senha)) {
      return { success: false, error: 'Email ou senha incorretos' }
    }

    const userData = { ...usuario }
    delete userData.senha

    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(userData))
    return { success: true, user: userData }
  },

  /**
   * Faz logout do usuário
   */
  logout() {
    localStorage.removeItem(KEYS.CURRENT_USER)
  },

  /**
   * Verifica se há usuário logado
   */
  isLoggedIn() {
    return !!localStorage.getItem(KEYS.CURRENT_USER)
  },

  /**
   * Retorna o usuário atual
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(KEYS.CURRENT_USER)
    return userStr ? JSON.parse(userStr) : null
  },

  /**
   * Retorna todos os usuários
   */
  getUsers() {
    const usersStr = localStorage.getItem(KEYS.USERS)
    return usersStr ? JSON.parse(usersStr) : []
  },

  /**
   * Gera ID único
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  },

  /**
   * Hash simples de senha (em produção, usar bcrypt)
   */
  hashPassword(senha) {
    // Hash simples - em produção usar bcrypt ou similar
    return btoa(senha)
  }
}

export interface Project {
  id: string
  name: string
  department: string
  description: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  name: string
  department: string
  description?: string
}

export interface User {
  id: string
  email: string
  name?: string
}

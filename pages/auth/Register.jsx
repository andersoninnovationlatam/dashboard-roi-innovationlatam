import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'

const Register = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return
    }

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    const result = await register(nome, email, senha)
    
    if (result.success) {
      navigate('/projects')
    } else {
      setError(result.error || 'Erro ao criar conta')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Card className="max-w-md w-full" borderColor="blue-500">
        <div className="text-center mb-6">
          <i className="fas fa-user-plus text-4xl text-blue-400 mb-4"></i>
          <h1 className="text-2xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-slate-400">Cadastre-se para começar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Nome"
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Seu nome completo"
          />

          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
          />

          <Input
            label="Senha"
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Input
            label="Confirmar Senha"
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Faça login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Register

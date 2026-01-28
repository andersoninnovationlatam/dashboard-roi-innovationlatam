import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProjectList from './pages/projects/ProjectList'
import ProjectForm from './pages/projects/ProjectForm'
import ProjectOverview from './pages/projects/ProjectOverview'
import Dashboard from './pages/dashboard/Dashboard'
import IndicatorList from './pages/indicators/IndicatorList'
import IndicatorForm from './pages/indicators/IndicatorForm'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import Loading from './components/common/Loading'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/projects" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/projects" />} />

      {/* Rotas protegidas */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/projects" />} />
        <Route path="/projects" element={user ? <ProjectList /> : <Navigate to="/login" />} />
        <Route path="/projects/new" element={user ? <ProjectForm /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/edit" element={user ? <ProjectForm /> : <Navigate to="/login" />} />
        
        {/* Rotas do projeto com overview */}
        <Route path="/projects/:id" element={user ? <ProjectOverview /> : <Navigate to="/login" />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="indicators" element={<IndicatorList />} />
          <Route path="indicators/new" element={<IndicatorForm />} />
          <Route path="indicators/:indicatorId/edit" element={<IndicatorForm />} />
        </Route>
        
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
      </Route>

      {/* Rota padrão */}
      <Route path="*" element={<Navigate to="/projects" />} />
    </Routes>
  )
}

export default App

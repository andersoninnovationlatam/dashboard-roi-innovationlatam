import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <App />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Erro ao renderizar aplicação:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Erro ao carregar aplicação</h1>
      <p>${error.message}</p>
      <p>Verifique o console para mais detalhes.</p>
    </div>
  `
}

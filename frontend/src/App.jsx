// src/App.jsx
import LoginForm from '../src/pages/Login';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import PrivateRoute from './components/PrivateRoute'
import { useAuth } from './hooks/useAuth'

/**
 * Componente principal de la aplicación
 * Maneja el enrutamiento y la navegación
 */
function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          {/* Spinner principal más grande */}
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
          
          {/* Logo/Título principal */}
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Keeper</h1>
          
          {/* Subtítulo */}
          <p className="text-gray-600 text-lg animate-pulse">Iniciando aplicación...</p>
          
          {/* Barra de progreso decorativa */}
          <div className="mt-6 w-64 bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de login - Solo accesible si no está autenticado */}
        <Route 
          path="/login" 
          element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginForm />} 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Redirigir todas las demás rutas */}
        <Route 
          path="*" 
          element={isAuthenticated() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  )
}
export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './autenticacion-seguridad/Login'
import Registro from './autenticacion-seguridad/Registro'
import CuentaDesactivada from './cuenta-desactivada/CuentaDesactivada'
import Navbar from './shared/components/Navbar'
import ProtectedRoute from './shared/components/ProtectedRoute'
import Home from './home/Home'
import MisPagos from './mis-pagos/MisPagos'
import MiCasa from './mi-casa/MiCasa'
import Presupuesto from './presupuesto/Presupuesto'
import Finanzas from './finanzas/Finanzas'
import GestionVecinos from './gestion-vecinos/GestionVecinos'
import Solicitudes from './solicitudes/Solicitudes'
import Reportes from './reportes/Reportes'
import './App.css'

function AppContent() {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={login} />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/cuenta-desactivada" element={<CuentaDesactivada />} />
          <Route path="*" element={<Login onLoginSuccess={login} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Navbar />
      <main style={{ paddingTop: '20px', padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mis-pagos" element={<MisPagos />} />
          <Route path="/mi-casa" element={<MiCasa />} />
          <Route path="/presupuesto" element={<Presupuesto />} />
          <Route
            path="/finanzas"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'super_admin']}>
                <Finanzas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-vecinos"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'super_admin']}>
                <GestionVecinos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitudes"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'super_admin']}>
                <Solicitudes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/informes"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'super_admin']}>
                <Reportes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App

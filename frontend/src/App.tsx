import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './autenticacion-seguridad/Login'
import Navbar from './shared/components/Navbar'
import Home from './home/Home'
import MisPagos from './mis-pagos/MisPagos'
import MiInformacion from './mi-informacion/MiInformacion'
import Presupuesto from './presupuesto/Presupuesto'
import Finanzas from './finanzas/Finanzas'
import GestionVecinos from './gestion-vecinos/GestionVecinos'
import Solicitudes from './solicitudes/Solicitudes'
import Reportes from './reportes/Reportes'
import './App.css'

function AppContent() {
  const { isAuthenticated, login, logout, user } = useAuth();

  if (!isAuthenticated) {
    return <Login onLoginSuccess={login} />;
  }

  return (
    <Router>
      <Navbar />
      <div style={{ padding: '1rem', textAlign: 'right', background: '#f5f5f5' }}>
        <span style={{ marginRight: '1rem' }}>Bienvenido, {user?.nombre}</span>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
      <main style={{ paddingTop: '20px', padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mis-pagos" element={<MisPagos />} />
          <Route path="/mi-informacion" element={<MiInformacion />} />
          <Route path="/presupuesto" element={<Presupuesto />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/gestion-vecinos" element={<GestionVecinos />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
          <Route path="/informes" element={<Reportes />} />
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

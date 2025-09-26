import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ paddingTop: '100px', padding: '2rem' }}>
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
  )
}

export default App

import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Mis Pagos', path: '/mis-pagos' },
    { name: 'Mi<br>Información', path: '/mi-informacion', displayName: 'Mi Información' },
    { name: 'Presupuesto del<br>Residencial', path: '/presupuesto', displayName: 'Presupuesto del Residencial' },
    { name: 'Finanzas', path: '/finanzas' },
    { name: 'Gestión de<br>Vecinos', path: '/gestion-vecinos', displayName: 'Gestión de Vecinos' },
    { name: 'Solicitudes', path: '/solicitudes' },
    { name: 'Informes', path: '/informes' }
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo-container">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `navbar-logo-link ${isActive ? 'active' : ''}`
            }
          >
            <div className="navbar-logo"></div>
          </NavLink>
        </div>

        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {navItems.map((item) => (
            <li key={item.path} className={`navbar-item ${location.pathname === item.path ? 'active' : ''}`}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span dangerouslySetInnerHTML={{ __html: item.name }}></span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
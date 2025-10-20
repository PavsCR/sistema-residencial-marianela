import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { logout, user } = useAuth()

  const allNavItems = [
    { name: 'Mi Casa', path: '/mi-casa', roles: ['vecino', 'administrador', 'super_admin'] },
    { name: 'Mis Pagos', path: '/mis-pagos', roles: ['vecino', 'administrador', 'super_admin'] },
    { name: 'Presupuesto del<br>Residencial', path: '/presupuesto', displayName: 'Presupuesto del Residencial', roles: ['vecino', 'administrador', 'super_admin'] },
    { name: 'Finanzas', path: '/finanzas', roles: ['administrador', 'super_admin'] },
    { name: 'Gestión de<br>Vecinos', path: '/gestion-vecinos', displayName: 'Gestión de Vecinos', roles: ['administrador', 'super_admin'] },
    { name: 'Solicitudes', path: '/solicitudes', roles: ['administrador', 'super_admin'] },
    { name: 'Informes', path: '/informes', roles: ['administrador', 'super_admin'] }
  ]

  // Filtrar items del navbar según el rol del usuario
  const navItems = allNavItems.filter(item =>
    item.roles.includes(user?.rol || '')
  )

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
          <li className="navbar-item">
            <button
              className="navbar-logout-btn"
              onClick={logout}
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
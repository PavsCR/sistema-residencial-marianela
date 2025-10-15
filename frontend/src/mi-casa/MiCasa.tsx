import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../services/api'
import './MiCasa.css'

interface HouseMember {
  idUsuario: number
  nombreCompleto: string
  correoElectronico: string
  telefono?: string
}

interface HouseInfo {
  numeroCasa: string
  estadoPago: string
  miembros: HouseMember[]
}

const MiCasa = () => {
  const { user } = useAuth()
  const [houseInfo, setHouseInfo] = useState<HouseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para el formulario de edición
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correoElectronico: '',
    telefono: ''
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Estado para solicitud de desactivación
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<HouseMember | null>(null)
  const [deactivateMotivo, setDeactivateMotivo] = useState('')
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [submittingDeactivate, setSubmittingDeactivate] = useState(false)

  // Estado para el menú de opciones de cada miembro
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    const fetchHouseInfo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/usuarios/mi-casa', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.status === 403 || response.status === 401) {
          // Token expirado o inválido - limpiar y recargar
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
        }

        if (!response.ok) {
          throw new Error('Error al cargar información de la casa')
        }

        const result = await response.json()

        // Ordenar miembros: usuario actual primero
        if (user && result.data.miembros) {
          result.data.miembros.sort((a: HouseMember, b: HouseMember) => {
            if (a.idUsuario === user.id) return -1
            if (b.idUsuario === user.id) return 1
            return 0
          })
        }

        setHouseInfo(result.data)

        // Inicializar el formulario con los datos actuales del usuario
        // Buscar al usuario actual en los miembros de la casa
        if (user && result.data.miembros) {
          const currentUser = result.data.miembros.find((m: HouseMember) => m.idUsuario === user.id)
          if (currentUser) {
            setFormData({
              nombreCompleto: currentUser.nombreCompleto || '',
              correoElectronico: currentUser.correoElectronico || '',
              telefono: currentUser.telefono || ''
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchHouseInfo()
  }, [user])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (openMenuId && !target.closest('.member-menu-container')) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openMenuId])

  const getEstadoPagoLabel = (estado: string) => {
    switch (estado) {
      case 'al_dia':
        return 'Al día'
      case 'moroso':
        return 'Moroso'
      case 'en_arreglo':
        return 'En arreglo'
      default:
        return estado
    }
  }

  const getEstadoPagoClass = (estado: string) => {
    switch (estado) {
      case 'al_dia':
        return 'estado-al-dia'
      case 'moroso':
        return 'estado-moroso'
      case 'en_arreglo':
        return 'estado-arreglo'
      default:
        return ''
    }
  }

  const handleEditClick = () => {
    setShowEditForm(true)
    setFormErrors([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!formData.nombreCompleto.trim()) {
      errors.push('El nombre completo es obligatorio')
    } else if (formData.nombreCompleto.length < 3 || formData.nombreCompleto.length > 255) {
      errors.push('El nombre debe tener entre 3 y 255 caracteres')
    }

    if (!formData.correoElectronico.trim()) {
      errors.push('El correo electrónico es obligatorio')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoElectronico)) {
      errors.push('Debe ser un correo electrónico válido')
    }

    if (formData.telefono && (formData.telefono.length < 8 || formData.telefono.length > 20)) {
      errors.push('El teléfono debe tener entre 8 y 20 caracteres')
    }

    setFormErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setFormErrors([])

      const response = await authFetch('/solicitudes/edicion-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar solicitud')
      }

      alert('Solicitud de edición enviada exitosamente. Pendiente de aprobación por un administrador.')
      setShowEditForm(false)
    } catch (err: any) {
      setFormErrors([err.message || 'Error al enviar solicitud'])
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMenu = (idUsuario: number) => {
    setOpenMenuId(openMenuId === idUsuario ? null : idUsuario)
  }

  const handleDeactivateClick = (miembro: HouseMember) => {
    setSelectedUser(miembro)
    setShowDeactivateModal(true)
    setDeactivateMotivo('')
    setDeactivateError(null)
    setOpenMenuId(null) // Cerrar el menú
  }

  const handleDeactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) return

    if (deactivateMotivo.trim().length < 10 || deactivateMotivo.trim().length > 500) {
      setDeactivateError('El motivo debe tener entre 10 y 500 caracteres')
      return
    }

    try {
      setSubmittingDeactivate(true)
      setDeactivateError(null)

      const response = await authFetch('/solicitudes/desactivacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idUsuarioDesactivar: selectedUser.idUsuario,
          motivo: deactivateMotivo,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar solicitud')
      }

      alert('Solicitud de desactivación enviada exitosamente. Pendiente de aprobación por un administrador.')
      setShowDeactivateModal(false)
      setSelectedUser(null)
      setDeactivateMotivo('')
    } catch (err: any) {
      setDeactivateError(err.message || 'Error al enviar solicitud')
    } finally {
      setSubmittingDeactivate(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Mi Casa</h1>
        <p>Cargando información...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <h1>Mi Casa</h1>
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (!houseInfo) {
    return (
      <div className="page-container">
        <h1>Mi Casa</h1>
        <p>No estás asignado a ninguna casa</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1>Mi Casa</h1>

      {showEditForm && (
        <div className="edit-form-card">
          <h2>Solicitar Edición de Información Personal</h2>
          <p className="form-description">
            Los cambios solicitados deben ser aprobados por un administrador.
          </p>

          {formErrors.length > 0 && (
            <div className="error-message">
              <ul>
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombreCompleto">Nombre Completo *</label>
              <input
                type="text"
                id="nombreCompleto"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="correoElectronico">Correo Electrónico *</label>
              <input
                type="email"
                id="correoElectronico"
                name="correoElectronico"
                value={formData.correoElectronico}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowEditForm(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="house-info-card">
        <div className="house-header">
          <h2>Casa #{houseInfo.numeroCasa}</h2>
          <span className={`estado-badge ${getEstadoPagoClass(houseInfo.estadoPago)}`}>
            {getEstadoPagoLabel(houseInfo.estadoPago)}
          </span>
        </div>

        <div className="members-section">
          <h3>Residentes de la casa</h3>
          <div className="members-grid">
            {houseInfo.miembros.map((miembro) => {
              const isCurrentUser = miembro.idUsuario === user?.id
              return (
                <div
                  key={miembro.idUsuario}
                  className={`member-card ${isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="member-header">
                    <h4>
                      {miembro.nombreCompleto}
                      {isCurrentUser && <span className="current-user-badge"> (Tú)</span>}
                    </h4>
                    <div className="member-menu-container">
                      <button
                        className="btn-member-menu"
                        onClick={() => toggleMenu(miembro.idUsuario)}
                        title="Opciones"
                      >
                        ⚙️
                      </button>
                      {openMenuId === miembro.idUsuario && (
                        <div className="member-menu-dropdown">
                          {isCurrentUser ? (
                            <button
                              className="menu-option"
                              onClick={() => {
                                handleEditClick()
                                setOpenMenuId(null)
                              }}
                            >
                              Editar mi información
                            </button>
                          ) : (
                            <button
                              className="menu-option"
                              onClick={() => handleDeactivateClick(miembro)}
                            >
                              Solicitar desactivación
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="member-details">
                    <p className="member-info">
                      <span className="info-label">Email:</span> {miembro.correoElectronico}
                    </p>
                    <p className="member-info">
                      <span className="info-label">Teléfono:</span> {miembro.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal de solicitud de desactivación */}
      {showDeactivateModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Solicitar Desactivación de Cuenta</h2>
            <p>
              <strong>Usuario:</strong> {selectedUser.nombreCompleto}
            </p>
            <p>
              <strong>Email:</strong> {selectedUser.correoElectronico}
            </p>

            {deactivateError && (
              <div className="error-message">
                {deactivateError}
              </div>
            )}

            <form onSubmit={handleDeactivateSubmit}>
              <div className="form-group">
                <label htmlFor="motivo">
                  Motivo de la desactivación *
                </label>
                <textarea
                  id="motivo"
                  value={deactivateMotivo}
                  onChange={(e) => setDeactivateMotivo(e.target.value)}
                  placeholder="Explica el motivo de la solicitud (10-500 caracteres)"
                  disabled={submittingDeactivate}
                  required
                />
                <small>
                  {deactivateMotivo.length}/500 caracteres
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-approve"
                  disabled={submittingDeactivate}
                >
                  {submittingDeactivate ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={submittingDeactivate}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiCasa

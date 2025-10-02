import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
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

  useEffect(() => {
    const fetchHouseInfo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/usuarios/mi-casa', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar información de la casa')
        }

        const result = await response.json()
        setHouseInfo(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchHouseInfo()
  }, [])

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
            {houseInfo.miembros.map((miembro) => (
              <div key={miembro.idUsuario} className="member-card">
                <h4>{miembro.nombreCompleto}</h4>
                <p className="member-info">
                  <span className="info-label">Email:</span> {miembro.correoElectronico}
                </p>
                {miembro.telefono && (
                  <p className="member-info">
                    <span className="info-label">Teléfono:</span> {miembro.telefono}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiCasa

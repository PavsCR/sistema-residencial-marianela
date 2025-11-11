import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SolicitudesCambioRol.css';

interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  correoElectronico: string;
  rol: {
    nombreRol: string;
  };
  casa: {
    numeroCasa: string;
  } | null;
}

interface Solicitud {
  idSolicitud: number;
  tipoCambio: string;
  rolActual: string;
  rolNuevo: string;
  justificacion: string;
  estado: string;
  fechaSolicitud: string;
  fechaRevision: string | null;
  comentariosRevision: string | null;
  usuarioAfectado: Usuario;
  usuarioSolicitante: {
    idUsuario: number;
    nombreCompleto: string;
    correoElectronico: string;
  };
  revisor: {
    idUsuario: number;
    nombreCompleto: string;
  } | null;
}

const SolicitudesCambioRol = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [reviewEstado, setReviewEstado] = useState<'aprobada' | 'rechazada'>('aprobada');
  const [reviewComentarios, setReviewComentarios] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3001/api/solicitudes/cambio-rol', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar las solicitudes');
      }

      setSolicitudes(result.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setReviewEstado('aprobada');
    setReviewComentarios('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedSolicitud) return;

    try {
      setReviewLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3001/api/solicitudes/cambio-rol/${selectedSolicitud.idSolicitud}/revisar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: reviewEstado,
          comentariosRevision: reviewComentarios
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al procesar la solicitud');
      }

      alert(`Solicitud ${reviewEstado} exitosamente`);
      setShowReviewModal(false);
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la solicitud');
    } finally {
      setReviewLoading(false);
    }
  };

  const getTipoCambioLabel = (tipo: string) => {
    return tipo === 'asignar_admin' ? 'Asignar rol de Administrador' : 'Remover rol de Administrador';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada'
    };
    return labels[estado] || estado;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const filteredSolicitudes = solicitudes.filter(solicitud => {
    if (filterEstado === '') return true;
    return solicitud.estado === filterEstado;
  });

  if (loading) {
    return (
      <div className="solicitudes-cambio-rol-container">
        <h1>Solicitudes de Cambio de Rol</h1>
        <div className="loading-container">
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="solicitudes-cambio-rol-container">
        <h1>Solicitudes de Cambio de Rol</h1>
        <div className="error-message">{error}</div>
        <button onClick={fetchSolicitudes} className="btn-retry">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="solicitudes-cambio-rol-container">
      <div className="page-header">
        <h1>Solicitudes de Cambio de Rol</h1>
        <button onClick={() => navigate('/gestion-vecinos')} className="btn-back">
          ← Volver a Gestión de Vecinos
        </button>
      </div>

      <div className="info-box">
        <p><strong>ℹ️ Información:</strong> Las solicitudes de cambio de rol deben ser aprobadas por otro administrador diferente al que las genera.</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="filter-estado">Filtrar por estado:</label>
          <select
            id="filter-estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Solicitudes List */}
      {filteredSolicitudes.length === 0 ? (
        <div className="no-solicitudes">
          <div className="no-solicitudes-icon">📋</div>
          <h3>No hay solicitudes</h3>
          <p>No se encontraron solicitudes de cambio de rol{filterEstado && ` con estado "${getEstadoLabel(filterEstado)}"`}</p>
        </div>
      ) : (
        <div className="solicitudes-list">
          {filteredSolicitudes.map((solicitud) => (
            <div key={solicitud.idSolicitud} className="solicitud-card">
              <div className="solicitud-header">
                <div className="solicitud-title">
                  <h3>{getTipoCambioLabel(solicitud.tipoCambio)}</h3>
                  <span className={`estado-badge ${solicitud.estado}`}>
                    {getEstadoLabel(solicitud.estado)}
                  </span>
                </div>
                <div className="solicitud-date">
                  {formatDate(solicitud.fechaSolicitud)}
                </div>
              </div>

              <div className="solicitud-body">
                <div className="solicitud-info-section">
                  <h4>Usuario Afectado:</h4>
                  <p><strong>Nombre:</strong> {solicitud.usuarioAfectado.nombreCompleto}</p>
                  <p><strong>Email:</strong> {solicitud.usuarioAfectado.correoElectronico}</p>
                  <p><strong>Casa:</strong> {solicitud.usuarioAfectado.casa?.numeroCasa || 'Sin casa'}</p>
                  <p><strong>Rol Actual:</strong> {solicitud.rolActual}</p>
                  <p><strong>Rol Nuevo:</strong> {solicitud.rolNuevo}</p>
                </div>

                <div className="solicitud-info-section">
                  <h4>Solicitado por:</h4>
                  <p><strong>Nombre:</strong> {solicitud.usuarioSolicitante.nombreCompleto}</p>
                  <p><strong>Email:</strong> {solicitud.usuarioSolicitante.correoElectronico}</p>
                </div>

                <div className="solicitud-info-section">
                  <h4>Justificación:</h4>
                  <p className="justificacion-text">{solicitud.justificacion}</p>
                </div>

                {solicitud.estado !== 'pendiente' && (
                  <div className="solicitud-info-section">
                    <h4>Revisión:</h4>
                    <p><strong>Revisado por:</strong> {solicitud.revisor?.nombreCompleto || 'N/A'}</p>
                    <p><strong>Fecha:</strong> {solicitud.fechaRevision && formatDate(solicitud.fechaRevision)}</p>
                    {solicitud.comentariosRevision && (
                      <>
                        <p><strong>Comentarios:</strong></p>
                        <p className="comentarios-text">{solicitud.comentariosRevision}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {solicitud.estado === 'pendiente' && (
                <div className="solicitud-actions">
                  <button
                    className="btn-action btn-review"
                    onClick={() => handleReview(solicitud)}
                  >
                    📝 Revisar Solicitud
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Revisión */}
      {showReviewModal && selectedSolicitud && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Revisar Solicitud de Cambio de Rol</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="review-info-box">
                <h3>Usuario: {selectedSolicitud.usuarioAfectado.nombreCompleto}</h3>
                <p><strong>Cambio:</strong> {getTipoCambioLabel(selectedSolicitud.tipoCambio)}</p>
                <p><strong>De:</strong> {selectedSolicitud.rolActual} → <strong>A:</strong> {selectedSolicitud.rolNuevo}</p>
                <p><strong>Justificación:</strong></p>
                <p className="justificacion-box">{selectedSolicitud.justificacion}</p>
              </div>

              <div className="form-group">
                <label htmlFor="review-estado">Decisión <span className="required">*</span></label>
                <select
                  id="review-estado"
                  value={reviewEstado}
                  onChange={(e) => setReviewEstado(e.target.value as 'aprobada' | 'rechazada')}
                  disabled={reviewLoading}
                >
                  <option value="aprobada">Aprobar</option>
                  <option value="rechazada">Rechazar</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="review-comentarios">Comentarios (opcional)</label>
                <textarea
                  id="review-comentarios"
                  value={reviewComentarios}
                  onChange={(e) => setReviewComentarios(e.target.value)}
                  placeholder="Agrega comentarios sobre tu decisión"
                  rows={4}
                  disabled={reviewLoading}
                />
              </div>

              <div className="modal-footer">
                <button
                  onClick={handleReviewSubmit}
                  className={`btn-submit ${reviewEstado === 'rechazada' ? 'danger' : ''}`}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? 'Procesando...' : reviewEstado === 'aprobada' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="btn-cancel"
                  disabled={reviewLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudesCambioRol;

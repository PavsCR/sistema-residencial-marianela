import { useState, useEffect } from 'react';
import { authFetch } from '../services/api';
import './Solicitudes.css';

interface Solicitud {
  idSolicitud: number;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string | null;
  numeroCasa: string | null;
  fechaSolicitud: string;
  estado: string;
}

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [motivo, setMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authFetch('/solicitudes/registro');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar solicitudes');
      }

      setSolicitudes(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleApproveClick = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowApproveModal(true);
  };

  const handleRejectClick = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setMotivo('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedSolicitud) return;

    try {
      setActionLoading(true);
      const response = await authFetch(
        `/solicitudes/registro/${selectedSolicitud.idSolicitud}/aprobar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al aprobar solicitud');
      }

      alert('Solicitud aprobada exitosamente');
      setShowApproveModal(false);
      fetchSolicitudes();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSolicitud || !motivo) return;

    if (motivo.length < 10 || motivo.length > 500) {
      alert('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    try {
      setActionLoading(true);
      const response = await authFetch(
        `/solicitudes/registro/${selectedSolicitud.idSolicitud}/rechazar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al rechazar solicitud');
      }

      alert('Solicitud rechazada');
      setShowRejectModal(false);
      fetchSolicitudes();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1>Solicitudes de Registro</h1>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Solicitudes de Registro</h1>

      {error && <div className="error-message">{error}</div>}

      {solicitudes.length === 0 ? (
        <div className="no-solicitudes">
          <p>No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="solicitudes-grid">
          {solicitudes.map((solicitud) => (
            <div key={solicitud.idSolicitud} className="solicitud-card">
              <div className="solicitud-header">
                <h3>{solicitud.nombreCompleto}</h3>
                <span className="solicitud-fecha">
                  {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CR')}
                </span>
              </div>
              <div className="solicitud-info">
                <p>
                  <strong>Email:</strong> {solicitud.correoElectronico}
                </p>
                {solicitud.telefono && (
                  <p>
                    <strong>Teléfono:</strong> {solicitud.telefono}
                  </p>
                )}
                <p>
                  <strong>Casa:</strong> #{solicitud.numeroCasa}
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={`estado-badge estado-${solicitud.estado}`}>
                    {solicitud.estado}
                  </span>
                </p>
              </div>
              <div className="solicitud-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleApproveClick(solicitud)}
                  disabled={actionLoading}
                >
                  Aprobar
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleRejectClick(solicitud)}
                  disabled={actionLoading}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Aprobación */}
      {showApproveModal && selectedSolicitud && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Aprobar Solicitud</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitud.nombreCompleto}
            </p>
            <p>
              <strong>Email:</strong> {selectedSolicitud.correoElectronico}
            </p>
            <p>
              <strong>Casa asignada:</strong> #{selectedSolicitud.numeroCasa}
            </p>

            <p style={{ marginTop: '1rem', color: '#666' }}>
              ¿Deseas aprobar esta solicitud de registro?
            </p>

            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Aprobando...' : 'Confirmar Aprobación'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showRejectModal && selectedSolicitud && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Rechazar Solicitud</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitud.nombreCompleto}
            </p>
            <p>
              <strong>Email:</strong> {selectedSolicitud.correoElectronico}
            </p>

            <div className="form-group">
              <label htmlFor="motivo">Motivo del Rechazo *</label>
              <textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica el motivo del rechazo (10-500 caracteres)"
                minLength={10}
                maxLength={500}
                rows={4}
                required
                disabled={actionLoading}
              />
              <small>
                {motivo.length}/500 caracteres (mínimo 10)
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={actionLoading || motivo.length < 10}
              >
                {actionLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

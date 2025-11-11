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

interface SolicitudEdicion {
  idSolicitud: number;
  idUsuario: number;
  nombreCompletoActual: string;
  nombreCompletoNuevo: string | null;
  correoActual: string;
  correoNuevo: string | null;
  telefonoActual: string | null;
  telefonoNuevo: string | null;
  fechaSolicitud: string;
  estado: string;
}

interface SolicitudDesactivacion {
  idSolicitud: number;
  idUsuarioSolicitante: number;
  idUsuarioDesactivar: number;
  motivo: string;
  fechaSolicitud: string;
  estado: string;
  solicitante: {
    nombreCompleto: string;
    correoElectronico: string;
  };
  usuarioDesactivar: {
    nombreCompleto: string;
    correoElectronico: string;
    telefono: string | null;
    casa: {
      numeroCasa: string;
    };
  };
}

interface SolicitudReactivacion {
  idSolicitud: number;
  idUsuario: number;
  motivo: string;
  numeroCasaNuevo: string;
  fechaSolicitud: string;
  estado: string;
  usuario: {
    nombreCompleto: string;
    correoElectronico: string;
    telefono: string | null;
    estadoCuenta: string;
    casa: {
      numeroCasa: string;
    } | null;
  };
  casaNueva: {
    numeroCasa: string;
    idCasa: number;
  };
}

interface SolicitudCambioRol {
  idSolicitud: number;
  idUsuarioAfectado: number;
  idUsuarioSolicitante: number;
  idPrimerRevisor: number | null;
  idSegundoRevisor: number | null;
  rolActual: string;
  rolNuevo: string;
  tipoCambio: string;
  justificacion: string;
  estado: string; // pendiente, aprobada_parcial, aprobada, rechazada
  fechaSolicitud: string;
  fechaPrimeraRevision: string | null;
  fechaSegundaRevision: string | null;
  comentariosPrimerRevisor: string | null;
  comentariosSegundoRevisor: string | null;
  usuarioAfectado: {
    nombreCompleto: string;
    correoElectronico: string;
    telefono: string | null;
    casa: {
      numeroCasa: string;
    } | null;
    rol: {
      nombreRol: string;
    };
  };
  usuarioSolicitante: {
    nombreCompleto: string;
    correoElectronico: string;
  };
  primerRevisor: {
    nombreCompleto: string;
    correoElectronico: string;
  } | null;
  segundoRevisor: {
    nombreCompleto: string;
    correoElectronico: string;
  } | null;
}

type TabType = 'registro' | 'edicion' | 'desactivacion' | 'reactivacion' | 'cambio-rol';

export default function Solicitudes() {
  const [activeTab, setActiveTab] = useState<TabType>('registro');

  // Estados para solicitudes de registro
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [motivo, setMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Estados para solicitudes de edición
  const [solicitudesEdicion, setSolicitudesEdicion] = useState<SolicitudEdicion[]>([]);
  const [loadingEdicion, setLoadingEdicion] = useState(true);
  const [errorEdicion, setErrorEdicion] = useState('');
  const [showApproveModalEdicion, setShowApproveModalEdicion] = useState(false);
  const [showRejectModalEdicion, setShowRejectModalEdicion] = useState(false);
  const [selectedSolicitudEdicion, setSelectedSolicitudEdicion] = useState<SolicitudEdicion | null>(null);
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [actionLoadingEdicion, setActionLoadingEdicion] = useState(false);

  // Estados para solicitudes de desactivación
  const [solicitudesDesactivacion, setSolicitudesDesactivacion] = useState<SolicitudDesactivacion[]>([]);
  const [loadingDesactivacion, setLoadingDesactivacion] = useState(true);
  const [errorDesactivacion, setErrorDesactivacion] = useState('');
  const [showApproveModalDesactivacion, setShowApproveModalDesactivacion] = useState(false);
  const [showRejectModalDesactivacion, setShowRejectModalDesactivacion] = useState(false);
  const [selectedSolicitudDesactivacion, setSelectedSolicitudDesactivacion] = useState<SolicitudDesactivacion | null>(null);
  const [motivoDesactivacion, setMotivoDesactivacion] = useState('');
  const [actionLoadingDesactivacion, setActionLoadingDesactivacion] = useState(false);

  // Estados para solicitudes de reactivación
  const [solicitudesReactivacion, setSolicitudesReactivacion] = useState<SolicitudReactivacion[]>([]);
  const [loadingReactivacion, setLoadingReactivacion] = useState(true);
  const [errorReactivacion, setErrorReactivacion] = useState('');
  const [showApproveModalReactivacion, setShowApproveModalReactivacion] = useState(false);
  const [showRejectModalReactivacion, setShowRejectModalReactivacion] = useState(false);
  const [selectedSolicitudReactivacion, setSelectedSolicitudReactivacion] = useState<SolicitudReactivacion | null>(null);
  const [motivoReactivacion, setMotivoReactivacion] = useState('');
  const [actionLoadingReactivacion, setActionLoadingReactivacion] = useState(false);

  // Estados para solicitudes de cambio de rol
  const [solicitudesCambioRol, setSolicitudesCambioRol] = useState<SolicitudCambioRol[]>([]);
  const [loadingCambioRol, setLoadingCambioRol] = useState(true);
  const [errorCambioRol, setErrorCambioRol] = useState('');
  const [showReviewModalCambioRol, setShowReviewModalCambioRol] = useState(false);
  const [selectedSolicitudCambioRol, setSelectedSolicitudCambioRol] = useState<SolicitudCambioRol | null>(null);
  const [reviewEstadoCambioRol, setReviewEstadoCambioRol] = useState<'aprobada' | 'rechazada'>('aprobada');
  const [comentariosCambioRol, setComentariosCambioRol] = useState('');
  const [actionLoadingCambioRol, setActionLoadingCambioRol] = useState(false);

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

  const fetchSolicitudesEdicion = async () => {
    try {
      setLoadingEdicion(true);
      setErrorEdicion('');
      const response = await authFetch('/solicitudes/edicion-info');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar solicitudes de edición');
      }

      setSolicitudesEdicion(result.data || []);
    } catch (err: any) {
      setErrorEdicion(err.message || 'Error al cargar solicitudes de edición');
    } finally {
      setLoadingEdicion(false);
    }
  };

  const fetchSolicitudesDesactivacion = async () => {
    try {
      setLoadingDesactivacion(true);
      setErrorDesactivacion('');
      const response = await authFetch('/solicitudes/desactivacion');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar solicitudes de desactivación');
      }

      setSolicitudesDesactivacion(result.data || []);
    } catch (err: any) {
      setErrorDesactivacion(err.message || 'Error al cargar solicitudes de desactivación');
    } finally {
      setLoadingDesactivacion(false);
    }
  };

  const fetchSolicitudesReactivacion = async () => {
    try {
      setLoadingReactivacion(true);
      setErrorReactivacion('');
      const response = await authFetch('/solicitudes/reactivacion');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar solicitudes de reactivación');
      }

      setSolicitudesReactivacion(result.data || []);
    } catch (err: any) {
      setErrorReactivacion(err.message || 'Error al cargar solicitudes de reactivación');
    } finally {
      setLoadingReactivacion(false);
    }
  };

  const fetchSolicitudesCambioRol = async () => {
    try {
      setLoadingCambioRol(true);
      setErrorCambioRol('');
      const response = await authFetch('/solicitudes/cambio-rol');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar solicitudes de cambio de rol');
      }

      setSolicitudesCambioRol(result.data || []);
    } catch (err: any) {
      setErrorCambioRol(err.message || 'Error al cargar solicitudes de cambio de rol');
    } finally {
      setLoadingCambioRol(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
    fetchSolicitudesEdicion();
    fetchSolicitudesDesactivacion();
    fetchSolicitudesReactivacion();
    fetchSolicitudesCambioRol();
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

  // Handlers para solicitudes de edición
  const handleApproveClickEdicion = (solicitud: SolicitudEdicion) => {
    setSelectedSolicitudEdicion(solicitud);
    setShowApproveModalEdicion(true);
  };

  const handleRejectClickEdicion = (solicitud: SolicitudEdicion) => {
    setSelectedSolicitudEdicion(solicitud);
    setMotivoEdicion('');
    setShowRejectModalEdicion(true);
  };

  const handleApproveEdicion = async () => {
    if (!selectedSolicitudEdicion) return;

    try {
      setActionLoadingEdicion(true);
      const response = await authFetch(
        `/solicitudes/edicion-info/${selectedSolicitudEdicion.idSolicitud}/aprobar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al aprobar solicitud');
      }

      alert('Solicitud aprobada exitosamente. Información del usuario actualizada.');
      setShowApproveModalEdicion(false);
      fetchSolicitudesEdicion();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar solicitud');
    } finally {
      setActionLoadingEdicion(false);
    }
  };

  const handleRejectEdicion = async () => {
    if (!selectedSolicitudEdicion || !motivoEdicion) return;

    if (motivoEdicion.length < 10 || motivoEdicion.length > 500) {
      alert('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    try {
      setActionLoadingEdicion(true);
      const response = await authFetch(
        `/solicitudes/edicion-info/${selectedSolicitudEdicion.idSolicitud}/rechazar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivoEdicion }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al rechazar solicitud');
      }

      alert('Solicitud rechazada');
      setShowRejectModalEdicion(false);
      fetchSolicitudesEdicion();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud');
    } finally {
      setActionLoadingEdicion(false);
    }
  };

  // Handlers para solicitudes de desactivación
  const handleApproveClickDesactivacion = (solicitud: SolicitudDesactivacion) => {
    setSelectedSolicitudDesactivacion(solicitud);
    setShowApproveModalDesactivacion(true);
  };

  const handleRejectClickDesactivacion = (solicitud: SolicitudDesactivacion) => {
    setSelectedSolicitudDesactivacion(solicitud);
    setMotivoDesactivacion('');
    setShowRejectModalDesactivacion(true);
  };

  const handleApproveDesactivacion = async () => {
    if (!selectedSolicitudDesactivacion) return;

    try {
      setActionLoadingDesactivacion(true);
      const response = await authFetch(
        `/solicitudes/desactivacion/${selectedSolicitudDesactivacion.idSolicitud}/aprobar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al aprobar solicitud');
      }

      alert('Solicitud aprobada exitosamente. Usuario desactivado.');
      setShowApproveModalDesactivacion(false);
      fetchSolicitudesDesactivacion();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar solicitud');
    } finally {
      setActionLoadingDesactivacion(false);
    }
  };

  const handleRejectDesactivacion = async () => {
    if (!selectedSolicitudDesactivacion || !motivoDesactivacion) return;

    if (motivoDesactivacion.length < 10 || motivoDesactivacion.length > 500) {
      alert('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    try {
      setActionLoadingDesactivacion(true);
      const response = await authFetch(
        `/solicitudes/desactivacion/${selectedSolicitudDesactivacion.idSolicitud}/rechazar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivoDesactivacion }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al rechazar solicitud');
      }

      alert('Solicitud rechazada');
      setShowRejectModalDesactivacion(false);
      fetchSolicitudesDesactivacion();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud');
    } finally {
      setActionLoadingDesactivacion(false);
    }
  };

  // Handlers para solicitudes de reactivación
  const handleApproveClickReactivacion = (solicitud: SolicitudReactivacion) => {
    setSelectedSolicitudReactivacion(solicitud);
    setShowApproveModalReactivacion(true);
  };

  const handleRejectClickReactivacion = (solicitud: SolicitudReactivacion) => {
    setSelectedSolicitudReactivacion(solicitud);
    setMotivoReactivacion('');
    setShowRejectModalReactivacion(true);
  };

  const handleApproveReactivacion = async () => {
    if (!selectedSolicitudReactivacion) return;

    try {
      setActionLoadingReactivacion(true);
      const response = await authFetch(
        `/solicitudes/reactivacion/${selectedSolicitudReactivacion.idSolicitud}/aprobar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al aprobar solicitud');
      }

      alert('Solicitud aprobada exitosamente. Usuario reactivado.');
      setShowApproveModalReactivacion(false);
      fetchSolicitudesReactivacion();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar solicitud');
    } finally {
      setActionLoadingReactivacion(false);
    }
  };

  const handleRejectReactivacion = async () => {
    if (!selectedSolicitudReactivacion || !motivoReactivacion) return;

    if (motivoReactivacion.length < 10 || motivoReactivacion.length > 500) {
      alert('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    try {
      setActionLoadingReactivacion(true);
      const response = await authFetch(
        `/solicitudes/reactivacion/${selectedSolicitudReactivacion.idSolicitud}/rechazar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivoReactivacion }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al rechazar solicitud');
      }

      alert('Solicitud rechazada');
      setShowRejectModalReactivacion(false);
      fetchSolicitudesReactivacion();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud');
    } finally {
      setActionLoadingReactivacion(false);
    }
  };

  // Handlers para solicitudes de cambio de rol
  const handleReviewClickCambioRol = (solicitud: SolicitudCambioRol) => {
    setSelectedSolicitudCambioRol(solicitud);
    setReviewEstadoCambioRol('aprobada');
    setComentariosCambioRol('');
    setShowReviewModalCambioRol(true);
  };

  const handleReviewCambioRol = async () => {
    if (!selectedSolicitudCambioRol) return;

    try {
      setActionLoadingCambioRol(true);
      const response = await authFetch(
        `/solicitudes/cambio-rol/${selectedSolicitudCambioRol.idSolicitud}/revisar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: reviewEstadoCambioRol,
            comentariosRevision: comentariosCambioRol || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al revisar solicitud');
      }

      alert(
        reviewEstadoCambioRol === 'aprobada'
          ? 'Solicitud aprobada exitosamente. El rol del usuario ha sido actualizado.'
          : 'Solicitud rechazada.'
      );
      setShowReviewModalCambioRol(false);
      fetchSolicitudesCambioRol();
    } catch (err: any) {
      alert(err.message || 'Error al revisar solicitud');
    } finally {
      setActionLoadingCambioRol(false);
    }
  };

  if (loading && loadingEdicion && loadingDesactivacion && loadingReactivacion && loadingCambioRol) {
    return (
      <div className="page-container">
        <h1>Solicitudes</h1>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Gestión de Solicitudes</h1>

      {/* Pestañas */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'registro' ? 'active' : ''}`}
          onClick={() => setActiveTab('registro')}
        >
          Solicitudes de Registro
          {solicitudes.length > 0 && <span className="badge">{solicitudes.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'edicion' ? 'active' : ''}`}
          onClick={() => setActiveTab('edicion')}
        >
          Solicitudes de Edición
          {solicitudesEdicion.length > 0 && <span className="badge">{solicitudesEdicion.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'desactivacion' ? 'active' : ''}`}
          onClick={() => setActiveTab('desactivacion')}
        >
          Solicitudes de Desactivación
          {solicitudesDesactivacion.length > 0 && <span className="badge">{solicitudesDesactivacion.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'reactivacion' ? 'active' : ''}`}
          onClick={() => setActiveTab('reactivacion')}
        >
          Solicitudes de Reactivación
          {solicitudesReactivacion.length > 0 && <span className="badge">{solicitudesReactivacion.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'cambio-rol' ? 'active' : ''}`}
          onClick={() => setActiveTab('cambio-rol')}
        >
          Cambio de Rol
          {solicitudesCambioRol.length > 0 && <span className="badge">{solicitudesCambioRol.length}</span>}
        </button>
      </div>

      {/* Contenido de Solicitudes de Registro */}
      {activeTab === 'registro' && (
        <>
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
        </>
      )}

      {/* Contenido de Solicitudes de Edición */}
      {activeTab === 'edicion' && (
        <>
          {errorEdicion && <div className="error-message">{errorEdicion}</div>}

          {solicitudesEdicion.length === 0 ? (
            <div className="no-solicitudes">
              <p>No hay solicitudes de edición pendientes</p>
            </div>
          ) : (
            <div className="solicitudes-grid">
              {solicitudesEdicion.map((solicitud) => (
                <div key={solicitud.idSolicitud} className="solicitud-card edicion-card">
                  <div className="solicitud-header">
                    <h3>Solicitud de Edición - {solicitud.nombreCompletoActual}</h3>
                    <span className="solicitud-fecha">
                      {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CR')}
                    </span>
                  </div>
                  <div className="solicitud-info">
                    <div className="cambios-section">
                      <h4>Cambios Solicitados:</h4>

                      {solicitud.nombreCompletoNuevo && (
                        <div className="cambio-item">
                          <p className="cambio-label">Nombre Completo:</p>
                          <p className="cambio-actual">Actual: {solicitud.nombreCompletoActual}</p>
                          <p className="cambio-nuevo">Nuevo: {solicitud.nombreCompletoNuevo}</p>
                        </div>
                      )}

                      {solicitud.correoNuevo && (
                        <div className="cambio-item">
                          <p className="cambio-label">Correo Electrónico:</p>
                          <p className="cambio-actual">Actual: {solicitud.correoActual}</p>
                          <p className="cambio-nuevo">Nuevo: {solicitud.correoNuevo}</p>
                        </div>
                      )}

                      {solicitud.telefonoNuevo !== null && (
                        <div className="cambio-item">
                          <p className="cambio-label">Teléfono:</p>
                          <p className="cambio-actual">
                            Actual: {solicitud.telefonoActual || 'No especificado'}
                          </p>
                          <p className="cambio-nuevo">Nuevo: {solicitud.telefonoNuevo || 'No especificado'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="solicitud-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApproveClickEdicion(solicitud)}
                      disabled={actionLoadingEdicion}
                    >
                      Aprobar
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectClickEdicion(solicitud)}
                      disabled={actionLoadingEdicion}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contenido de Solicitudes de Desactivación */}
      {activeTab === 'desactivacion' && (
        <>
          {errorDesactivacion && <div className="error-message">{errorDesactivacion}</div>}

          {solicitudesDesactivacion.length === 0 ? (
            <div className="no-solicitudes">
              <p>No hay solicitudes de desactivación pendientes</p>
            </div>
          ) : (
            <div className="solicitudes-grid">
              {solicitudesDesactivacion.map((solicitud) => (
                <div key={solicitud.idSolicitud} className="solicitud-card">
                  <div className="solicitud-header">
                    <h3>Solicitud de Desactivación</h3>
                    <span className="solicitud-fecha">
                      {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CR')}
                    </span>
                  </div>
                  <div className="solicitud-info">
                    <p>
                      <strong>Solicitante:</strong> {solicitud.solicitante.nombreCompleto}
                    </p>
                    <p>
                      <strong>Usuario a desactivar:</strong> {solicitud.usuarioDesactivar.nombreCompleto}
                    </p>
                    <p>
                      <strong>Email:</strong> {solicitud.usuarioDesactivar.correoElectronico}
                    </p>
                    {solicitud.usuarioDesactivar.telefono && (
                      <p>
                        <strong>Teléfono:</strong> {solicitud.usuarioDesactivar.telefono}
                      </p>
                    )}
                    <p>
                      <strong>Casa:</strong> #{solicitud.usuarioDesactivar.casa.numeroCasa}
                    </p>
                    <p>
                      <strong>Motivo:</strong> {solicitud.motivo}
                    </p>
                  </div>
                  <div className="solicitud-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApproveClickDesactivacion(solicitud)}
                      disabled={actionLoadingDesactivacion}
                    >
                      Aprobar
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectClickDesactivacion(solicitud)}
                      disabled={actionLoadingDesactivacion}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contenido de Solicitudes de Reactivación */}
      {activeTab === 'reactivacion' && (
        <>
          {errorReactivacion && <div className="error-message">{errorReactivacion}</div>}

          {solicitudesReactivacion.length === 0 ? (
            <div className="no-solicitudes">
              <p>No hay solicitudes de reactivación pendientes</p>
            </div>
          ) : (
            <div className="solicitudes-grid">
              {solicitudesReactivacion.map((solicitud) => (
                <div key={solicitud.idSolicitud} className="solicitud-card">
                  <div className="solicitud-header">
                    <h3>Solicitud de Reactivación</h3>
                    <span className="solicitud-fecha">
                      {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CR')}
                    </span>
                  </div>
                  <div className="solicitud-info">
                    <p>
                      <strong>Usuario:</strong> {solicitud.usuario.nombreCompleto}
                    </p>
                    <p>
                      <strong>Email:</strong> {solicitud.usuario.correoElectronico}
                    </p>
                    {solicitud.usuario.telefono && (
                      <p>
                        <strong>Teléfono:</strong> {solicitud.usuario.telefono}
                      </p>
                    )}
                    <p>
                      <strong>Casa actual:</strong> {solicitud.usuario.casa ? `#${solicitud.usuario.casa.numeroCasa}` : 'Sin asignar'}
                    </p>
                    <p>
                      <strong>Casa solicitada:</strong> #{solicitud.casaNueva.numeroCasa}
                    </p>
                    <p>
                      <strong>Estado actual:</strong> {solicitud.usuario.estadoCuenta}
                    </p>
                    <p>
                      <strong>Motivo:</strong> {solicitud.motivo}
                    </p>
                  </div>
                  <div className="solicitud-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApproveClickReactivacion(solicitud)}
                      disabled={actionLoadingReactivacion}
                    >
                      Aprobar
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectClickReactivacion(solicitud)}
                      disabled={actionLoadingReactivacion}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contenido de Solicitudes de Cambio de Rol */}
      {activeTab === 'cambio-rol' && (
        <>
          {errorCambioRol && <div className="error-message">{errorCambioRol}</div>}

          {solicitudesCambioRol.length === 0 ? (
            <div className="no-solicitudes">
              <p>No hay solicitudes de cambio de rol pendientes</p>
            </div>
          ) : (
            <div className="solicitudes-grid">
              {solicitudesCambioRol.map((solicitud) => (
                <div key={solicitud.idSolicitud} className="solicitud-card cambio-rol-card">
                  <div className="solicitud-header">
                    <h3>
                      {solicitud.tipoCambio === 'asignar_admin' ? '🔼 Asignar Administrador' : '🔽 Remover Administrador'}
                    </h3>
                    <span className={`estado-badge ${solicitud.estado}`}>
                      {solicitud.estado === 'pendiente' && '⏳ Pendiente'}
                      {solicitud.estado === 'aprobada_parcial' && '🔵 Aprobada Parcial (1/2)'}
                      {solicitud.estado === 'aprobada' && '✅ Aprobada'}
                      {solicitud.estado === 'rechazada' && '❌ Rechazada'}
                    </span>
                    <p className="fecha-solicitud">
                      {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  
                  <div className="solicitud-info">
                    <h4>👤 Usuario Afectado</h4>
                    <p>
                      <strong>Nombre:</strong> {solicitud.usuarioAfectado.nombreCompleto}
                    </p>
                    <p>
                      <strong>Email:</strong> {solicitud.usuarioAfectado.correoElectronico}
                    </p>
                    {solicitud.usuarioAfectado.casa && (
                      <p>
                        <strong>Casa:</strong> #{solicitud.usuarioAfectado.casa.numeroCasa}
                      </p>
                    )}
                    <p>
                      <strong>Rol Actual:</strong>{' '}
                      <span className="rol-badge actual">{solicitud.rolActual}</span>
                    </p>
                    <p>
                      <strong>Rol Nuevo:</strong>{' '}
                      <span className="rol-badge nuevo">{solicitud.rolNuevo}</span>
                    </p>
                  </div>

                  <div className="solicitud-info">
                    <h4>📝 Información de la Solicitud</h4>
                    <p>
                      <strong>Solicitado por:</strong> {solicitud.usuarioSolicitante.nombreCompleto}
                    </p>
                    <p>
                      <strong>Email:</strong> {solicitud.usuarioSolicitante.correoElectronico}
                    </p>
                    <div className="justificacion-box">
                      <strong>Justificación:</strong>
                      <p>{solicitud.justificacion}</p>
                    </div>
                  </div>

                  {/* Información de revisión */}
                  {(solicitud.estado === 'aprobada_parcial' || 
                    solicitud.estado === 'aprobada' || 
                    solicitud.estado === 'rechazada') && (
                    <div className="solicitud-info revision-info">
                      <h4>✍️ Revisiones</h4>
                      
                      {/* Primera revisión */}
                      {solicitud.primerRevisor && (
                        <div className="revision-item">
                          <h5>
                            {solicitud.estado === 'aprobada' && !solicitud.segundoRevisor 
                              ? '⭐ Aprobación de Super Administrador' 
                              : '📝 Primera Revisión'}
                          </h5>
                          <p>
                            <strong>Revisado por:</strong> {solicitud.primerRevisor.nombreCompleto}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{' '}
                            {solicitud.fechaPrimeraRevision &&
                              new Date(solicitud.fechaPrimeraRevision).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </p>
                          {solicitud.comentariosPrimerRevisor && (
                            <div className="comentarios-box">
                              <strong>Comentarios:</strong>
                              <p>{solicitud.comentariosPrimerRevisor}</p>
                            </div>
                          )}
                          {solicitud.estado === 'aprobada' && !solicitud.segundoRevisor && (
                            <div className="super-admin-badge">
                              ⚡ Aprobación directa por privilegios de super administrador
                            </div>
                          )}
                        </div>
                      )}

                      {/* Segunda revisión */}
                      {solicitud.segundoRevisor && (
                        <div className="revision-item">
                          <h5>📝 Segunda Revisión</h5>
                          <p>
                            <strong>Revisado por:</strong> {solicitud.segundoRevisor.nombreCompleto}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{' '}
                            {solicitud.fechaSegundaRevision &&
                              new Date(solicitud.fechaSegundaRevision).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </p>
                          {solicitud.comentariosSegundoRevisor && (
                            <div className="comentarios-box">
                              <strong>Comentarios:</strong>
                              <p>{solicitud.comentariosSegundoRevisor}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mensaje de estado parcial */}
                      {solicitud.estado === 'aprobada_parcial' && (
                        <div className="alerta-aprobacion-parcial">
                          ⚠️ <strong>Pendiente segunda aprobación</strong><br/>
                          Esta solicitud ha sido aprobada por un administrador y requiere la aprobación de un segundo administrador para aplicar el cambio.
                        </div>
                      )}
                    </div>
                  )}

                  {(solicitud.estado === 'pendiente' || solicitud.estado === 'aprobada_parcial') && (
                    <div className="solicitud-actions">
                      <button
                        className="btn-review"
                        onClick={() => handleReviewClickCambioRol(solicitud)}
                        disabled={actionLoadingCambioRol}
                      >
                        {solicitud.estado === 'aprobada_parcial' 
                          ? '🔒 Dar Segunda Aprobación' 
                          : 'Revisar Solicitud'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modales de Solicitudes de Registro */}
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

      {/* Modales de Solicitudes de Edición */}
      {/* Modal de Aprobación de Edición */}
      {showApproveModalEdicion && selectedSolicitudEdicion && (
        <div className="modal-overlay" onClick={() => setShowApproveModalEdicion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Aprobar Solicitud de Edición</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitudEdicion.nombreCompletoActual}
            </p>

            <div className="cambios-modal">
              <h3>Cambios a Aplicar:</h3>
              {selectedSolicitudEdicion.nombreCompletoNuevo && (
                <div className="cambio-modal-item">
                  <p><strong>Nombre:</strong></p>
                  <p>De: {selectedSolicitudEdicion.nombreCompletoActual}</p>
                  <p>A: {selectedSolicitudEdicion.nombreCompletoNuevo}</p>
                </div>
              )}
              {selectedSolicitudEdicion.correoNuevo && (
                <div className="cambio-modal-item">
                  <p><strong>Correo:</strong></p>
                  <p>De: {selectedSolicitudEdicion.correoActual}</p>
                  <p>A: {selectedSolicitudEdicion.correoNuevo}</p>
                </div>
              )}
              {selectedSolicitudEdicion.telefonoNuevo !== null && (
                <div className="cambio-modal-item">
                  <p><strong>Teléfono:</strong></p>
                  <p>De: {selectedSolicitudEdicion.telefonoActual || 'No especificado'}</p>
                  <p>A: {selectedSolicitudEdicion.telefonoNuevo || 'No especificado'}</p>
                </div>
              )}
            </div>

            <p style={{ marginTop: '1rem', color: '#666' }}>
              ¿Deseas aprobar esta solicitud de edición?
            </p>

            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={handleApproveEdicion}
                disabled={actionLoadingEdicion}
              >
                {actionLoadingEdicion ? 'Aprobando...' : 'Confirmar Aprobación'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowApproveModalEdicion(false)}
                disabled={actionLoadingEdicion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo de Edición */}
      {showRejectModalEdicion && selectedSolicitudEdicion && (
        <div className="modal-overlay" onClick={() => setShowRejectModalEdicion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Rechazar Solicitud de Edición</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitudEdicion.nombreCompletoActual}
            </p>

            <div className="form-group">
              <label htmlFor="motivoEdicion">Motivo del Rechazo *</label>
              <textarea
                id="motivoEdicion"
                value={motivoEdicion}
                onChange={(e) => setMotivoEdicion(e.target.value)}
                placeholder="Explica el motivo del rechazo (10-500 caracteres)"
                minLength={10}
                maxLength={500}
                rows={4}
                required
                disabled={actionLoadingEdicion}
              />
              <small>
                {motivoEdicion.length}/500 caracteres (mínimo 10)
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="btn-reject"
                onClick={handleRejectEdicion}
                disabled={actionLoadingEdicion || motivoEdicion.length < 10}
              >
                {actionLoadingEdicion ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModalEdicion(false)}
                disabled={actionLoadingEdicion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Solicitudes de Desactivación */}
      {/* Modal de Aprobación de Desactivación */}
      {showApproveModalDesactivacion && selectedSolicitudDesactivacion && (
        <div className="modal-overlay" onClick={() => setShowApproveModalDesactivacion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Aprobar Solicitud de Desactivación</h2>
            <p>
              <strong>Solicitante:</strong> {selectedSolicitudDesactivacion.solicitante.nombreCompleto}
            </p>
            <p>
              <strong>Usuario a desactivar:</strong> {selectedSolicitudDesactivacion.usuarioDesactivar.nombreCompleto}
            </p>
            <p>
              <strong>Email:</strong> {selectedSolicitudDesactivacion.usuarioDesactivar.correoElectronico}
            </p>
            <p>
              <strong>Casa:</strong> #{selectedSolicitudDesactivacion.usuarioDesactivar.casa.numeroCasa}
            </p>
            <p>
              <strong>Motivo:</strong> {selectedSolicitudDesactivacion.motivo}
            </p>

            <p style={{ marginTop: '1rem', color: '#dc3545', fontWeight: 'bold' }}>
              ¿Deseas aprobar esta solicitud? El usuario será desactivado y no podrá acceder al sistema.
            </p>

            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={handleApproveDesactivacion}
                disabled={actionLoadingDesactivacion}
              >
                {actionLoadingDesactivacion ? 'Aprobando...' : 'Confirmar Desactivación'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowApproveModalDesactivacion(false)}
                disabled={actionLoadingDesactivacion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo de Desactivación */}
      {showRejectModalDesactivacion && selectedSolicitudDesactivacion && (
        <div className="modal-overlay" onClick={() => setShowRejectModalDesactivacion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Rechazar Solicitud de Desactivación</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitudDesactivacion.usuarioDesactivar.nombreCompleto}
            </p>
            <p>
              <strong>Solicitado por:</strong> {selectedSolicitudDesactivacion.solicitante.nombreCompleto}
            </p>

            <div className="form-group">
              <label htmlFor="motivoDesactivacion">Motivo del Rechazo *</label>
              <textarea
                id="motivoDesactivacion"
                value={motivoDesactivacion}
                onChange={(e) => setMotivoDesactivacion(e.target.value)}
                placeholder="Explica el motivo del rechazo (10-500 caracteres)"
                minLength={10}
                maxLength={500}
                rows={4}
                required
                disabled={actionLoadingDesactivacion}
              />
              <small>
                {motivoDesactivacion.length}/500 caracteres (mínimo 10)
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="btn-reject"
                onClick={handleRejectDesactivacion}
                disabled={actionLoadingDesactivacion || motivoDesactivacion.length < 10}
              >
                {actionLoadingDesactivacion ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModalDesactivacion(false)}
                disabled={actionLoadingDesactivacion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Solicitudes de Reactivación */}
      {/* Modal de Aprobación de Reactivación */}
      {showApproveModalReactivacion && selectedSolicitudReactivacion && (
        <div className="modal-overlay" onClick={() => setShowApproveModalReactivacion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Aprobar Solicitud de Reactivación</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitudReactivacion.usuario.nombreCompleto}
            </p>
            <p>
              <strong>Email:</strong> {selectedSolicitudReactivacion.usuario.correoElectronico}
            </p>
            <p>
              <strong>Casa actual:</strong> {selectedSolicitudReactivacion.usuario.casa ? `#${selectedSolicitudReactivacion.usuario.casa.numeroCasa}` : 'Sin asignar'}
            </p>
            <p>
              <strong>Casa solicitada:</strong> #{selectedSolicitudReactivacion.casaNueva.numeroCasa}
            </p>
            <p>
              <strong>Estado actual:</strong> {selectedSolicitudReactivacion.usuario.estadoCuenta}
            </p>
            <p>
              <strong>Motivo:</strong> {selectedSolicitudReactivacion.motivo}
            </p>

            <p style={{ marginTop: '1rem', color: '#28a745', fontWeight: 'bold' }}>
              ¿Deseas aprobar esta solicitud? El usuario será reactivado y asignado a la casa #{selectedSolicitudReactivacion.casaNueva.numeroCasa}.
            </p>

            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={handleApproveReactivacion}
                disabled={actionLoadingReactivacion}
              >
                {actionLoadingReactivacion ? 'Aprobando...' : 'Confirmar Reactivación'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowApproveModalReactivacion(false)}
                disabled={actionLoadingReactivacion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo de Reactivación */}
      {showRejectModalReactivacion && selectedSolicitudReactivacion && (
        <div className="modal-overlay" onClick={() => setShowRejectModalReactivacion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Rechazar Solicitud de Reactivación</h2>
            <p>
              <strong>Usuario:</strong> {selectedSolicitudReactivacion.usuario.nombreCompleto}
            </p>
            <p>
              <strong>Email:</strong> {selectedSolicitudReactivacion.usuario.correoElectronico}
            </p>
            <p>
              <strong>Casa solicitada:</strong> #{selectedSolicitudReactivacion.casaNueva.numeroCasa}
            </p>

            <div className="form-group">
              <label htmlFor="motivoReactivacion">Motivo del Rechazo *</label>
              <textarea
                id="motivoReactivacion"
                value={motivoReactivacion}
                onChange={(e) => setMotivoReactivacion(e.target.value)}
                placeholder="Explica el motivo del rechazo (10-500 caracteres)"
                minLength={10}
                maxLength={500}
                rows={4}
                required
                disabled={actionLoadingReactivacion}
              />
              <small>
                {motivoReactivacion.length}/500 caracteres (mínimo 10)
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="btn-reject"
                onClick={handleRejectReactivacion}
                disabled={actionLoadingReactivacion || motivoReactivacion.length < 10}
              >
                {actionLoadingReactivacion ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModalReactivacion(false)}
                disabled={actionLoadingReactivacion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revisión de Cambio de Rol */}
      {showReviewModalCambioRol && selectedSolicitudCambioRol && (
        <div className="modal-overlay" onClick={() => setShowReviewModalCambioRol(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Revisar Solicitud de Cambio de Rol</h2>
            
            <div className="review-info-box">
              <p>
                <strong>Usuario:</strong> {selectedSolicitudCambioRol.usuarioAfectado.nombreCompleto}
              </p>
              <p>
                <strong>Cambio solicitado:</strong>{' '}
                <span className="rol-badge">{selectedSolicitudCambioRol.rolActual}</span>
                {' → '}
                <span className="rol-badge">{selectedSolicitudCambioRol.rolNuevo}</span>
              </p>
              <p>
                <strong>Tipo:</strong>{' '}
                {selectedSolicitudCambioRol.tipoCambio === 'asignar_admin'
                  ? 'Asignar Administrador'
                  : 'Remover Administrador'}
              </p>
              <p>
                <strong>Solicitado por:</strong>{' '}
                {selectedSolicitudCambioRol.usuarioSolicitante.nombreCompleto}
              </p>
              <div style={{ marginTop: '1rem' }}>
                <strong>Justificación:</strong>
                <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                  {selectedSolicitudCambioRol.justificacion}
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="decision-cambio-rol">
                Decisión <span className="required">*</span>
              </label>
              <select
                id="decision-cambio-rol"
                value={reviewEstadoCambioRol}
                onChange={(e) => setReviewEstadoCambioRol(e.target.value as 'aprobada' | 'rechazada')}
                disabled={actionLoadingCambioRol}
              >
                <option value="aprobada">✅ Aprobar</option>
                <option value="rechazada">❌ Rechazar</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comentarios-cambio-rol">
                Comentarios {reviewEstadoCambioRol === 'rechazada' && <span className="required">*</span>}
              </label>
              <textarea
                id="comentarios-cambio-rol"
                value={comentariosCambioRol}
                onChange={(e) => setComentariosCambioRol(e.target.value)}
                placeholder={
                  reviewEstadoCambioRol === 'rechazada'
                    ? 'Explica el motivo del rechazo (obligatorio)'
                    : 'Comentarios adicionales (opcional)'
                }
                rows={4}
                disabled={actionLoadingCambioRol}
              />
              {reviewEstadoCambioRol === 'rechazada' && (
                <small>Los comentarios son obligatorios al rechazar</small>
              )}
            </div>

            <div className="modal-actions">
              <button
                className={reviewEstadoCambioRol === 'aprobada' ? 'btn-approve' : 'btn-reject'}
                onClick={handleReviewCambioRol}
                disabled={
                  actionLoadingCambioRol ||
                  (reviewEstadoCambioRol === 'rechazada' && comentariosCambioRol.trim().length === 0)
                }
              >
                {actionLoadingCambioRol
                  ? 'Procesando...'
                  : reviewEstadoCambioRol === 'aprobada'
                  ? 'Aprobar Solicitud'
                  : 'Rechazar Solicitud'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowReviewModalCambioRol(false)}
                disabled={actionLoadingCambioRol}
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

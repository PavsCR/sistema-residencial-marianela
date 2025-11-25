import { useState, useEffect } from 'react';
import './Comprobantes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Pago {
  idPago: number;
  monto: string;
  descripcion: string;
  fechaPago: string;
  estado: string;
  metodoPago: string | null;
  comprobante: string | null;
  casa: {
    numeroCasa: string;
  };
}

interface ModalData {
  pago: Pago;
  imageUrl: string;
}

const Comprobantes = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/pagos/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar los pagos');
      }

      setPagos(result.data);
    } catch (err: any) {
      console.error('Error al cargar pagos:', err);
      setError(err.message || 'Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (pago: Pago) => {
    if (!pago.comprobante) {
      alert('Este pago no tiene comprobante adjunto');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const imageUrl = `${API_URL}/api/pagos/${pago.idPago}/comprobante?token=${token}`;

      setModalData({
        pago,
        imageUrl
      });
    } catch (err: any) {
      console.error('Error al abrir comprobante:', err);
      alert('Error al cargar el comprobante');
    }
  };

  const closeModal = () => {
    setModalData(null);
  };

  const handleEstadoChange = async (idPago: number, nuevoEstado: string) => {
    if (!confirm(`¿Está seguro de ${nuevoEstado === 'aprobado' ? 'aprobar' : 'rechazar'} este pago?`)) {
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/pagos/${idPago}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar estado');
      }

      // Update local state
      setPagos(pagos.map(p =>
        p.idPago === idPago ? { ...p, estado: nuevoEstado } : p
      ));

      closeModal();
      alert(`Pago ${nuevoEstado} exitosamente`);
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert(err.message || 'Error al actualizar el estado del pago');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado'
    };
    return labels[estado] || estado;
  };

  const filteredPagos = pagos.filter(pago => {
    if (filterEstado === 'todos') return true;
    return pago.estado === filterEstado;
  });

  const estadisticas = {
    total: pagos.length,
    pendientes: pagos.filter(p => p.estado === 'pendiente').length,
    aprobados: pagos.filter(p => p.estado === 'aprobado').length,
    rechazados: pagos.filter(p => p.estado === 'rechazado').length,
    conComprobante: pagos.filter(p => p.comprobante).length
  };

  if (loading) {
    return (
      <div className="comprobantes-container">
        <h1>Gestión de Comprobantes</h1>
        <div className="loading-container">
          <p>Cargando comprobantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comprobantes-container">
        <h1>Gestión de Comprobantes</h1>
        <div className="error-message">
          {error}
        </div>
        <button onClick={fetchPagos} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="comprobantes-container">
      <h1>Gestión de Comprobantes de Pago</h1>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{estadisticas.total}</div>
            <div className="stat-label">Total Pagos</div>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-info">
            <div className="stat-value">{estadisticas.pendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-info">
            <div className="stat-value">{estadisticas.aprobados}</div>
            <div className="stat-label">Aprobados</div>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-info">
            <div className="stat-value">{estadisticas.rechazados}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{estadisticas.conComprobante}</div>
            <div className="stat-label">Con Comprobante</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <label>Filtrar por estado:</label>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobado">Aprobados</option>
          <option value="rechazado">Rechazados</option>
        </select>
        <span className="filter-count">
          Mostrando {filteredPagos.length} de {pagos.length} pagos
        </span>
      </div>

      {/* Tabla de Comprobantes */}
      {filteredPagos.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon"></div>
          <h3>No hay pagos {filterEstado !== 'todos' ? getEstadoLabel(filterEstado).toLowerCase() : ''}</h3>
          <p>No se encontraron registros de pagos para mostrar</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="comprobantes-table">
            <thead>
              <tr>
                <th>Casa</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos.map((pago) => (
                <tr key={pago.idPago}>
                  <td className="casa-cell">
                    <span className="casa-number">Casa {pago.casa.numeroCasa}</span>
                  </td>
                  <td className="monto-cell">{formatCurrency(pago.monto)}</td>
                  <td className="descripcion-cell">{pago.descripcion}</td>
                  <td className="fecha-cell">{formatDate(pago.fechaPago)}</td>
                  <td className="metodo-cell">{pago.metodoPago || 'N/A'}</td>
                  <td>
                    <span className={`estado-badge estado-${pago.estado}`}>
                      {getEstadoLabel(pago.estado)}
                    </span>
                  </td>
                  <td className="comprobante-cell">
                    {pago.comprobante ? (
                      <span className="has-comprobante">Sí</span>
                    ) : (
                      <span className="no-comprobante">No</span>
                    )}
                  </td>
                  <td className="acciones-cell">
                    {pago.comprobante && (
                      <button
                        onClick={() => openModal(pago)}
                        className="btn-revisar"
                        disabled={processing}
                      >
                        Revisar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Comprobante de Pago</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="pago-info">
                <div className="info-row">
                  <span className="info-label">Casa:</span>
                  <span className="info-value">Casa {modalData.pago.casa.numeroCasa}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Monto:</span>
                  <span className="info-value">{formatCurrency(modalData.pago.monto)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha:</span>
                  <span className="info-value">{formatDate(modalData.pago.fechaPago)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estado:</span>
                  <span className={`estado-badge estado-${modalData.pago.estado}`}>
                    {getEstadoLabel(modalData.pago.estado)}
                  </span>
                </div>
              </div>

              <div className="comprobante-image-container">
                <img
                  src={modalData.imageUrl}
                  alt="Comprobante de pago"
                  className="comprobante-image"
                />
              </div>
            </div>

            <div className="modal-footer">
              {modalData.pago.estado === 'pendiente' && (
                <>
                  <button
                    onClick={() => handleEstadoChange(modalData.pago.idPago, 'aprobado')}
                    className="btn-aprobar"
                    disabled={processing}
                  >
                    Aprobar Pago
                  </button>
                  <button
                    onClick={() => handleEstadoChange(modalData.pago.idPago, 'rechazado')}
                    className="btn-rechazar"
                    disabled={processing}
                  >
                    Rechazar Pago
                  </button>
                </>
              )}
              <button onClick={closeModal} className="btn-cerrar">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comprobantes;

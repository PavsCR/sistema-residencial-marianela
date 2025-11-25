import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PagosCasa.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Pago {
  idPago: number;
  monto: string;
  descripcion: string;
  fechaPago: string;
  metodoPago: string;
  estado: string;
  comprobante: string | null;
}

interface CasaInfo {
  numeroCasa: string;
  estadoPago: string;
  usuarios: number;
}

interface PagosData {
  casa: CasaInfo;
  pagos: Pago[];
  mesActual?: {
    cuotaMensual: number;
    totalPagado: number;
    montoAdeudado: number;
    mes: string;
  };
}

const PagosCasa = () => {
  const { numeroCasa } = useParams<{ numeroCasa: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PagosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState('');
  
  // Comprobante form
  const [comprobanteForm, setComprobanteForm] = useState({
    fechaPago: new Date().toISOString().slice(0, 10),
    mesPago: new Date().toISOString().slice(0, 7),
    monto: '',
    descripcion: '',
    metodoPago: 'transferencia'
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPagos();
  }, [numeroCasa]);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/pagos/casa/${numeroCasa}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar los pagos');
      }

      setData(result.data);
      setSelectedEstado(result.data.casa.estadoPago);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/casas/${numeroCasa}/estado-pago`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estadoPago: selectedEstado })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar el estado');
      }

      alert('Estado de pago actualizado exitosamente');
      setShowEstadoModal(false);
      fetchPagos();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el estado');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert('El archivo es demasiado grande. Tamaño máximo: 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleComprobanteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('numeroCasa', numeroCasa!);
      formData.append('fechaPago', comprobanteForm.fechaPago);
      formData.append('mesPago', comprobanteForm.mesPago);
      formData.append('monto', comprobanteForm.monto);
      formData.append('descripcion', comprobanteForm.descripcion);
      formData.append('metodoPago', comprobanteForm.metodoPago);
      formData.append('comprobante', file);

      const response = await fetch(`${API_URL}/api/pagos/confirmar-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrar el pago');
      }

      alert('Comprobante de pago registrado exitosamente');
      closeComprobanteModal();
      fetchPagos();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el pago');
    }
  };

  const closeComprobanteModal = () => {
    setShowComprobanteModal(false);
    setComprobanteForm({
      fechaPago: new Date().toISOString().slice(0, 10),
      mesPago: new Date().toISOString().slice(0, 7),
      monto: '',
      descripcion: '',
      metodoPago: 'transferencia'
    });
    setFile(null);
    setFilePreview(null);
  };

  const verComprobante = (idPago: number) => {
    const token = localStorage.getItem('token');
    window.open(
      `${API_URL}/api/pagos/${idPago}/comprobante?token=${token}`,
      '_blank'
    );
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'al_dia': 'Al Día',
      'moroso': 'Moroso',
      'en_arreglo': 'Arreglo de Pago'
    };
    return labels[estado] || estado;
  };

  const getEstadoPagoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <div className="pagos-casa-container">
        <h1>Pagos Casa {numeroCasa}</h1>
        <div className="loading-container">
          <p>Cargando historial de pagos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagos-casa-container">
        <h1>Pagos Casa {numeroCasa}</h1>
        <div className="error-message">{error}</div>
        <button onClick={fetchPagos} className="btn-retry">Reintentar</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pagos-casa-container">
        <h1>Pagos Casa {numeroCasa}</h1>
        <div className="error-message">No se pudo cargar la información</div>
      </div>
    );
  }

  return (
    <div className="pagos-casa-container">
      <div className="page-header">
        <h1>Pagos - Casa {data.casa.numeroCasa}</h1>
        <button onClick={() => navigate('/finanzas/pagos')} className="btn-back">
          ← Volver
        </button>
      </div>

      {/* Casa Info & Actions */}
      <div className="casa-info-panel">
        <div className="casa-info-section">
          <div className="info-item">
            <span className="info-label">Estado de Pago:</span>
            <span className={`estado-badge ${data.casa.estadoPago}`}>
              {getEstadoLabel(data.casa.estadoPago)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Vecinos Registrados:</span>
            <span className="info-value">{data.casa.usuarios}</span>
          </div>
        </div>

        <div className="actions-section">
          <button
            className="btn-action btn-estado"
            onClick={() => setShowEstadoModal(true)}
          >
            Cambiar Estado
          </button>
          <button
            className="btn-action btn-comprobante"
            onClick={() => setShowComprobanteModal(true)}
          >
            + Registrar Pago
          </button>
        </div>
      </div>

      {/* Monthly Payment Info */}
      {data.mesActual && (
        <div className="monthly-payment-info">
          <h3>Estado de Pago - {data.mesActual.mes}</h3>
          <div className="monthly-stats">
            <div className="stat-item">
              <span className="stat-label">Cuota Mensual</span>
              <span className="stat-value">{formatCurrency(data.mesActual.cuotaMensual)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Pagado</span>
              <span className="stat-value success">{formatCurrency(data.mesActual.totalPagado)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Monto Pendiente</span>
              <span className={`stat-value ${data.mesActual.montoAdeudado > 0 ? 'warning' : 'success'}`}>
                {formatCurrency(data.mesActual.montoAdeudado)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pagos List */}
      {data.pagos.length === 0 ? (
        <div className="no-payments">
          <div className="no-payments-icon">📭</div>
          <h3>No hay pagos registrados</h3>
          <p>Esta casa aún no tiene pagos en el historial</p>
        </div>
      ) : (
        <div className="payments-list">
          {data.pagos.map((pago) => (
            <div key={pago.idPago} className="payment-card">
              <div className="payment-header">
                <div className="payment-amount">{formatCurrency(pago.monto)}</div>
                <span className={`estado-pago-badge ${pago.estado}`}>
                  {getEstadoPagoLabel(pago.estado)}
                </span>
              </div>

              <div className="payment-body">
                <div className="payment-info-row">
                  <span className="label">Fecha:</span>
                  <span className="value">{formatDate(pago.fechaPago)}</span>
                </div>
                <div className="payment-info-row">
                  <span className="label">Método:</span>
                  <span className="value">{pago.metodoPago || 'No especificado'}</span>
                </div>
                <div className="payment-description">
                  {pago.descripcion}
                </div>
                {pago.comprobante && (
                  <button
                    className="btn-ver-comprobante"
                    onClick={() => verComprobante(pago.idPago)}
                  >
                    📄 Ver Comprobante
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {showEstadoModal && (
        <div className="modal-overlay" onClick={() => setShowEstadoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cambiar Estado de Pago - Casa {data.casa.numeroCasa}</h2>
              <button className="modal-close" onClick={() => setShowEstadoModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="info-box">
                <p><strong>Estado actual:</strong> {getEstadoLabel(data.casa.estadoPago)}</p>
                <p className="info-text">
                  El estado "Arreglo de Pago" se muestra en amarillo en el mapa del residencial.
                </p>
              </div>

              <div className="form-group">
                <label>Nuevo Estado de Pago</label>
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="estado-select"
                >
                  <option value="al_dia">Al Día</option>
                  <option value="en_arreglo">Arreglo de Pago (Amarillo en mapa)</option>
                  <option value="moroso">Moroso</option>
                </select>
              </div>

              <div className="modal-footer">
                <button onClick={handleEstadoChange} className="btn-submit">
                  Actualizar Estado
                </button>
                <button onClick={() => setShowEstadoModal(false)} className="btn-cancel">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Comprobante */}
      {showComprobanteModal && (
        <div className="modal-overlay" onClick={closeComprobanteModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Comprobante de Pago - Casa {data.casa.numeroCasa}</h2>
              <button className="modal-close" onClick={closeComprobanteModal}>×</button>
            </div>

            <form onSubmit={handleComprobanteSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fechaPago">Fecha de Pago</label>
                  <input
                    type="date"
                    id="fechaPago"
                    value={comprobanteForm.fechaPago}
                    onChange={(e) => setComprobanteForm({ ...comprobanteForm, fechaPago: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mesPago">Mes al que Aplica</label>
                  <input
                    type="month"
                    id="mesPago"
                    value={comprobanteForm.mesPago}
                    onChange={(e) => setComprobanteForm({ ...comprobanteForm, mesPago: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monto">Monto (₡)</label>
                  <input
                    type="number"
                    id="monto"
                    value={comprobanteForm.monto}
                    onChange={(e) => setComprobanteForm({ ...comprobanteForm, monto: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="25000.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="metodoPago">Método de Pago</label>
                  <select
                    id="metodoPago"
                    value={comprobanteForm.metodoPago}
                    onChange={(e) => setComprobanteForm({ ...comprobanteForm, metodoPago: e.target.value })}
                    required
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="sinpe">SINPE Móvil</option>
                    <option value="deposito">Depósito Bancario</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={comprobanteForm.descripcion}
                  onChange={(e) => setComprobanteForm({ ...comprobanteForm, descripcion: e.target.value })}
                  required
                  rows={3}
                  placeholder="Ej: Pago cuota mensual abril 2025"
                />
              </div>

              <div className="form-group">
                <label htmlFor="comprobante">Comprobante (Imagen o PDF)</label>
                <input
                  type="file"
                  id="comprobante"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  required
                />
                <p className="file-info">Formatos permitidos: JPG, PNG, WEBP, PDF. Tamaño máximo: 5MB</p>
              </div>

              {filePreview && (
                <div className="file-preview">
                  <img src={filePreview} alt="Preview" />
                </div>
              )}

              {file && !filePreview && (
                <div className="file-selected">
                  📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="btn-submit">
                  Registrar Pago
                </button>
                <button type="button" onClick={closeComprobanteModal} className="btn-cancel">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosCasa;

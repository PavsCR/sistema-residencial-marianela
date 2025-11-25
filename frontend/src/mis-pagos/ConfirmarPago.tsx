import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConfirmarPago.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ConfirmarPago = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [fechaPago, setFechaPago] = useState('');
  const [mesPago, setMesPago] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);

  // Get current month/year for default
  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP) o archivos PDF');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('El archivo no debe superar 5MB');
      return;
    }

    setComprobante(file);
    setError(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setComprobantePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!fechaPago || !mesPago || !monto || !descripcion || !comprobante) {
        throw new Error('Todos los campos son obligatorios');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('fechaPago', fechaPago);
      formData.append('mesPago', mesPago);
      formData.append('monto', monto);
      formData.append('descripcion', descripcion);
      formData.append('metodoPago', metodoPago);
      formData.append('comprobante', comprobante);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/pagos/confirmar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al confirmar el pago');
      }

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/mis-pagos');
      }, 2000);
    } catch (err: any) {
      console.error('Error al confirmar pago:', err);
      setError(err.message || 'Error al confirmar el pago');
    } finally {
      setLoading(false);
    }
  };

  const formatMonthYear = (monthYear: string) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
  };

  if (success) {
    return (
      <div className="page-container">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2>¡Pago Confirmado!</h2>
          <p>Tu confirmación de pago ha sido enviada exitosamente.</p>
          <p>Será revisada por el administrador.</p>
          <p className="redirect-message">Redirigiendo a Mis Pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="confirmar-pago-header">
        <button onClick={() => navigate('/mis-pagos')} className="btn-back">
          ← Volver a Mis Pagos
        </button>
        <h1>Confirmar Pago</h1>
      </div>

      <form onSubmit={handleSubmit} className="confirmar-pago-form">
        <div className="form-section">
          <h3>Información del Pago</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fechaPago">
                Fecha de Pago <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fechaPago"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <small>Fecha en que realizaste el pago</small>
            </div>

            <div className="form-group">
              <label htmlFor="mesPago">
                Mes a Pagar <span className="required">*</span>
              </label>
              <input
                type="month"
                id="mesPago"
                value={mesPago}
                onChange={(e) => setMesPago(e.target.value)}
                defaultValue={getCurrentMonthYear()}
                required
              />
              <small>Mes al que corresponde el pago</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="monto">
                Monto (₡) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="0"
                step="0.01"
                placeholder="25000.00"
                required
              />
              <small>Monto pagado en colones</small>
            </div>

            <div className="form-group">
              <label htmlFor="metodoPago">
                Método de Pago <span className="required">*</span>
              </label>
              <select
                id="metodoPago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
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

          <div className="form-group full-width">
            <label htmlFor="descripcion">
              Descripción <span className="required">*</span>
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cuota mensual de noviembre 2025"
              rows={3}
              required
            />
            <small>Describe brevemente el concepto del pago</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Comprobante de Pago</h3>

          <div className="form-group full-width">
            <label htmlFor="comprobante">
              Subir Comprobante <span className="required">*</span>
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                id="comprobante"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                required
              />
              <label htmlFor="comprobante" className="file-upload-label">
                {comprobante ? (
                  <>
                    <span className="file-name">{comprobante.name}</span>
                    <span className="file-size">
                      ({(comprobante.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">📤</span>
                    <span>Haz clic para seleccionar un archivo</span>
                    <small>JPG, PNG, WEBP o PDF (máx. 5MB)</small>
                  </>
                )}
              </label>
            </div>
            
            {comprobantePreview && (
              <div className="image-preview">
                <img src={comprobantePreview} alt="Vista previa del comprobante" />
              </div>
            )}

            {comprobante && comprobante.type === 'application/pdf' && (
              <div className="pdf-preview">
                <div className="pdf-icon">📄</div>
                <p>Archivo PDF seleccionado</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {mesPago && (
          <div className="payment-summary">
            <h4>Resumen de la Confirmación</h4>
            <div className="summary-item">
              <span>Mes a pagar:</span>
              <strong>{formatMonthYear(mesPago)}</strong>
            </div>
            <div className="summary-item">
              <span>Monto:</span>
              <strong>
                {monto ? new Intl.NumberFormat('es-CR', {
                  style: 'currency',
                  currency: 'CRC'
                }).format(parseFloat(monto)) : '₡0.00'}
              </strong>
            </div>
            <div className="summary-item">
              <span>Método:</span>
              <strong>{metodoPago === 'transferencia' ? 'Transferencia Bancaria' :
                       metodoPago === 'sinpe' ? 'SINPE Móvil' :
                       metodoPago === 'deposito' ? 'Depósito Bancario' :
                       metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</strong>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/mis-pagos')}
            className="btn-cancel"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Confirmando...' : 'Confirmar Pago'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmarPago;

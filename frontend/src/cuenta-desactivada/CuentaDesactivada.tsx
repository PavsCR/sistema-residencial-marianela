import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CuentaDesactivada.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface LocationState {
  usuario?: {
    idUsuario: number;
    nombreCompleto: string;
    correoElectronico: string;
  };
}

export default function CuentaDesactivada() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [formData, setFormData] = useState({
    correoElectronico: state?.usuario?.correoElectronico || '',
    motivo: '',
    numeroCasaNuevo: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.motivo.length < 10 || formData.motivo.length > 500) {
      setError('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    if (!formData.numeroCasaNuevo.trim()) {
      setError('El número de casa es obligatorio');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/api/solicitudes/reactivacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar solicitud');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVolver = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="cuenta-desactivada-container">
        <div className="cuenta-desactivada-card success-card">
          <div className="success-icon">✓</div>
          <h1>Solicitud Enviada</h1>
          <p className="success-message">
            Tu solicitud de reactivación ha sido enviada exitosamente.
          </p>
          <p className="success-info">
            Un administrador revisará tu solicitud y recibirás una respuesta pronto.
            Una vez aprobada, podrás iniciar sesión nuevamente.
          </p>
          <button
            className="btn-volver"
            onClick={handleVolver}
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cuenta-desactivada-container">
      <div className="cuenta-desactivada-card">
        <div className="warning-icon">⚠️</div>
        <h1>Cuenta Desactivada</h1>

        {state?.usuario && (
          <div className="user-info">
            <p><strong>Usuario:</strong> {state.usuario.nombreCompleto}</p>
            <p><strong>Correo:</strong> {state.usuario.correoElectronico}</p>
          </div>
        )}

        <p className="info-message">
          Tu cuenta ha sido desactivada. Si deseas reactivar tu cuenta, por favor
          completa el siguiente formulario con la información solicitada.
        </p>

        <form onSubmit={handleSubmit} className="reactivacion-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="correoElectronico">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="correoElectronico"
              name="correoElectronico"
              value={formData.correoElectronico}
              onChange={handleInputChange}
              disabled={submitting || !!state?.usuario?.correoElectronico}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="numeroCasaNuevo">
              Número de Casa *
            </label>
            <input
              type="text"
              id="numeroCasaNuevo"
              name="numeroCasaNuevo"
              value={formData.numeroCasaNuevo}
              onChange={handleInputChange}
              placeholder="Ingresa el número de casa donde deseas ser reactivado"
              disabled={submitting}
              required
            />
            <small>
              Si cambiaste de casa, ingresa tu nuevo número de casa.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="motivo">
              Motivo de Reactivación *
            </label>
            <textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              placeholder="Explica por qué deseas reactivar tu cuenta (10-500 caracteres)"
              rows={4}
              disabled={submitting}
              required
            />
            <small>
              {formData.motivo.length}/500 caracteres (mínimo 10)
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting || formData.motivo.length < 10}
            >
              {submitting ? 'Enviando...' : 'Solicitar Reactivación'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleVolver}
              disabled={submitting}
            >
              Volver al Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

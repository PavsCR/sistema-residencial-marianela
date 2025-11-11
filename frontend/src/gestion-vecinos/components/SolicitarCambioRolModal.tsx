import { useState } from 'react';
import './SolicitarCambioRolModal.css';

interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  correoElectronico: string;
  rol: {
    nombreRol: string;
  };
}

interface SolicitarCambioRolModalProps {
  isOpen: boolean;
  usuario: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

const SolicitarCambioRolModal: React.FC<SolicitarCambioRolModalProps> = ({
  isOpen,
  usuario,
  onClose,
  onSuccess
}) => {
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  const esAdmin = usuario.rol.nombreRol === 'administrador';

  // Determinar el tipo de cambio automáticamente
  const tipoCambioAutomatico = esAdmin ? 'remover_admin' : 'asignar_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (justificacion.length < 10 || justificacion.length > 500) {
      alert('La justificación debe tener entre 10 y 500 caracteres');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3001/api/solicitudes/cambio-rol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idUsuarioAfectado: usuario.idUsuario,
          tipoCambio: tipoCambioAutomatico,
          justificacion
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear la solicitud');
      }

      alert('Solicitud de cambio de rol creada exitosamente. Debe ser aprobada por otro administrador.');
      setJustificacion('');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content solicitar-cambio-rol-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Solicitar Cambio de Rol</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="info-box">
            <p>⚠️ Esta solicitud debe ser aprobada por otro administrador antes de que el cambio se aplique.</p>
          </div>

          <div className="user-info-section">
            <h3>Usuario:</h3>
            <p><strong>Nombre:</strong> {usuario.nombreCompleto}</p>
            <p><strong>Email:</strong> {usuario.correoElectronico}</p>
            <p><strong>Rol Actual:</strong> <span className="rol-badge">{usuario.rol.nombreRol}</span></p>
          </div>

          <div className="cambio-info-section">
            <h3>Cambio Solicitado:</h3>
            <div className="cambio-display">
              {esAdmin ? (
                <>
                  <div className="rol-box actual">
                    <span className="rol-label">Rol Actual:</span>
                    <span className="rol-value admin">Administrador</span>
                  </div>
                  <div className="arrow">→</div>
                  <div className="rol-box nuevo">
                    <span className="rol-label">Rol Nuevo:</span>
                    <span className="rol-value vecino">Vecino</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="rol-box actual">
                    <span className="rol-label">Rol Actual:</span>
                    <span className="rol-value vecino">Vecino</span>
                  </div>
                  <div className="arrow">→</div>
                  <div className="rol-box nuevo">
                    <span className="rol-label">Rol Nuevo:</span>
                    <span className="rol-value admin">Administrador</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="justificacion">
              Justificación <span className="required">*</span>
            </label>
            <textarea
              id="justificacion"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Explica el motivo del cambio de rol (10-500 caracteres)"
              rows={5}
              disabled={loading}
              required
            />
            <small>
              {justificacion.length}/500 caracteres (mínimo 10)
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || justificacion.length < 10}
            >
              {loading ? 'Enviando...' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolicitarCambioRolModal;

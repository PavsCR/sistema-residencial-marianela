import { useState } from 'react';
import { authFetch } from '../../services/api';
import './EditUserModal.css';

interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  usuario: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, usuario, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: usuario.nombreCompleto,
    correoElectronico: usuario.correoElectronico,
    telefono: usuario.telefono || ''
  });
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const hasChanges = () => {
    return (
      formData.nombreCompleto !== usuario.nombreCompleto ||
      formData.correoElectronico !== usuario.correoElectronico ||
      formData.telefono !== (usuario.telefono || '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasChanges()) {
      setError('No se han realizado cambios');
      return;
    }

    if (!motivo.trim()) {
      setError('El motivo es requerido');
      return;
    }

    if (motivo.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);

    try {
      const datosNuevos: any = {};
      
      if (formData.nombreCompleto !== usuario.nombreCompleto) {
        datosNuevos.nombreCompleto = formData.nombreCompleto;
      }
      
      if (formData.correoElectronico !== usuario.correoElectronico) {
        datosNuevos.correoElectronico = formData.correoElectronico;
      }
      
      if (formData.telefono !== (usuario.telefono || '')) {
        datosNuevos.telefono = formData.telefono || null;
      }

      const response = await authFetch('/solicitudes/edicion-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreCompleto: formData.nombreCompleto,
          correoElectronico: formData.correoElectronico,
          telefono: formData.telefono || null,
          idUsuarioEditar: usuario.idUsuario
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar solicitud');
      }

      alert('Solicitud de cambio enviada exitosamente. Un administrador la revisará pronto.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Información del Usuario</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="info-text">
            Los cambios requieren aprobación de un administrador antes de ser aplicados.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombreCompleto">Nombre Completo *</label>
              <input
                type="text"
                id="nombreCompleto"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleInputChange}
                required
                disabled={loading}
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
                required
                disabled={loading}
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
                placeholder="Opcional"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="motivo">Motivo del Cambio *</label>
              <textarea
                id="motivo"
                name="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica por qué necesitas hacer estos cambios..."
                rows={4}
                required
                disabled={loading}
              />
              <small>{motivo.length}/500 caracteres (mínimo 10)</small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
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
                disabled={loading || !hasChanges() || motivo.length < 10}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

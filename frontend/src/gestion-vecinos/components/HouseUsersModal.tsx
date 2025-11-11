import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../services/api';
import './HouseUsersModal.css';
import EditUserModal from './EditUserModal.tsx';
import SolicitarCambioRolModal from './SolicitarCambioRolModal.tsx';

interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string | null;
  estadoCuenta: string;
  fechaRegistro: string;
  rol: {
    nombreRol: string;
  };
}

interface Casa {
  numeroCasa: string;
  estadoPago: string;
  creadoEn: string;
  actualizadoEn: string;
}

interface HouseData {
  casa: Casa;
  usuarios: Usuario[];
}

interface HouseUsersModalProps {
  isOpen: boolean;
  houseId: string;
  onClose: () => void;
}

const HouseUsersModal: React.FC<HouseUsersModalProps> = ({ isOpen, houseId, onClose }) => {
  const { user } = useAuth();
  const [houseData, setHouseData] = useState<HouseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [inactivateUser, setInactivateUser] = useState<Usuario | null>(null);
  const [inactivateMotivo, setInactivateMotivo] = useState('');
  const [inactivateLoading, setInactivateLoading] = useState(false);
  const [showCambioRolModal, setShowCambioRolModal] = useState(false);
  const [cambioRolUser, setCambioRolUser] = useState<Usuario | null>(null);

  useEffect(() => {
    if (isOpen && houseId) {
      fetchHouseUsers();
    }
  }, [isOpen, houseId]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && !target.closest('.member-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const fetchHouseUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`/casas/${houseId}/usuarios`);
      const data = await response.json();

      if (data.success) {
        // Ordenar usuarios: usuario actual primero
        if (user && data.data.usuarios) {
          data.data.usuarios.sort((a: Usuario, b: Usuario) => {
            if (a.idUsuario === user.id) return -1;
            if (b.idUsuario === user.id) return 1;
            return 0;
          });
        }
        setHouseData(data.data);
      } else {
        setError(data.message || 'Error al cargar los datos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Error fetching house users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'al_dia': 'Al día',
      'moroso': 'Moroso',
      'en_arreglo': 'En arreglo'
    };
    return statusMap[status] || status;
  };

  const getAccountStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'activo': 'Activo',
      'pendiente': 'Pendiente',
      'suspendido': 'Suspendido',
      'rechazado': 'Rechazado'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditUser = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditSuccess = () => {
    // Refresh house data after successful edit request
    fetchHouseUsers();
  };

  const toggleMenu = (idUsuario: number) => {
    setOpenMenuId(openMenuId === idUsuario ? null : idUsuario);
  };

  const handleInactivateClick = (usuario: Usuario) => {
    setInactivateUser(usuario);
    setInactivateMotivo('');
    setShowInactivateModal(true);
    setOpenMenuId(null);
  };

  const handleInactivateSubmit = async () => {
    if (!inactivateUser || !inactivateMotivo) return;

    if (inactivateMotivo.length < 10 || inactivateMotivo.length > 500) {
      alert('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    try {
      setInactivateLoading(true);
      const response = await authFetch('/solicitudes/desactivacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuarioDesactivar: inactivateUser.idUsuario,
          motivo: inactivateMotivo
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear solicitud');
      }

      alert('Solicitud de inactivación creada exitosamente. Debe ser aprobada por otro administrador.');
      setShowInactivateModal(false);
      setInactivateUser(null);
      setInactivateMotivo('');
    } catch (err: any) {
      alert(err.message || 'Error al crear solicitud de inactivación');
    } finally {
      setInactivateLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Casa {houseId}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading && <div className="loading">Cargando...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {houseData && (
            <>
              <div className="house-info">
                <h3>Información de la Casa</h3>
                <p><strong>Número:</strong> {houseData.casa.numeroCasa}</p>
                <p><strong>Estado de Pago:</strong> <span className={`status ${houseData.casa.estadoPago}`}>{getStatusText(houseData.casa.estadoPago)}</span></p>
                <p><strong>Fecha de Registro:</strong> {formatDate(houseData.casa.creadoEn)}</p>
              </div>
              
              <div className="users-section">
                <h3>Vecinos Registrados ({houseData.usuarios.length})</h3>
                
                {houseData.usuarios.length === 0 ? (
                  <p className="no-users">No hay vecinos registrados para esta casa.</p>
                ) : (
                  <div className="users-grid">
                    {houseData.usuarios.map(usuario => {
                      const isCurrentUser = usuario.idUsuario === user?.id;
                      return (
                        <div
                          key={usuario.idUsuario}
                          className={`member-card ${isCurrentUser ? 'current-user' : ''}`}
                        >
                          <div className="member-header">
                            <h4>
                              {usuario.nombreCompleto}
                              {isCurrentUser && <span className="current-user-badge"> (Tú)</span>}
                            </h4>
                            <div className="member-menu-container">
                              <button
                                className="btn-member-menu"
                                onClick={() => toggleMenu(usuario.idUsuario)}
                                title="Opciones"
                              >
                                ⚙️
                              </button>
                              {openMenuId === usuario.idUsuario && (
                                <div className="member-menu-dropdown">
                                  <button
                                    className="menu-option"
                                    onClick={() => {
                                      handleEditUser(usuario);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Editar información
                                  </button>
                                  <button
                                    className="menu-option"
                                    onClick={() => {
                                      setCambioRolUser(usuario);
                                      setShowCambioRolModal(true);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Solicitar cambio de rol
                                  </button>
                                  {usuario.estadoCuenta === 'activo' && !isCurrentUser && (
                                    <button
                                      className="menu-option danger"
                                      onClick={() => handleInactivateClick(usuario)}
                                    >
                                      Solicitar inactivación
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="member-details">
                            <p className="member-info">
                              <span className="info-label">Email:</span> {usuario.correoElectronico}
                            </p>
                            <p className="member-info">
                              <span className="info-label">Teléfono:</span> {usuario.telefono || 'No especificado'}
                            </p>
                            <p className="member-info">
                              <span className="info-label">Rol:</span> {usuario.rol.nombreRol}
                            </p>
                            <p className="member-info">
                              <span className="info-label">Estado:</span>{' '}
                              <span className={`account-status ${usuario.estadoCuenta}`}>
                                {getAccountStatusText(usuario.estadoCuenta)}
                              </span>
                            </p>
                            <p className="member-info">
                              <span className="info-label">Registrado:</span> {formatDate(usuario.fechaRegistro)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {editModalOpen && selectedUser && (
        <EditUserModal
          isOpen={editModalOpen}
          usuario={selectedUser}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      )}

      {showInactivateModal && inactivateUser && (
        <div className="modal-overlay" onClick={() => setShowInactivateModal(false)}>
          <div className="modal-content inactivate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Solicitar Inactivación de Cuenta</h2>
              <button className="close-button" onClick={() => setShowInactivateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="warning-box">
                <p>⚠️ Esta acción creará una solicitud de inactivación que debe ser aprobada por otro administrador.</p>
              </div>
              
              <div className="user-info-box">
                <h3>Usuario a inactivar:</h3>
                <p><strong>Nombre:</strong> {inactivateUser.nombreCompleto}</p>
                <p><strong>Email:</strong> {inactivateUser.correoElectronico}</p>
                <p><strong>Casa:</strong> {houseId}</p>
              </div>

              <div className="form-group">
                <label htmlFor="inactivate-motivo">
                  Justificación de la inactivación <span className="required">*</span>
                </label>
                <textarea
                  id="inactivate-motivo"
                  value={inactivateMotivo}
                  onChange={(e) => setInactivateMotivo(e.target.value)}
                  placeholder="Explica el motivo de la inactivación (10-500 caracteres)"
                  rows={4}
                  disabled={inactivateLoading}
                  required
                />
                <small>
                  {inactivateMotivo.length}/500 caracteres (mínimo 10)
                </small>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowInactivateModal(false)}
                  disabled={inactivateLoading}
                >
                  Cancelar
                </button>
                <button
                  className="btn-submit danger"
                  onClick={handleInactivateSubmit}
                  disabled={inactivateLoading || inactivateMotivo.length < 10}
                >
                  {inactivateLoading ? 'Enviando...' : 'Crear Solicitud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCambioRolModal && cambioRolUser && (
        <SolicitarCambioRolModal
          isOpen={showCambioRolModal}
          usuario={cambioRolUser}
          onClose={() => setShowCambioRolModal(false)}
          onSuccess={() => {
            fetchHouseUsers();
            setShowCambioRolModal(false);
          }}
        />
      )}
    </div>
  );
};

export default HouseUsersModal;
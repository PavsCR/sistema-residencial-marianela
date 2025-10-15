import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../services/api';
import './HouseUsersModal.css';
import EditUserModal from './EditUserModal.tsx';

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
    </div>
  );
};

export default HouseUsersModal;
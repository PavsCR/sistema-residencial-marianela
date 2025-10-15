import { useState, useEffect } from 'react';
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
  const [houseData, setHouseData] = useState<HouseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    if (isOpen && houseId) {
      fetchHouseUsers();
    }
  }, [isOpen, houseId]);

  const fetchHouseUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/casas/${houseId}/usuarios`);
      const data = await response.json();
      
      if (data.success) {
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
                    {houseData.usuarios.map(usuario => (
                      <div key={usuario.idUsuario} className="user-card">
                        <div className="user-header">
                          <h4>{usuario.nombreCompleto}</h4>
                          <span className={`account-status ${usuario.estadoCuenta}`}>
                            {getAccountStatusText(usuario.estadoCuenta)}
                          </span>
                        </div>
                        
                        <div className="user-details">
                          <p><strong>Email:</strong> {usuario.correoElectronico}</p>
                          {usuario.telefono && <p><strong>Teléfono:</strong> {usuario.telefono}</p>}
                          <p><strong>Rol:</strong> {usuario.rol.nombreRol}</p>
                          <p><strong>Registrado:</strong> {formatDate(usuario.fechaRegistro)}</p>
                        </div>
                        
                        <div className="user-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditUser(usuario)}
                            title="Solicitar cambios en la información"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    ))}
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
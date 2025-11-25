import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Categorias.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

const Categorias = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/categorias-financieras`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar las categorías');
      }

      setCategorias(result.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingCategoria
        ? `${API_URL}/api/categorias-financieras/${editingCategoria.idCategoria}`
        : `${API_URL}/api/categorias-financieras`;

      const method = editingCategoria ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar la categoría');
      }

      alert(editingCategoria ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
      closeModal();
      fetchCategorias();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/categorias-financieras/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar la categoría');
      }

      alert('Categoría eliminada exitosamente');
      fetchCategorias();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la categoría');
    }
  };

  const openModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || ''
      });
    } else {
      setEditingCategoria(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategoria(null);
  };

  if (loading) {
    return (
      <div className="categorias-container">
        <h1>Gestión de Categorías</h1>
        <div className="loading-container">
          <p>Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="categorias-container">
        <h1>Gestión de Categorías</h1>
        <div className="error-message">{error}</div>
        <button onClick={fetchCategorias} className="btn-retry">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <h1>Gestión de Categorías Financieras</h1>
        <button onClick={() => navigate('/finanzas')} className="btn-back">
          Volver a Finanzas
        </button>
      </div>

      <div className="categorias-actions">
        <button onClick={() => openModal()} className="btn-add-categoria">
          + Nueva Categoría
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon"></div>
          <h3>No hay categorías creadas</h3>
          <p>Crea tu primera categoría para organizar los movimientos financieros</p>
        </div>
      ) : (
        <div className="categorias-grid">
          {categorias.map((cat) => (
            <div key={cat.idCategoria} className="categoria-card">
              <div className="categoria-header">
                <h3>{cat.nombre}</h3>
              </div>
              <div className="categoria-body">
                <p>{cat.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="categoria-footer">
                <button
                  onClick={() => openModal(cat)}
                  className="btn-card-action btn-edit"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.idCategoria)}
                  className="btn-card-action btn-delete"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Mantenimiento, Servicios, etc."
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Descripción (Opcional)</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Describe brevemente esta categoría"
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-submit">
                  {editingCategoria ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={closeModal} className="btn-cancel">
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

export default Categorias;

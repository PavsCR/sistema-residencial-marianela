import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Finanzas.css';

interface Categoria {
  idCategoria: number;
  nombre: string;
}

interface Movimiento {
  idMovimiento: number;
  tipo: string;
  detalles: string;
  monto: string;
  fecha: string;
  categoria: Categoria;
  pago: any;
}

interface Resumen {
  ingresos: number;
  gastos: number;
  presupuestoTotal: number;
  totalMovimientos: number;
}

const Finanzas = () => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState<Movimiento | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchDetalles, setSearchDetalles] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    tipo: 'gasto',
    idCategoria: '',
    detalles: '',
    monto: '',
    fecha: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      const [movimientosRes, categoriasRes, resumenRes] = await Promise.all([
        fetch('http://localhost:3001/api/movimientos-financieros', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/categorias-financieras', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/movimientos-financieros/resumen', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [movimientosData, categoriasData, resumenData] = await Promise.all([
        movimientosRes.json(),
        categoriasRes.json(),
        resumenRes.json()
      ]);

      if (!movimientosRes.ok || !categoriasRes.ok || !resumenRes.ok) {
        throw new Error('Error al cargar los datos');
      }

      setMovimientos(movimientosData.data);
      setCategorias(categoriasData.data);
      setResumen(resumenData.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingMovimiento
        ? `http://localhost:3001/api/movimientos-financieros/${editingMovimiento.idMovimiento}`
        : 'http://localhost:3001/api/movimientos-financieros';

      const method = editingMovimiento ? 'PUT' : 'POST';

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
        throw new Error(result.message || 'Error al guardar el movimiento');
      }

      alert(editingMovimiento ? 'Movimiento actualizado exitosamente' : 'Movimiento creado exitosamente');
      closeModal();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el movimiento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este movimiento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3001/api/movimientos-financieros/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar el movimiento');
      }

      alert('Movimiento eliminado exitosamente');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el movimiento');
    }
  };

  const openModal = (movimiento?: Movimiento) => {
    if (movimiento) {
      setEditingMovimiento(movimiento);
      setFormData({
        tipo: movimiento.tipo,
        idCategoria: movimiento.categoria.idCategoria.toString(),
        detalles: movimiento.detalles,
        monto: movimiento.monto,
        fecha: new Date(movimiento.fecha).toISOString().slice(0, 16)
      });
    } else {
      setEditingMovimiento(null);
      setFormData({
        tipo: 'gasto',
        idCategoria: '',
        detalles: '',
        monto: '',
        fecha: new Date().toISOString().slice(0, 16)
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMovimiento(null);
  };

  const filterMovimientos = () => {
    return movimientos.filter(mov => {
      // Filter by date range
      if (dateFrom) {
        const movDate = new Date(mov.fecha);
        const fromDate = new Date(dateFrom);
        if (movDate < fromDate) return false;
      }

      if (dateTo) {
        const movDate = new Date(mov.fecha);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (movDate > toDate) return false;
      }

      // Filter by detalles (search)
      if (searchDetalles && !mov.detalles.toLowerCase().includes(searchDetalles.toLowerCase())) {
        return false;
      }

      // Filter by amount range
      const movAmount = parseFloat(mov.monto);
      if (amountFrom && movAmount < parseFloat(amountFrom)) {
        return false;
      }
      if (amountTo && movAmount > parseFloat(amountTo)) {
        return false;
      }

      // Filter by categoria
      if (filterCategoria && mov.categoria.idCategoria.toString() !== filterCategoria) {
        return false;
      }

      // Filter by tipo
      if (filterTipo && mov.tipo !== filterTipo) {
        return false;
      }

      return true;
    });
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSearchDetalles('');
    setAmountFrom('');
    setAmountTo('');
    setFilterCategoria('');
    setFilterTipo('');
  };

  const hasActiveFilters = dateFrom || dateTo || searchDetalles || amountFrom || amountTo || filterCategoria || filterTipo;
  const filteredMovimientos = filterMovimientos();

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="finanzas-container">
        <h1>Finanzas</h1>
        <div className="loading-container">
          <p>Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="finanzas-container">
        <h1>Finanzas</h1>
        <div className="error-message">{error}</div>
        <button onClick={fetchData} className="btn-retry">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="finanzas-container">
      <h1>Finanzas del Residencial</h1>

      {/* Presupuesto Total */}
      {resumen && (
        <div className="presupuesto-total">
          <div className="presupuesto-label">Presupuesto Total</div>
          <div className={`presupuesto-value ${resumen.presupuestoTotal < 0 ? 'negative' : ''}`}>
            {formatCurrency(resumen.presupuestoTotal)}
          </div>
          <div className="presupuesto-details">
            <span className="ingreso">Ingresos: {formatCurrency(resumen.ingresos)}</span>
            <span className="gasto">Gastos: {formatCurrency(resumen.gastos)}</span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="finance-nav">
        <button onClick={() => navigate('/finanzas/comprobantes')} className="btn-nav">
          Ver Comprobantes
        </button>
        <button onClick={() => navigate('/finanzas/categorias')} className="btn-nav">
          Gestionar Categorías
        </button>
        <button onClick={() => openModal()} className="btn-add">
          + Nuevo Movimiento
        </button>
      </div>

      {/* Filter Section */}
      <div className="filters-section">
        <button
          className="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        {showFilters && (
          <div className="filters-container">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="filterTipo">Tipo</label>
                <select
                  id="filterTipo"
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filterCategoria">Categoría</label>
                <select
                  id="filterCategoria"
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat.idCategoria} value={cat.idCategoria}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="searchDetalles">Buscar en Detalles</label>
                <input
                  type="text"
                  id="searchDetalles"
                  placeholder="Buscar..."
                  value={searchDetalles}
                  onChange={(e) => setSearchDetalles(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="dateFrom">Fecha Desde</label>
                <input
                  type="date"
                  id="dateFrom"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="dateTo">Fecha Hasta</label>
                <input
                  type="date"
                  id="dateTo"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="amountFrom">Monto Desde (₡)</label>
                <input
                  type="number"
                  id="amountFrom"
                  placeholder="0"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  min="0"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="amountTo">Monto Hasta (₡)</label>
                <input
                  type="number"
                  id="amountTo"
                  placeholder="100000"
                  value={amountTo}
                  onChange={(e) => setAmountTo(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Limpiar Filtros
              </button>
            )}
          </div>
        )}

        {hasActiveFilters && (
          <div className="active-filters-summary">
            Mostrando {filteredMovimientos.length} de {movimientos.length} movimientos
          </div>
        )}
      </div>

      {/* Tabla de Movimientos */}
      {filteredMovimientos.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon"></div>
          <h3>No hay movimientos financieros</h3>
          <p>Crea tu primer movimiento o aprueba pagos de residentes</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="movimientos-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Detalles</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovimientos.map((mov) => (
                <tr key={mov.idMovimiento}>
                  <td>
                    <span className={`tipo-badge tipo-${mov.tipo}`}>
                      {mov.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td>{mov.categoria.nombre}</td>
                  <td className="detalles-cell">{mov.detalles}</td>
                  <td className="fecha-cell">{formatDate(mov.fecha)}</td>
                  <td className={`monto-cell ${mov.tipo}`}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.monto)}
                  </td>
                  <td className="acciones-cell">
                    {!mov.pago && (
                      <>
                        <button
                          onClick={() => openModal(mov)}
                          className="btn-action btn-edit"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(mov.idMovimiento)}
                          className="btn-action btn-delete"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                    {mov.pago && (
                      <span className="auto-tag">Automático</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMovimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={formData.idCategoria}
                  onChange={(e) => setFormData({ ...formData, idCategoria: e.target.value })}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.idCategoria} value={cat.idCategoria}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Detalles</label>
                <textarea
                  value={formData.detalles}
                  onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                  required
                  rows={3}
                  placeholder="Descripción del movimiento"
                />
              </div>

              <div className="form-group">
                <label>Monto (₡)</label>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Fecha y Hora</label>
                <input
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-submit">
                  {editingMovimiento ? 'Actualizar' : 'Crear'}
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

export default Finanzas;

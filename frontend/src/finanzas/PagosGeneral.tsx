import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PagosGeneral.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Casa {
  idCasa: number;
  numeroCasa: string;
  estadoPago: string;
  _count?: {
    usuarios: number;
  };
  ultimoPago?: {
    monto: string;
    fecha: string;
  };
  totalPagado?: number;
  montoAdeudado?: number;
}

const PagosGeneral = () => {
  const navigate = useNavigate();
  const [casas, setCasas] = useState<Casa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    fetchCasas();
  }, []);

  const fetchCasas = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/pagos/casas-resumen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar las casas');
      }

      setCasas(result.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar las casas');
    } finally {
      setLoading(false);
    }
  };

  const handleCasaClick = (numeroCasa: string) => {
    navigate(`/finanzas/pagos/${numeroCasa}`);
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'al_dia': 'Al Día',
      'moroso': 'Moroso',
      'en_arreglo': 'Arreglo de Pago'
    };
    return labels[estado] || estado;
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
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const filteredCasas = casas.filter(casa => {
    const matchesSearch = casa.numeroCasa.includes(searchTerm);
    const matchesEstado = !filterEstado || casa.estadoPago === filterEstado;
    return matchesSearch && matchesEstado;
  });

  if (loading) {
    return (
      <div className="pagos-general-container">
        <h1>Estado de Pagos - Todas las Casas</h1>
        <div className="loading-container">
          <p>Cargando información de pagos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagos-general-container">
        <h1>Estado de Pagos - Todas las Casas</h1>
        <div className="error-message">{error}</div>
        <button onClick={fetchCasas} className="btn-retry">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="pagos-general-container">
      <div className="page-header">
        <h1>Estado de Pagos - Todas las Casas</h1>
        <button onClick={() => navigate('/finanzas')} className="btn-back">
          ← Volver a Finanzas
        </button>
      </div>

      {/* Resumen */}
      <div className="resumen-cards">
        <div className="resumen-card">
          <div className="resumen-label">Total Casas</div>
          <div className="resumen-value">{casas.length}</div>
        </div>
        <div className="resumen-card success">
          <div className="resumen-label">Al Día</div>
          <div className="resumen-value">
            {casas.filter(c => c.estadoPago === 'al_dia').length}
          </div>
        </div>
        <div className="resumen-card warning">
          <div className="resumen-label">Arreglo de Pago</div>
          <div className="resumen-value">
            {casas.filter(c => c.estadoPago === 'en_arreglo').length}
          </div>
        </div>
        <div className="resumen-card danger">
          <div className="resumen-label">Morosos</div>
          <div className="resumen-value">
            {casas.filter(c => c.estadoPago === 'moroso').length}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Buscar por número de casa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          <option value="al_dia">Al Día</option>
          <option value="en_arreglo">Arreglo de Pago</option>
          <option value="moroso">Moroso</option>
        </select>
        {(searchTerm || filterEstado) && (
          <button
            onClick={() => { setSearchTerm(''); setFilterEstado(''); }}
            className="btn-clear-filters"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Lista de casas */}
      {filteredCasas.length === 0 ? (
        <div className="no-data">
          <h3>No se encontraron casas</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="casas-grid">
          {filteredCasas.map((casa) => (
            <div
              key={casa.idCasa}
              className={`casa-card estado-${casa.estadoPago}`}
              onClick={() => handleCasaClick(casa.numeroCasa)}
            >
              <div className="casa-card-header">
                <h3>Casa {casa.numeroCasa}</h3>
                <span className={`estado-badge ${casa.estadoPago}`}>
                  {getEstadoLabel(casa.estadoPago)}
                </span>
              </div>

              <div className="casa-card-body">
                <div className="casa-info-row">
                  <span className="info-label">Vecinos registrados:</span>
                  <span className="info-value">{casa._count?.usuarios || 0}</span>
                </div>

                {casa.ultimoPago && (
                  <>
                    <div className="casa-info-row">
                      <span className="info-label">Último pago:</span>
                      <span className="info-value">
                        {formatCurrency(casa.ultimoPago.monto)}
                      </span>
                    </div>
                    <div className="casa-info-row">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">
                        {formatDate(casa.ultimoPago.fecha)}
                      </span>
                    </div>
                  </>
                )}

                {!casa.ultimoPago && (
                  <div className="no-payments-yet">
                    Sin pagos registrados
                  </div>
                )}

                {casa.montoAdeudado !== undefined && casa.montoAdeudado > 0 && (
                  <div className="monto-adeudado">
                    Adeuda: {formatCurrency(casa.montoAdeudado)}
                  </div>
                )}
              </div>

              <div className="casa-card-footer">
                <button className="btn-ver-detalles">
                  Ver Detalles →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PagosGeneral;

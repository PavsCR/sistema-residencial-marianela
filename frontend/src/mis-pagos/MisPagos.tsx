import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MisPagos.css';

interface Pago {
  idPago: number;
  monto: string;
  descripcion: string;
  fechaPago: string;
  estado: string;
}

interface CasaInfo {
  numeroCasa: string;
  estadoPago: string;
}

interface PagosData {
  casa: CasaInfo;
  pagos: Pago[];
  mesActual?: {
    cuotaMensual: number;
    totalPagado: number;
    montoAdeudado: number;
    mes: string;
  };
}

const MisPagos = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PagosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual token from localStorage after implementing login
      const response = await fetch('http://localhost:3001/api/pagos/mi-casa');

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar los pagos');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Error al cargar pagos:', err);
      setError(err.message || 'Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(parseFloat(amount));
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

  const getEstadoPagoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'al_dia': 'Al Día',
      'moroso': 'Moroso',
      'en_arreglo': 'En Arreglo de Pago'
    };
    return labels[estado] || estado;
  };

  const getEstadoPagoIndividualLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado'
    };
    return labels[estado] || estado;
  };

  const filterPagos = () => {
    if (!data) return [];

    return data.pagos.filter(pago => {
      // Filter by date range
      if (dateFrom) {
        const pagoDate = new Date(pago.fechaPago);
        const fromDate = new Date(dateFrom);
        if (pagoDate < fromDate) return false;
      }

      if (dateTo) {
        const pagoDate = new Date(pago.fechaPago);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire day
        if (pagoDate > toDate) return false;
      }

      // Filter by amount range
      const pagoAmount = parseFloat(pago.monto);
      
      if (amountFrom && pagoAmount < parseFloat(amountFrom)) {
        return false;
      }

      if (amountTo && pagoAmount > parseFloat(amountTo)) {
        return false;
      }

      return true;
    });
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setAmountFrom('');
    setAmountTo('');
  };

  const hasActiveFilters = dateFrom || dateTo || amountFrom || amountTo;
  const filteredPagos = filterPagos();

  if (loading) {
    return (
      <div className="page-container">
        <h1>Mis Pagos</h1>
        <div className="loading-container">
          <p>Cargando historial de pagos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h1>Mis Pagos</h1>
        <div className="error-message">
          {error}
        </div>
        <button onClick={fetchPagos} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <h1>Mis Pagos</h1>
        <div className="error-message">
          No se pudo cargar la información
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Mis Pagos</h1>

      <div className="casa-info">
        <div className="casa-info-content">
          <div>
            <h2>Casa {data.casa.numeroCasa}</h2>
            <span className={`estado-badge ${data.casa.estadoPago}`}>
              {getEstadoPagoLabel(data.casa.estadoPago)}
            </span>
          </div>
          <button 
            className="btn-confirmar-pago"
            onClick={() => navigate('/confirmar-pago')}
          >
            + Confirmar Pago
          </button>
        </div>
      </div>

      {/* Monthly Payment Info */}
      {data.mesActual && (
        <div className="monthly-payment-info">
          <h3>Estado de Pago - {data.mesActual.mes}</h3>
          <div className="monthly-stats">
            <div className="stat-item">
              <span className="stat-label">Cuota Mensual</span>
              <span className="stat-value">{formatCurrency(data.mesActual.cuotaMensual.toString())}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Pagado</span>
              <span className="stat-value success">{formatCurrency(data.mesActual.totalPagado.toString())}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Monto Pendiente</span>
              <span className={`stat-value ${data.mesActual.montoAdeudado > 0 ? 'warning' : 'success'}`}>
                {formatCurrency(data.mesActual.montoAdeudado.toString())}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filters-section">
        <button 
          className="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        {showFilters && (
          <div className="filters-container">
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
            </div>

            <div className="filter-row">
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
                ✖ Limpiar Filtros
              </button>
            )}
          </div>
        )}

        {hasActiveFilters && (
          <div className="active-filters-summary">
            Mostrando {filteredPagos.length} de {data.pagos.length} pagos
          </div>
        )}
      </div>

      {filteredPagos.length === 0 ? (
        <div className="no-payments">
          <div className="no-payments-icon">📭</div>
          <h3>No hay pagos {hasActiveFilters ? 'que coincidan con los filtros' : 'registrados'}</h3>
          <p>
            {hasActiveFilters 
              ? 'Intenta ajustar los filtros para ver más resultados'
              : 'Aún no se han registrado pagos para esta casa'
            }
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-retry">
              Limpiar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="payments-list">
          {filteredPagos.map((pago) => (
            <div key={pago.idPago} className="payment-card">
              <div className="payment-header">
                <div className="payment-amount">
                  {formatCurrency(pago.monto)}
                </div>
                <span className={`payment-estado-badge estado-${pago.estado}`}>
                  {getEstadoPagoIndividualLabel(pago.estado)}
                </span>
              </div>

              <div className="payment-body">
                <div className="payment-description">
                  {pago.descripcion}
                </div>
                <div className="payment-date">
                  {formatDate(pago.fechaPago)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisPagos;
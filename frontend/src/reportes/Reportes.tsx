import { useState, useEffect } from 'react';
import './Reportes.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type TipoReporte = 'pagos' | 'movimientos' | 'usuarios' | 'casas';

interface Filtros {
  fechaInicio?: string;
  fechaFin?: string;
  numeroCasa?: string;
  estado?: string;
  metodoPago?: string;
  tipo?: string;
  idCategoria?: string;
  estadoCuenta?: string;
  idRol?: string;
  estadoPago?: string;
}

interface Categoria {
  idCategoria: number;
  nombre: string;
}

const Reportes = () => {
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('pagos');
  const [filtros, setFiltros] = useState<Filtros>({});
  const [datos, setDatos] = useState<any>(null);
  const [totales, setTotales] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Cargar categorías al montar
  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/reportes/categorias', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCategorias(result.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const generarReporte = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `http://localhost:3002/api/reportes/${tipoReporte}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setDatos(result.data[tipoReporte] || result.data[Object.keys(result.data)[0]]);
        setTotales(result.data.totales);
      } else {
        alert('Error al generar reporte');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setDatos(null);
    setTotales(null);
  };

  const cambiarTipoReporte = (tipo: TipoReporte) => {
    setTipoReporte(tipo);
    limpiarFiltros();
  };

  const descargarExcel = () => {
    if (!datos || datos.length === 0) {
      alert('No hay datos para descargar');
      return;
    }

    // Preparar datos para CSV
    let csvContent = '';
    const headers = Object.keys(datos[0]);
    csvContent += headers.join(',') + '\n';

    datos.forEach((row: any) => {
      const values = headers.map(header => {
        const value = obtenerValorAnidado(row, header);
        return `"${value}"`;
      });
      csvContent += values.join(',') + '\n';
    });

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const descargarPDF = () => {
    if (!datos || datos.length === 0) {
      alert('No hay datos para descargar');
      return;
    }

    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString('es-CR');
      
      console.log('Generando PDF...');
      
      // Configurar título
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234); // Color morado corporativo
      doc.text(`Reporte de ${tipoReporte.charAt(0).toUpperCase() + tipoReporte.slice(1)}`, 14, 20);
      
      // Fecha del reporte
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${fecha}`, 14, 28);
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 32, 196, 32);

      // Preparar datos según el tipo de reporte
      let headers: string[] = [];
      let rows: any[][] = [];

      switch (tipoReporte) {
        case 'pagos':
          headers = ['Casa', 'Monto', 'Descripción', 'Fecha', 'Método', 'Estado'];
          rows = datos.map((pago: any) => [
            pago.casa?.numeroCasa || 'N/A',
            formatearMonedaPDF(Number(pago.monto)),
            pago.descripcion,
            formatearFecha(pago.fechaPago),
            pago.metodoPago || 'N/A',
            pago.estado
          ]);
          break;

        case 'movimientos':
          headers = ['Tipo', 'Categoría', 'Detalles', 'Monto', 'Fecha'];
          rows = datos.map((mov: any) => [
            mov.tipo,
            mov.categoria?.nombre || 'N/A',
            mov.detalles,
            formatearMonedaPDF(Number(mov.monto)),
            formatearFecha(mov.fecha)
          ]);
          break;

        case 'usuarios':
          headers = ['Nombre', 'Correo', 'Casa', 'Rol', 'Estado', 'Fecha Registro'];
          rows = datos.map((usuario: any) => [
            usuario.nombreCompleto,
            usuario.correoElectronico,
            usuario.casa?.numeroCasa || 'N/A',
            usuario.rol?.nombreRol || 'N/A',
            usuario.estadoCuenta,
            formatearFecha(usuario.fechaRegistro)
          ]);
          break;

        case 'casas':
          headers = ['Número Casa', 'Estado Pago', 'Usuarios', 'Últimos Pagos'];
          rows = datos.map((casa: any) => [
            casa.numeroCasa,
            casa.estadoPago.replace('_', ' '),
            casa.usuarios?.length || 0,
            `${casa.pagos?.length || 0} pagos`
          ]);
          break;
      }

      console.log('Headers:', headers);
      console.log('Rows:', rows.length);

      // Agregar tabla usando autoTable
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 36,
        theme: 'grid',
        headStyles: {
          fillColor: [102, 126, 234], // Color morado corporativo
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { top: 36, left: 14, right: 14 }
      });

      // Agregar totales después de la tabla
      const finalY = (doc as any).lastAutoTable.finalY || 100;
        
        if (totales) {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text('Resumen:', 14, finalY + 10);
          doc.setFontSize(10);

          switch (tipoReporte) {
            case 'pagos':
              doc.text(`Total de pagos: ${totales.totalPagos}`, 14, finalY + 18);
              doc.text(`Monto total: ${formatearMonedaPDF(totales.montoTotal)}`, 14, finalY + 24);
              doc.text(`Aprobados: ${totales.pagosAprobados}`, 14, finalY + 30);
              doc.text(`Pendientes: ${totales.pagosPendientes}`, 14, finalY + 36);
              break;

            case 'movimientos':
              doc.setTextColor(16, 185, 129);
              doc.text(`Total Ingresos: ${formatearMonedaPDF(totales.totalIngresos)}`, 14, finalY + 18);
              doc.setTextColor(239, 68, 68);
              doc.text(`Total Gastos: ${formatearMonedaPDF(totales.totalGastos)}`, 14, finalY + 24);
              doc.setTextColor(59, 130, 246);
              doc.text(`Balance: ${formatearMonedaPDF(totales.balance)}`, 14, finalY + 30);
              break;

            case 'usuarios':
              doc.text(`Total de usuarios: ${totales.totalUsuarios}`, 14, finalY + 18);
              doc.text(`Activos: ${totales.usuariosActivos}`, 14, finalY + 24);
              doc.text(`Pendientes: ${totales.usuariosPendientes}`, 14, finalY + 30);
              doc.text(`Suspendidos: ${totales.usuariosSuspendidos}`, 14, finalY + 36);
              break;

            case 'casas':
              doc.text(`Total de casas: ${totales.totalCasas}`, 14, finalY + 18);
              doc.text(`Al día: ${totales.casasAlDia}`, 14, finalY + 24);
              doc.text(`Morosas: ${totales.casasMorosas}`, 14, finalY + 30);
              doc.text(`Con usuarios: ${totales.casasConUsuarios}`, 14, finalY + 36);
              break;
          }
        }

        // Agregar pie de página
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            `Sistema Residencial Marianela - Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

      // Descargar archivo
      const nombreArchivo = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Descargando:', nombreArchivo);
      doc.save(nombreArchivo);
      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente o usa la descarga en Excel.');
    }
  };

  const obtenerValorAnidado = (obj: any, path: string): any => {
    const value = obj[path];
    if (value && typeof value === 'object') {
      if ('numeroCasa' in value) return value.numeroCasa;
      if ('nombreCompleto' in value) return value.nombreCompleto;
      if ('nombreRol' in value) return value.nombreRol;
      if ('nombre' in value) return value.nombre;
      return JSON.stringify(value);
    }
    return value ?? '';
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(monto);
  };

  // Función para formatear moneda en PDF (sin símbolo especial)
  const formatearMonedaPDF = (monto: number) => {
    return 'CRC ' + new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderFiltros = () => {
    switch (tipoReporte) {
      case 'pagos':
        return (
          <>
            <div className="filtro-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio || ''}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            <div className="filtro-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin || ''}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>
            <div className="filtro-group">
              <label>Número de Casa</label>
              <input
                type="text"
                placeholder="Ej: A-1"
                value={filtros.numeroCasa || ''}
                onChange={(e) => setFiltros({ ...filtros, numeroCasa: e.target.value })}
              />
            </div>
            <div className="filtro-group">
              <label>Estado</label>
              <select
                value={filtros.estado || ''}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div className="filtro-group">
              <label>Método de Pago</label>
              <select
                value={filtros.metodoPago || ''}
                onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
          </>
        );

      case 'movimientos':
        return (
          <>
            <div className="filtro-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio || ''}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            <div className="filtro-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin || ''}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>
            <div className="filtro-group">
              <label>Tipo</label>
              <select
                value={filtros.tipo || ''}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>
            <div className="filtro-group">
              <label>Categoría</label>
              <select
                value={filtros.idCategoria || ''}
                onChange={(e) => setFiltros({ ...filtros, idCategoria: e.target.value })}
              >
                <option value="">Todas</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case 'usuarios':
        return (
          <>
            <div className="filtro-group">
              <label>Estado de Cuenta</label>
              <select
                value={filtros.estadoCuenta || ''}
                onChange={(e) => setFiltros({ ...filtros, estadoCuenta: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
            <div className="filtro-group">
              <label>Rol</label>
              <select
                value={filtros.idRol || ''}
                onChange={(e) => setFiltros({ ...filtros, idRol: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="1">Vecino</option>
                <option value="2">Administrador</option>
                <option value="3">Super Admin</option>
              </select>
            </div>
            <div className="filtro-group">
              <label>Número de Casa</label>
              <input
                type="text"
                placeholder="Ej: A-1"
                value={filtros.numeroCasa || ''}
                onChange={(e) => setFiltros({ ...filtros, numeroCasa: e.target.value })}
              />
            </div>
          </>
        );

      case 'casas':
        return (
          <>
            <div className="filtro-group">
              <label>Estado de Pago</label>
              <select
                value={filtros.estadoPago || ''}
                onChange={(e) => setFiltros({ ...filtros, estadoPago: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="al_dia">Al día</option>
                <option value="moroso">Moroso</option>
                <option value="en_arreglo">En arreglo</option>
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderTotales = () => {
    if (!totales) return null;

    switch (tipoReporte) {
      case 'pagos':
        return (
          <div className="totales-grid">
            <div className="total-card">
              <div className="total-card-label">Total de Pagos</div>
              <div className="total-card-value">{totales.totalPagos}</div>
            </div>
            <div className="total-card ingreso">
              <div className="total-card-label">Monto Total</div>
              <div className="total-card-value positive">
                {formatearMoneda(totales.montoTotal)}
              </div>
            </div>
            <div className="total-card">
              <div className="total-card-label">Aprobados</div>
              <div className="total-card-value">{totales.pagosAprobados}</div>
            </div>
            <div className="total-card">
              <div className="total-card-label">Pendientes</div>
              <div className="total-card-value">{totales.pagosPendientes}</div>
            </div>
          </div>
        );

      case 'movimientos':
        return (
          <div className="totales-grid">
            <div className="total-card ingreso">
              <div className="total-card-label">Total Ingresos</div>
              <div className="total-card-value positive">
                {formatearMoneda(totales.totalIngresos)}
              </div>
            </div>
            <div className="total-card gasto">
              <div className="total-card-label">Total Gastos</div>
              <div className="total-card-value negative">
                {formatearMoneda(totales.totalGastos)}
              </div>
            </div>
            <div className="total-card balance">
              <div className="total-card-label">Balance</div>
              <div className={`total-card-value ${totales.balance >= 0 ? 'positive' : 'negative'}`}>
                {formatearMoneda(totales.balance)}
              </div>
            </div>
          </div>
        );

      case 'usuarios':
        return (
          <div className="totales-grid">
            <div className="total-card">
              <div className="total-card-label">Total Usuarios</div>
              <div className="total-card-value">{totales.totalUsuarios}</div>
            </div>
            <div className="total-card ingreso">
              <div className="total-card-label">Activos</div>
              <div className="total-card-value">{totales.usuariosActivos}</div>
            </div>
            <div className="total-card">
              <div className="total-card-label">Pendientes</div>
              <div className="total-card-value">{totales.usuariosPendientes}</div>
            </div>
            <div className="total-card gasto">
              <div className="total-card-label">Suspendidos</div>
              <div className="total-card-value">{totales.usuariosSuspendidos}</div>
            </div>
          </div>
        );

      case 'casas':
        return (
          <div className="totales-grid">
            <div className="total-card">
              <div className="total-card-label">Total Casas</div>
              <div className="total-card-value">{totales.totalCasas}</div>
            </div>
            <div className="total-card ingreso">
              <div className="total-card-label">Al Día</div>
              <div className="total-card-value">{totales.casasAlDia}</div>
            </div>
            <div className="total-card gasto">
              <div className="total-card-label">Morosas</div>
              <div className="total-card-value">{totales.casasMorosas}</div>
            </div>
            <div className="total-card">
              <div className="total-card-label">Con Usuarios</div>
              <div className="total-card-value">{totales.casasConUsuarios}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTabla = () => {
    if (!datos || datos.length === 0) {
      return <div className="empty-state">No hay datos para mostrar</div>;
    }

    switch (tipoReporte) {
      case 'pagos':
        return (
          <table className="tabla-reporte">
            <thead>
              <tr>
                <th>Casa</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((pago: any) => (
                <tr key={pago.idPago}>
                  <td>{pago.casa?.numeroCasa || 'N/A'}</td>
                  <td>{formatearMoneda(Number(pago.monto))}</td>
                  <td>{pago.descripcion}</td>
                  <td>{formatearFecha(pago.fechaPago)}</td>
                  <td>{pago.metodoPago || 'N/A'}</td>
                  <td>
                    <span className={`estado-badge ${pago.estado}`}>
                      {pago.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'movimientos':
        return (
          <table className="tabla-reporte">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Detalles</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((mov: any) => (
                <tr key={mov.idMovimiento}>
                  <td>
                    <span className={`estado-badge ${mov.tipo === 'ingreso' ? 'aprobado' : 'rechazado'}`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td>{mov.categoria?.nombre || 'N/A'}</td>
                  <td>{mov.detalles}</td>
                  <td className={mov.tipo === 'ingreso' ? 'positive' : 'negative'}>
                    {formatearMoneda(Number(mov.monto))}
                  </td>
                  <td>{formatearFecha(mov.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'usuarios':
        return (
          <table className="tabla-reporte">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Casa</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((usuario: any) => (
                <tr key={usuario.idUsuario}>
                  <td>{usuario.nombreCompleto}</td>
                  <td>{usuario.correoElectronico}</td>
                  <td>{usuario.casa?.numeroCasa || 'N/A'}</td>
                  <td>{usuario.rol?.nombreRol || 'N/A'}</td>
                  <td>
                    <span className={`estado-badge ${usuario.estadoCuenta}`}>
                      {usuario.estadoCuenta}
                    </span>
                  </td>
                  <td>{formatearFecha(usuario.fechaRegistro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'casas':
        return (
          <table className="tabla-reporte">
            <thead>
              <tr>
                <th>Número Casa</th>
                <th>Estado Pago</th>
                <th>Usuarios</th>
                <th>Últimos Pagos</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((casa: any) => (
                <tr key={casa.idCasa}>
                  <td><strong>{casa.numeroCasa}</strong></td>
                  <td>
                    <span className={`estado-badge ${casa.estadoPago}`}>
                      {casa.estadoPago.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{casa.usuarios?.length || 0}</td>
                  <td>{casa.pagos?.length || 0} pagos</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h1>📊 Reportes Personalizados</h1>
        <p>Genera reportes con filtros y descárgalos en Excel o PDF</p>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="tipo-reporte-selector">
        <button
          className={`tipo-reporte-btn ${tipoReporte === 'pagos' ? 'active' : ''}`}
          onClick={() => cambiarTipoReporte('pagos')}
        >
          💰 Pagos
        </button>
        <button
          className={`tipo-reporte-btn ${tipoReporte === 'movimientos' ? 'active' : ''}`}
          onClick={() => cambiarTipoReporte('movimientos')}
        >
          💸 Movimientos Financieros
        </button>
        <button
          className={`tipo-reporte-btn ${tipoReporte === 'usuarios' ? 'active' : ''}`}
          onClick={() => cambiarTipoReporte('usuarios')}
        >
          👥 Usuarios
        </button>
        <button
          className={`tipo-reporte-btn ${tipoReporte === 'casas' ? 'active' : ''}`}
          onClick={() => cambiarTipoReporte('casas')}
        >
          🏠 Casas
        </button>
      </div>

      {/* Panel de filtros */}
      <div className="filtros-panel">
        <h3>🔍 Filtros de Búsqueda</h3>
        <div className="filtros-grid">
          {renderFiltros()}
        </div>
        <div className="filtros-actions">
          <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
            🗑️ Limpiar
          </button>
          <button className="btn-aplicar-filtros" onClick={generarReporte}>
            📊 Generar Reporte
          </button>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generando reporte...</p>
        </div>
      ) : datos ? (
        <div className="resultados-panel">
          <div className="resultados-header">
            <h3>📈 Resultados del Reporte</h3>
            <div className="acciones-reporte">
              <button className="btn-descargar excel" onClick={descargarExcel}>
                📥 Descargar Excel
              </button>
              <button className="btn-descargar pdf" onClick={descargarPDF}>
                📄 Descargar PDF
              </button>
            </div>
          </div>

          {renderTotales()}
          {renderTabla()}
        </div>
      ) : null}
    </div>
  );
};

export default Reportes;
import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/reportes/pagos - Reporte de pagos con filtros
router.get('/pagos', authenticateToken, async (req, res) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      numeroCasa,
      estado,
      metodoPago
    } = req.query;

    // Construir filtros dinámicos
    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.fechaPago = {};
      if (fechaInicio) where.fechaPago.gte = new Date(fechaInicio as string);
      if (fechaFin) where.fechaPago.lte = new Date(fechaFin as string);
    }

    if (estado) {
      where.estado = estado;
    }

    if (metodoPago) {
      where.metodoPago = metodoPago;
    }

    if (numeroCasa) {
      where.casa = {
        numeroCasa: numeroCasa
      };
    }

    const pagos = await prisma.pago.findMany({
      where,
      include: {
        casa: {
          select: {
            numeroCasa: true,
            estadoPago: true
          }
        }
      },
      orderBy: {
        fechaPago: 'desc'
      }
    });

    // Calcular totales
    const totales = {
      totalPagos: pagos.length,
      montoTotal: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
      pagosAprobados: pagos.filter(p => p.estado === 'aprobado').length,
      pagosPendientes: pagos.filter(p => p.estado === 'pendiente').length,
      pagosRechazados: pagos.filter(p => p.estado === 'rechazado').length
    };

    res.json({
      success: true,
      data: {
        pagos,
        totales
      }
    });
  } catch (error: any) {
    console.error('Error al generar reporte de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/reportes/movimientos - Reporte de movimientos financieros con filtros
router.get('/movimientos', authenticateToken, async (req, res) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      tipo,
      idCategoria
    } = req.query;

    // Construir filtros dinámicos
    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio as string);
      if (fechaFin) where.fecha.lte = new Date(fechaFin as string);
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (idCategoria) {
      where.idCategoria = parseInt(idCategoria as string);
    }

    const movimientos = await prisma.movimientoFinanciero.findMany({
      where,
      include: {
        categoria: {
          select: {
            nombre: true
          }
        },
        pago: {
          include: {
            casa: {
              select: {
                numeroCasa: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Calcular totales
    const ingresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const gastos = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const totales = {
      totalMovimientos: movimientos.length,
      totalIngresos: ingresos,
      totalGastos: gastos,
      balance: ingresos - gastos,
      movimientosPorCategoria: movimientos.reduce((acc: any, m) => {
        const cat = m.categoria.nombre;
        if (!acc[cat]) {
          acc[cat] = { cantidad: 0, monto: 0 };
        }
        acc[cat].cantidad++;
        acc[cat].monto += Number(m.monto);
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        movimientos,
        totales
      }
    });
  } catch (error: any) {
    console.error('Error al generar reporte de movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/reportes/usuarios - Reporte de usuarios con filtros
router.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    const {
      estadoCuenta,
      idRol,
      numeroCasa
    } = req.query;

    // Construir filtros dinámicos
    const where: any = {};

    if (estadoCuenta) {
      where.estadoCuenta = estadoCuenta;
    }

    if (idRol) {
      where.idRol = parseInt(idRol as string);
    }

    if (numeroCasa) {
      where.casa = {
        numeroCasa: numeroCasa
      };
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        idUsuario: true,
        nombreCompleto: true,
        correoElectronico: true,
        telefono: true,
        estadoCuenta: true,
        fechaRegistro: true,
        fechaAprobacion: true,
        fechaUltimoAcceso: true,
        rol: {
          select: {
            nombreRol: true
          }
        },
        casa: {
          select: {
            numeroCasa: true,
            estadoPago: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });

    // Calcular estadísticas
    const totales = {
      totalUsuarios: usuarios.length,
      usuariosActivos: usuarios.filter(u => u.estadoCuenta === 'activo').length,
      usuariosPendientes: usuarios.filter(u => u.estadoCuenta === 'pendiente').length,
      usuariosSuspendidos: usuarios.filter(u => u.estadoCuenta === 'suspendido').length,
      usuariosPorRol: usuarios.reduce((acc: any, u) => {
        const rol = u.rol.nombreRol;
        acc[rol] = (acc[rol] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        usuarios,
        totales
      }
    });
  } catch (error: any) {
    console.error('Error al generar reporte de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/reportes/casas - Reporte de casas con estado de pagos
router.get('/casas', authenticateToken, async (req, res) => {
  try {
    const { estadoPago } = req.query;

    const where: any = {};
    if (estadoPago) {
      where.estadoPago = estadoPago;
    }

    const casas = await prisma.casa.findMany({
      where,
      include: {
        usuarios: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true,
            rol: {
              select: {
                nombreRol: true
              }
            }
          }
        },
        pagos: {
          select: {
            monto: true,
            fechaPago: true,
            estado: true
          },
          orderBy: {
            fechaPago: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        numeroCasa: 'asc'
      }
    });

    // Calcular estadísticas
    const totales = {
      totalCasas: casas.length,
      casasAlDia: casas.filter(c => c.estadoPago === 'al_dia').length,
      casasMorosas: casas.filter(c => c.estadoPago === 'moroso').length,
      casasEnArreglo: casas.filter(c => c.estadoPago === 'en_arreglo').length,
      casasConUsuarios: casas.filter(c => c.usuarios.length > 0).length,
      casasSinUsuarios: casas.filter(c => c.usuarios.length === 0).length
    };

    res.json({
      success: true,
      data: {
        casas,
        totales
      }
    });
  } catch (error: any) {
    console.error('Error al generar reporte de casas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/reportes/categorias - Obtener categorías para filtros
router.get('/categorias', authenticateToken, async (req, res) => {
  try {
    const categorias = await prisma.categoriaFinanciera.findMany({
      where: {
        activo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json({
      success: true,
      data: categorias
    });
  } catch (error: any) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

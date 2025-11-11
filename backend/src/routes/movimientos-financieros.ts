import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/movimientos-financieros - Obtener todos los movimientos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const movimientos = await prisma.movimientoFinanciero.findMany({
      include: {
        categoria: {
          select: {
            idCategoria: true,
            nombre: true
          }
        },
        pago: {
          select: {
            idPago: true,
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

    res.json({
      success: true,
      data: movimientos
    });
  } catch (error: any) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/movimientos-financieros/resumen - Obtener resumen financiero
router.get('/resumen', authenticateToken, async (req, res) => {
  try {
    // Obtener todos los movimientos
    const movimientos = await prisma.movimientoFinanciero.findMany();

    // Calcular totales
    const ingresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + parseFloat(m.monto.toString()), 0);

    const gastos = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + parseFloat(m.monto.toString()), 0);

    const presupuestoTotal = ingresos - gastos;

    res.json({
      success: true,
      data: {
        ingresos,
        gastos,
        presupuestoTotal,
        totalMovimientos: movimientos.length
      }
    });
  } catch (error: any) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/movimientos-financieros - Crear un movimiento
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tipo, idCategoria, detalles, monto, fecha } = req.body;

    // Validaciones
    if (!tipo || !idCategoria || !detalles || !monto) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (tipo !== 'ingreso' && tipo !== 'gasto') {
      return res.status(400).json({
        success: false,
        message: 'El tipo debe ser "ingreso" o "gasto"'
      });
    }

    // Verificar que la categoría existe
    const categoria = await prisma.categoriaFinanciera.findUnique({
      where: { idCategoria: parseInt(idCategoria) }
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'La categoría no existe'
      });
    }

    const movimiento = await prisma.movimientoFinanciero.create({
      data: {
        tipo,
        idCategoria: parseInt(idCategoria),
        detalles,
        monto: parseFloat(monto),
        fecha: fecha ? new Date(fecha) : new Date()
      },
      include: {
        categoria: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Movimiento creado exitosamente',
      data: movimiento
    });
  } catch (error: any) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/movimientos-financieros/:id - Actualizar un movimiento
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, idCategoria, detalles, monto, fecha } = req.body;

    // Verificar si el movimiento está asociado a un pago
    const movimientoActual = await prisma.movimientoFinanciero.findUnique({
      where: { idMovimiento: parseInt(id) }
    });

    if (!movimientoActual) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    if (movimientoActual.idPago) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un movimiento generado automáticamente desde un pago'
      });
    }

    const movimiento = await prisma.movimientoFinanciero.update({
      where: { idMovimiento: parseInt(id) },
      data: {
        tipo,
        idCategoria: parseInt(idCategoria),
        detalles,
        monto: parseFloat(monto),
        fecha: fecha ? new Date(fecha) : undefined
      },
      include: {
        categoria: true
      }
    });

    res.json({
      success: true,
      message: 'Movimiento actualizado exitosamente',
      data: movimiento
    });
  } catch (error: any) {
    console.error('Error al actualizar movimiento:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/movimientos-financieros/:id - Eliminar un movimiento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el movimiento está asociado a un pago
    const movimiento = await prisma.movimientoFinanciero.findUnique({
      where: { idMovimiento: parseInt(id) }
    });

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    if (movimiento.idPago) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un movimiento generado automáticamente desde un pago'
      });
    }

    await prisma.movimientoFinanciero.delete({
      where: { idMovimiento: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Movimiento eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar movimiento:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

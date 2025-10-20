import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/pagos/mi-casa - Obtener historial de pagos de la casa del usuario autenticado
// TODO: Re-enable authenticateToken after implementing login system
router.get('/mi-casa', async (req, res) => {
  try {
    // TODO: Get user ID from token after login is implemented
    // For now, use Super Admin (idUsuario = 1)
    const idUsuario = 1;
    
    console.log('Obteniendo pagos para usuario:', idUsuario);

    // Obtener el usuario con su casa
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: idUsuario },
      include: { casa: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!usuario.idCasa) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene una casa asignada'
      });
    }

    // Obtener los pagos de la casa ordenados por fecha descendente
    const pagos = await prisma.pago.findMany({
      where: {
        idCasa: usuario.idCasa
      },
      select: {
        idPago: true,
        monto: true,
        descripcion: true,
        fechaPago: true
      },
      orderBy: {
        fechaPago: 'desc'
      }
    });

    // Calcular monto adeudado del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener pagos del mes actual
    const pagosDelMes = await prisma.pago.findMany({
      where: {
        idCasa: usuario.idCasa,
        fechaPago: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Calcular total pagado en el mes
    const totalPagadoMes = pagosDelMes.reduce((sum: number, pago: any) => {
      return sum + parseFloat(pago.monto.toString());
    }, 0);

    // Cuota mensual estándar (esto debería venir de configuración)
    const cuotaMensual = 25000; // ₡25,000 por defecto
    const montoAdeudado = Math.max(0, cuotaMensual - totalPagadoMes);

    res.json({
      success: true,
      data: {
        casa: {
          numeroCasa: usuario.casa?.numeroCasa,
          estadoPago: usuario.casa?.estadoPago
        },
        pagos,
        mesActual: {
          cuotaMensual,
          totalPagado: totalPagadoMes,
          montoAdeudado,
          mes: now.toLocaleString('es-CR', { month: 'long', year: 'numeric' })
        }
      }
    });
  } catch (error: any) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/pagos/casa/:numeroCasa - Obtener historial de pagos de una casa específica (para administradores)
router.get('/casa/:numeroCasa', authenticateToken, async (req, res) => {
  try {
    const { numeroCasa } = req.params;

    // Buscar la casa
    const casa = await prisma.casa.findUnique({
      where: { numeroCasa }
    });

    if (!casa) {
      return res.status(404).json({
        success: false,
        message: 'Casa no encontrada'
      });
    }

    // Obtener los pagos de la casa
    const pagos = await prisma.pago.findMany({
      where: {
        idCasa: casa.idCasa
      },
      select: {
        idPago: true,
        monto: true,
        descripcion: true,
        fechaPago: true
      },
      orderBy: {
        fechaPago: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        casa: {
          numeroCasa: casa.numeroCasa,
          estadoPago: casa.estadoPago
        },
        pagos
      }
    });
  } catch (error: any) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/pagos - Crear un nuevo pago (para administradores)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { idCasa, monto, descripcion, metodoPago, comprobante } = req.body;

    const pago = await prisma.pago.create({
      data: {
        idCasa: parseInt(idCasa),
        monto,
        descripcion,
        metodoPago,
        comprobante
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: pago
    });
  } catch (error: any) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

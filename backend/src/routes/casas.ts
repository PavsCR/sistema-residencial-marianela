import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/casas/:numeroCasa/usuarios - Obtener usuarios de una casa específica
router.get('/:numeroCasa/usuarios', async (req, res) => {
  try {
    const { numeroCasa } = req.params;

    // Buscar la casa por número
    const casa = await prisma.casa.findUnique({
      where: {
        numeroCasa: numeroCasa
      },
      include: {
        usuarios: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true,
            telefono: true,
            estadoCuenta: true,
            fechaRegistro: true,
            fechaUltimoAcceso: true,
            rol: {
              select: {
                nombreRol: true,
                descripcion: true
              }
            }
          }
        }
      }
    });

    if (!casa) {
      return res.status(404).json({
        success: false,
        message: 'Casa no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        casa: {
          numeroCasa: casa.numeroCasa,
          estadoPago: casa.estadoPago,
          creadoEn: casa.creadoEn,
          actualizadoEn: casa.actualizadoEn
        },
        usuarios: casa.usuarios
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios de la casa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/casas - Obtener todas las casas con su estado
router.get('/', async (req, res) => {
  try {
    const casas = await prisma.casa.findMany({
      select: {
        idCasa: true,
        numeroCasa: true,
        estadoPago: true,
        _count: {
          select: {
            usuarios: true
          }
        }
      },
      orderBy: {
        numeroCasa: 'asc'
      }
    });

    // Transform the data to match frontend expectations
    const casasFormatted = casas.map(casa => ({
      id: casa.numeroCasa,
      status: casa.estadoPago,
      usuariosCount: casa._count.usuarios
    }));

    res.json({
      success: true,
      data: casasFormatted
    });

  } catch (error) {
    console.error('Error al obtener casas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/casas/:numeroCasa/estado-pago - Actualizar estado de pago de una casa (para administradores)
router.put('/:numeroCasa/estado-pago', authenticateToken, async (req, res) => {
  try {
    const { numeroCasa } = req.params;
    const { estadoPago } = req.body;

    // Validar estado
    if (!['al_dia', 'moroso', 'en_arreglo'].includes(estadoPago)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de pago inválido. Debe ser: al_dia, moroso o en_arreglo'
      });
    }

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

    // Actualizar estado de pago
    const casaActualizada = await prisma.casa.update({
      where: { numeroCasa },
      data: { estadoPago }
    });

    res.json({
      success: true,
      message: 'Estado de pago actualizado exitosamente',
      data: {
        numeroCasa: casaActualizada.numeroCasa,
        estadoPago: casaActualizada.estadoPago
      }
    });

  } catch (error: any) {
    console.error('Error al actualizar estado de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
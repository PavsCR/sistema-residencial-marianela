import { Router } from 'express';
import { prisma } from '../config/prisma';

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

export default router;
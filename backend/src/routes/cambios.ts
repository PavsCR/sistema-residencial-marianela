import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/cambios - Obtener todas las solicitudes de cambio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cambios = await prisma.solicitudCambio.findMany({
      include: {
        usuario: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true,
            telefono: true,
            casa: {
              select: {
                numeroCasa: true
              }
            }
          }
        },
        revisor: {
          select: {
            nombreCompleto: true
          }
        }
      },
      orderBy: {
        fechaSolicitud: 'desc'
      }
    });

    res.json({
      success: true,
      data: cambios
    });
  } catch (error) {
    console.error('Error al obtener solicitudes de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/cambios - Crear nueva solicitud de cambio
// TODO: Re-enable authenticateToken after implementing login system
// router.post('/', authenticateToken, async (req, res) => {
router.post('/', async (req, res) => {
  try {
    const { idUsuario, datosNuevos, motivo } = req.body;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: parseInt(idUsuario) }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Crear la solicitud de cambio
    const solicitudCambio = await prisma.solicitudCambio.create({
      data: {
        idUsuario: parseInt(idUsuario),
        datosOriginales: JSON.parse(JSON.stringify({
          nombreCompleto: usuario.nombreCompleto,
          correoElectronico: usuario.correoElectronico,
          telefono: usuario.telefono
        })),
        datosNuevos: JSON.parse(JSON.stringify(datosNuevos)),
        motivo
      }
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de cambio creada exitosamente',
      data: solicitudCambio
    });
  } catch (error) {
    console.error('Error al crear solicitud de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/cambios/:id/aprobar - Aprobar solicitud de cambio
router.put('/:id/aprobar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitudCambio.findUnique({
      where: { idSolicitud: parseInt(id) },
      include: { usuario: true }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'La solicitud ya fue procesada'
      });
    }

    // Actualizar datos del usuario y aprobar solicitud en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const datosNuevos = solicitud.datosNuevos as {
        nombreCompleto?: string;
        correoElectronico?: string;
        telefono?: string | null;
      };
      
      // Actualizar datos del usuario
      const usuarioActualizado = await tx.usuario.update({
        where: { idUsuario: solicitud.idUsuario },
        data: {
          nombreCompleto: datosNuevos.nombreCompleto || solicitud.usuario.nombreCompleto,
          correoElectronico: datosNuevos.correoElectronico || solicitud.usuario.correoElectronico,
          telefono: datosNuevos.telefono !== undefined ? datosNuevos.telefono : solicitud.usuario.telefono
        }
      });

      // Actualizar solicitud
      const solicitudActualizada = await tx.solicitudCambio.update({
        where: { idSolicitud: parseInt(id) },
        data: {
          estado: 'aprobada',
          fechaRevision: new Date(),
          idRevisor: req.user!.idUsuario
        }
      });

      return { usuarioActualizado, solicitudActualizada };
    });

    res.json({
      success: true,
      message: 'Solicitud aprobada y datos actualizados exitosamente',
      data: resultado
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/cambios/:id/rechazar - Rechazar solicitud de cambio
router.put('/:id/rechazar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const solicitud = await prisma.solicitudCambio.findUnique({
      where: { idSolicitud: parseInt(id) }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'La solicitud ya fue procesada'
      });
    }

    const solicitudActualizada = await prisma.solicitudCambio.update({
      where: { idSolicitud: parseInt(id) },
      data: {
        estado: 'rechazada',
        fechaRevision: new Date(),
        idRevisor: req.user!.idUsuario,
        comentarios: motivo
      }
    });

    res.json({
      success: true,
      message: 'Solicitud rechazada exitosamente',
      data: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;

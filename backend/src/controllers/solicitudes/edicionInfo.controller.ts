/**
 * CONTROLADOR DE SOLICITUDES DE EDICIÓN DE INFORMACIÓN
 *
 * Maneja solicitudes de edición de información personal de usuarios
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../../config/prisma';

/**
 * CREAR SOLICITUD DE EDICIÓN
 * El usuario solicita editar su información personal
 */
export const crearSolicitudEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    const { nombreCompleto, correoElectronico, telefono } = req.body;

    // Obtener información actual del usuario
    const usuarioActual = await prisma.usuario.findUnique({
      where: { idUsuario: req.user.idUsuario },
    });

    if (!usuarioActual) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    // Verificar si ya tiene una solicitud pendiente
    const solicitudPendiente = await prisma.solicitudEdicionInfo.findFirst({
      where: {
        idUsuario: req.user.idUsuario,
        estado: 'pendiente',
      },
    });

    if (solicitudPendiente) {
      res.status(400).json({
        success: false,
        message: 'Ya tienes una solicitud de edición pendiente',
      });
      return;
    }

    // Verificar que al menos un campo sea diferente
    const hayCambios =
      nombreCompleto !== usuarioActual.nombreCompleto ||
      correoElectronico !== usuarioActual.correoElectronico ||
      telefono !== usuarioActual.telefono;

    if (!hayCambios) {
      res.status(400).json({
        success: false,
        message: 'No hay cambios para solicitar',
      });
      return;
    }

    // Si se cambia el correo, verificar que no esté en uso
    if (correoElectronico !== usuarioActual.correoElectronico) {
      const correoExistente = await prisma.usuario.findFirst({
        where: {
          correoElectronico: correoElectronico,
          NOT: { idUsuario: req.user.idUsuario },
        },
      });

      if (correoExistente) {
        res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está en uso por otro usuario',
        });
        return;
      }
    }

    // Crear la solicitud de edición
    const solicitud = await prisma.solicitudEdicionInfo.create({
      data: {
        idUsuario: req.user.idUsuario,
        nombreCompletoActual: usuarioActual.nombreCompleto,
        nombreCompletoNuevo: nombreCompleto !== usuarioActual.nombreCompleto ? nombreCompleto : null,
        correoActual: usuarioActual.correoElectronico,
        correoNuevo: correoElectronico !== usuarioActual.correoElectronico ? correoElectronico : null,
        telefonoActual: usuarioActual.telefono,
        telefonoNuevo: telefono !== usuarioActual.telefono ? telefono : null,
      },
    });

    // Registrar en historial
    await prisma.historialOperacion.create({
      data: {
        idUsuario: req.user.idUsuario,
        tipoOperacion: 'solicitud_edicion_info',
        descripcion: 'Usuario solicitó editar su información personal',
        datosAdicionales: {
          idSolicitud: solicitud.idSolicitud,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de edición enviada. Pendiente de aprobación por un administrador.',
      data: {
        idSolicitud: solicitud.idSolicitud,
        fechaSolicitud: solicitud.fechaSolicitud,
      },
    });
  } catch (error) {
    console.error('Error en crearSolicitudEdicion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud de edición',
    });
  }
};

/**
 * LISTAR SOLICITUDES DE EDICIÓN (para administradores)
 */
export const listarSolicitudesEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const solicitudes = await prisma.solicitudEdicionInfo.findMany({
      where: {
        estado: 'pendiente',
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
      select: {
        idSolicitud: true,
        idUsuario: true,
        nombreCompletoActual: true,
        nombreCompletoNuevo: true,
        correoActual: true,
        correoNuevo: true,
        telefonoActual: true,
        telefonoNuevo: true,
        fechaSolicitud: true,
        estado: true,
      },
    });

    res.status(200).json({
      success: true,
      data: solicitudes,
    });
  } catch (error) {
    console.error('Error en listarSolicitudesEdicion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar solicitudes de edición',
    });
  }
};

/**
 * APROBAR SOLICITUD DE EDICIÓN
 */
export const aprobarSolicitudEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    // Buscar la solicitud
    const solicitud = await prisma.solicitudEdicionInfo.findUnique({
      where: { idSolicitud: parseInt(id) },
    });

    if (!solicitud) {
      res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
      });
      return;
    }

    if (solicitud.estado !== 'pendiente') {
      res.status(400).json({
        success: false,
        message: 'La solicitud ya fue procesada',
      });
      return;
    }

    // Actualizar usuario y marcar solicitud como aprobada en una transacción
    await prisma.$transaction(async (tx) => {
      // Preparar datos de edición
      const datosEdicion: any = {};
      if (solicitud.nombreCompletoNuevo) {
        datosEdicion.nombreCompleto = solicitud.nombreCompletoNuevo;
      }
      if (solicitud.correoNuevo) {
        datosEdicion.correoElectronico = solicitud.correoNuevo;
      }
      if (solicitud.telefonoNuevo !== undefined) {
        datosEdicion.telefono = solicitud.telefonoNuevo;
      }

      // Actualizar usuario
      await tx.usuario.update({
        where: { idUsuario: solicitud.idUsuario },
        data: datosEdicion,
      });

      // Actualizar solicitud
      await tx.solicitudEdicionInfo.update({
        where: { idSolicitud: parseInt(id) },
        data: {
          estado: 'aprobada',
          fechaRevision: new Date(),
          idRevisor: req.user!.idUsuario,
        },
      });

      // Registrar en historial
      await tx.historialOperacion.create({
        data: {
          idUsuario: req.user!.idUsuario,
          tipoOperacion: 'aprobacion_edicion_info',
          descripcion: `Aprobada solicitud de edición para usuario ID ${solicitud.idUsuario}`,
          datosAdicionales: {
            idSolicitud: solicitud.idSolicitud,
            cambiosAplicados: datosEdicion,
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Solicitud aprobada. Información del usuario actualizada.',
    });
  } catch (error) {
    console.error('Error en aprobarSolicitudEdicion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar solicitud',
    });
  }
};

/**
 * RECHAZAR SOLICITUD DE EDICIÓN
 */
export const rechazarSolicitudEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;
    const { motivo } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    // Buscar la solicitud
    const solicitud = await prisma.solicitudEdicionInfo.findUnique({
      where: { idSolicitud: parseInt(id) },
    });

    if (!solicitud) {
      res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
      });
      return;
    }

    if (solicitud.estado !== 'pendiente') {
      res.status(400).json({
        success: false,
        message: 'La solicitud ya fue procesada',
      });
      return;
    }

    // Actualizar solicitud y registrar en historial
    await prisma.$transaction(async (tx) => {
      await tx.solicitudEdicionInfo.update({
        where: { idSolicitud: parseInt(id) },
        data: {
          estado: 'rechazada',
          fechaRevision: new Date(),
          idRevisor: req.user!.idUsuario,
          comentarios: motivo,
        },
      });

      await tx.historialOperacion.create({
        data: {
          idUsuario: req.user!.idUsuario,
          tipoOperacion: 'rechazo_edicion_info',
          descripcion: `Rechazada solicitud de edición para usuario ID ${solicitud.idUsuario}`,
          datosAdicionales: {
            idSolicitud: solicitud.idSolicitud,
            motivo,
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Solicitud rechazada',
    });
  } catch (error) {
    console.error('Error en rechazarSolicitudEdicion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
    });
  }
};

/**
 * VALIDADORES
 */
export const validacionCrearSolicitud = [
  body('nombreCompleto')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es obligatorio')
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('correoElectronico')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .isLength({ max: 255 })
    .withMessage('El correo no puede exceder 255 caracteres'),
  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('El teléfono debe tener entre 8 y 20 caracteres'),
];

export const validacionRechazarEdicion = [
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo del rechazo es obligatorio')
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
];

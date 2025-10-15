/**
 * CONTROLADOR DE SOLICITUDES DE DESACTIVACIÓN
 *
 * Maneja solicitudes de desactivación de cuentas de usuarios (MI_03)
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../../config/prisma';

/**
 * CREAR SOLICITUD DE DESACTIVACIÓN
 * Un usuario solicita desactivar una cuenta asociada a su vivienda
 */
export const crearSolicitudDesactivacion = async (req: Request, res: Response): Promise<void> => {
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

    const { idUsuarioDesactivar, motivo } = req.body;

    // Verificar que el usuario a desactivar existe
    const usuarioDesactivar = await prisma.usuario.findUnique({
      where: { idUsuario: parseInt(idUsuarioDesactivar) },
      include: { casa: true },
    });

    if (!usuarioDesactivar) {
      res.status(404).json({
        success: false,
        message: 'Usuario a desactivar no encontrado',
      });
      return;
    }

    // Verificar que el solicitante tiene permiso (misma casa o es admin)
    const solicitante = await prisma.usuario.findUnique({
      where: { idUsuario: req.user.idUsuario },
      include: { rol: true, casa: true },
    });

    const esAdmin = solicitante?.rol.nombreRol === 'administrador' || solicitante?.rol.nombreRol === 'super_admin';
    const mismaCasa = solicitante?.idCasa === usuarioDesactivar.idCasa;

    if (!esAdmin && !mismaCasa) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para solicitar la desactivación de este usuario',
      });
      return;
    }

    // Verificar que no intente desactivarse a sí mismo directamente
    if (req.user.idUsuario === parseInt(idUsuarioDesactivar)) {
      res.status(400).json({
        success: false,
        message: 'No puedes solicitar tu propia desactivación directamente. Contacta con un administrador.',
      });
      return;
    }

    // Verificar que el usuario ya no esté desactivado
    if (usuarioDesactivar.estadoCuenta === 'suspendido') {
      res.status(400).json({
        success: false,
        message: 'Este usuario ya está desactivado',
      });
      return;
    }

    // Verificar si ya existe una solicitud pendiente para este usuario
    const solicitudExistente = await prisma.solicitudDesactivacion.findFirst({
      where: {
        idUsuarioDesactivar: parseInt(idUsuarioDesactivar),
        estado: 'pendiente',
      },
    });

    if (solicitudExistente) {
      res.status(400).json({
        success: false,
        message: 'Ya existe una solicitud de desactivación pendiente para este usuario',
      });
      return;
    }

    // Crear la solicitud de desactivación
    const solicitud = await prisma.solicitudDesactivacion.create({
      data: {
        idUsuarioSolicitante: req.user.idUsuario,
        idUsuarioDesactivar: parseInt(idUsuarioDesactivar),
        motivo,
      },
    });

    // Registrar en historial
    await prisma.historialOperacion.create({
      data: {
        idUsuario: req.user.idUsuario,
        tipoOperacion: 'solicitud_desactivacion',
        descripcion: `Usuario solicitó desactivar cuenta ID ${idUsuarioDesactivar}`,
        datosAdicionales: {
          idSolicitud: solicitud.idSolicitud,
          idUsuarioDesactivar: parseInt(idUsuarioDesactivar),
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de desactivación enviada. Pendiente de aprobación por un administrador.',
      data: {
        idSolicitud: solicitud.idSolicitud,
        fechaSolicitud: solicitud.fechaSolicitud,
      },
    });
  } catch (error) {
    console.error('Error en crearSolicitudDesactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud de desactivación',
    });
  }
};

/**
 * LISTAR SOLICITUDES DE DESACTIVACIÓN (para administradores)
 */
export const listarSolicitudesDesactivacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const solicitudes = await prisma.solicitudDesactivacion.findMany({
      where: {
        estado: 'pendiente',
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
    });

    // Obtener información de los usuarios involucrados
    const solicitudesConInfo = await Promise.all(
      solicitudes.map(async (solicitud) => {
        const solicitante = await prisma.usuario.findUnique({
          where: { idUsuario: solicitud.idUsuarioSolicitante },
          select: { nombreCompleto: true, correoElectronico: true },
        });

        const usuarioDesactivar = await prisma.usuario.findUnique({
          where: { idUsuario: solicitud.idUsuarioDesactivar },
          select: {
            nombreCompleto: true,
            correoElectronico: true,
            telefono: true,
            casa: { select: { numeroCasa: true } },
          },
        });

        return {
          ...solicitud,
          solicitante,
          usuarioDesactivar,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: solicitudesConInfo,
    });
  } catch (error) {
    console.error('Error en listarSolicitudesDesactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar solicitudes de desactivación',
    });
  }
};

/**
 * APROBAR SOLICITUD DE DESACTIVACIÓN
 * Desactiva la cuenta del usuario (cambia estado a 'suspendido')
 */
export const aprobarSolicitudDesactivacion = async (req: Request, res: Response): Promise<void> => {
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
    const solicitud = await prisma.solicitudDesactivacion.findUnique({
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

    // Desactivar usuario y actualizar solicitud en una transacción
    await prisma.$transaction(async (tx) => {
      // Desactivar usuario (cambiar estado a suspendido)
      await tx.usuario.update({
        where: { idUsuario: solicitud.idUsuarioDesactivar },
        data: {
          estadoCuenta: 'suspendido',
        },
      });

      // Actualizar solicitud
      await tx.solicitudDesactivacion.update({
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
          tipoOperacion: 'aprobacion_desactivacion',
          descripcion: `Aprobada desactivación de usuario ID ${solicitud.idUsuarioDesactivar}`,
          datosAdicionales: {
            idSolicitud: solicitud.idSolicitud,
            idUsuarioDesactivado: solicitud.idUsuarioDesactivar,
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Solicitud aprobada. Usuario desactivado exitosamente.',
    });
  } catch (error) {
    console.error('Error en aprobarSolicitudDesactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar solicitud',
    });
  }
};

/**
 * RECHAZAR SOLICITUD DE DESACTIVACIÓN
 */
export const rechazarSolicitudDesactivacion = async (req: Request, res: Response): Promise<void> => {
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
    const solicitud = await prisma.solicitudDesactivacion.findUnique({
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
      await tx.solicitudDesactivacion.update({
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
          tipoOperacion: 'rechazo_desactivacion',
          descripcion: `Rechazada solicitud de desactivación para usuario ID ${solicitud.idUsuarioDesactivar}`,
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
    console.error('Error en rechazarSolicitudDesactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
    });
  }
};

/**
 * VALIDADORES
 */
export const validacionCrearSolicitudDesactivacion = [
  body('idUsuarioDesactivar')
    .notEmpty()
    .withMessage('El ID del usuario a desactivar es obligatorio')
    .isInt()
    .withMessage('El ID debe ser un número entero'),
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo de desactivación es obligatorio')
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
];

export const validacionRechazarDesactivacion = [
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo del rechazo es obligatorio')
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
];

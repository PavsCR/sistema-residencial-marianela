/**
 * CONTROLADOR DE SOLICITUDES DE REACTIVACIÓN
 *
 * Maneja solicitudes de reactivación de cuentas suspendidas
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../../config/prisma';

/**
 * CREAR SOLICITUD DE REACTIVACIÓN (Endpoint público - no requiere autenticación)
 * Un usuario suspendido solicita reactivar su cuenta
 */
export const crearSolicitudReactivacion = async (req: Request, res: Response): Promise<void> => {
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

    const { correoElectronico, motivo, numeroCasaNuevo } = req.body;

    // Buscar usuario por correo
    const usuario = await prisma.usuario.findUnique({
      where: { correoElectronico },
      include: {
        rol: true,
        casa: true,
      },
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    // Verificar que la cuenta esté suspendida
    if (usuario.estadoCuenta !== 'suspendido') {
      res.status(400).json({
        success: false,
        message: 'Esta cuenta no está suspendida',
      });
      return;
    }

    // Verificar que el número de casa existe
    const casaNueva = await prisma.casa.findUnique({
      where: { numeroCasa: numeroCasaNuevo },
    });

    if (!casaNueva) {
      res.status(400).json({
        success: false,
        message: 'Número de casa inválido',
      });
      return;
    }

    // Verificar si ya existe una solicitud pendiente para este usuario
    const solicitudExistente = await prisma.solicitudReactivacion.findFirst({
      where: {
        idUsuario: usuario.idUsuario,
        estado: 'pendiente',
      },
    });

    if (solicitudExistente) {
      res.status(400).json({
        success: false,
        message: 'Ya existe una solicitud de reactivación pendiente para este usuario',
      });
      return;
    }

    // Crear la solicitud de reactivación
    const solicitud = await prisma.solicitudReactivacion.create({
      data: {
        idUsuario: usuario.idUsuario,
        motivo,
        numeroCasaNuevo,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de reactivación enviada. Pendiente de aprobación por un administrador.',
      data: {
        idSolicitud: solicitud.idSolicitud,
        fechaSolicitud: solicitud.fechaSolicitud,
      },
    });
  } catch (error) {
    console.error('Error en crearSolicitudReactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud de reactivación',
    });
  }
};

/**
 * LISTAR SOLICITUDES DE REACTIVACIÓN (para administradores)
 */
export const listarSolicitudesReactivacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const solicitudes = await prisma.solicitudReactivacion.findMany({
      where: {
        estado: 'pendiente',
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
    });

    // Obtener información de los usuarios
    const solicitudesConInfo = await Promise.all(
      solicitudes.map(async (solicitud) => {
        const usuario = await prisma.usuario.findUnique({
          where: { idUsuario: solicitud.idUsuario },
          select: {
            nombreCompleto: true,
            correoElectronico: true,
            telefono: true,
            estadoCuenta: true,
            casa: { select: { numeroCasa: true } },
          },
        });

        const casaNueva = await prisma.casa.findUnique({
          where: { numeroCasa: solicitud.numeroCasaNuevo },
          select: { numeroCasa: true, idCasa: true },
        });

        return {
          ...solicitud,
          usuario,
          casaNueva,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: solicitudesConInfo,
    });
  } catch (error) {
    console.error('Error en listarSolicitudesReactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar solicitudes de reactivación',
    });
  }
};

/**
 * APROBAR SOLICITUD DE REACTIVACIÓN
 * Reactiva la cuenta del usuario y lo asigna a la nueva casa
 */
export const aprobarSolicitudReactivacion = async (req: Request, res: Response): Promise<void> => {
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
    const solicitud = await prisma.solicitudReactivacion.findUnique({
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

    // Verificar que la casa existe
    const casa = await prisma.casa.findUnique({
      where: { numeroCasa: solicitud.numeroCasaNuevo },
    });

    if (!casa) {
      res.status(400).json({
        success: false,
        message: 'Casa no encontrada',
      });
      return;
    }

    // Reactivar usuario, cambiar casa y actualizar solicitud en una transacción
    await prisma.$transaction(async (tx) => {
      // Reactivar usuario y cambiar a nueva casa
      await tx.usuario.update({
        where: { idUsuario: solicitud.idUsuario },
        data: {
          estadoCuenta: 'activo',
          idCasa: casa.idCasa,
        },
      });

      // Actualizar solicitud
      await tx.solicitudReactivacion.update({
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
          tipoOperacion: 'aprobacion_reactivacion',
          descripcion: `Aprobada reactivación de usuario ID ${solicitud.idUsuario} en casa ${solicitud.numeroCasaNuevo}`,
          datosAdicionales: {
            idSolicitud: solicitud.idSolicitud,
            idUsuarioReactivado: solicitud.idUsuario,
            casaNueva: solicitud.numeroCasaNuevo,
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Solicitud aprobada. Usuario reactivado exitosamente.',
    });
  } catch (error) {
    console.error('Error en aprobarSolicitudReactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar solicitud',
    });
  }
};

/**
 * RECHAZAR SOLICITUD DE REACTIVACIÓN
 */
export const rechazarSolicitudReactivacion = async (req: Request, res: Response): Promise<void> => {
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
    const solicitud = await prisma.solicitudReactivacion.findUnique({
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
      await tx.solicitudReactivacion.update({
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
          tipoOperacion: 'rechazo_reactivacion',
          descripcion: `Rechazada solicitud de reactivación para usuario ID ${solicitud.idUsuario}`,
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
    console.error('Error en rechazarSolicitudReactivacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
    });
  }
};

/**
 * VALIDADORES
 */
export const validacionCrearSolicitudReactivacion = [
  body('correoElectronico')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido'),
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo de reactivación es obligatorio')
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
  body('numeroCasaNuevo')
    .trim()
    .notEmpty()
    .withMessage('El número de casa es obligatorio'),
];

export const validacionRechazarReactivacion = [
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo del rechazo es obligatorio')
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
];

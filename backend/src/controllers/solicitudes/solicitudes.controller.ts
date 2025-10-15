/**
 * CONTROLADOR DE SOLICITUDES
 *
 * Maneja todas las operaciones de solicitudes:
 * - SL_01: Aprobación de solicitudes de registro
 * - SL_02: Aprobación de solicitudes de inactividad de cuentas
 * - SL_03: Cambio de perfil de usuario
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../../config/prisma';
import { hashPassword } from '../../shared/utils/password.utils';
// import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '../../shared/services/email.service';

/**
 * SL_01: LISTAR SOLICITUDES DE REGISTRO PENDIENTES
 */
export const listarSolicitudesRegistro = async (req: Request, res: Response): Promise<void> => {
  try {
    const solicitudes = await prisma.solicitudRegistro.findMany({
      where: {
        estado: 'pendiente',
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
      select: {
        idSolicitud: true,
        nombreCompleto: true,
        correoElectronico: true,
        telefono: true,
        numeroCasa: true,
        fechaSolicitud: true,
        estado: true,
      },
    });

    res.status(200).json({
      success: true,
      data: solicitudes,
    });
  } catch (error) {
    console.error('Error en listarSolicitudesRegistro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar solicitudes',
    });
  }
};

/**
 * SL_01: OBTENER DETALLE DE UNA SOLICITUD
 */
export const obtenerSolicitud = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitudRegistro.findUnique({
      where: { idSolicitud: parseInt(id) },
      select: {
        idSolicitud: true,
        nombreCompleto: true,
        correoElectronico: true,
        telefono: true,
        fechaSolicitud: true,
        estado: true,
        fechaRevision: true,
        comentarios: true,
      },
    });

    if (!solicitud) {
      res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: solicitud,
    });
  } catch (error) {
    console.error('Error en obtenerSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud',
    });
  }
};

/**
 * SL_01: APROBAR SOLICITUD DE REGISTRO
 * Crea la cuenta de usuario y notifica al solicitante
 */
export const aprobarSolicitud = async (req: Request, res: Response): Promise<void> => {
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

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    // Buscar la solicitud
    const solicitud = await prisma.solicitudRegistro.findUnique({
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

    // Verificar que el correo no esté ya registrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correoElectronico: solicitud.correoElectronico },
    });

    if (usuarioExistente) {
      res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
      });
      return;
    }

    // Si el usuario especificó una casa, buscar su ID
    let idCasaAsignada = null;
    if (solicitud.numeroCasa) {
      const casa = await prisma.casa.findFirst({
        where: { numeroCasa: solicitud.numeroCasa },
      });

      if (casa) {
        idCasaAsignada = casa.idCasa;
      }
    }

    // Obtener rol de vecino por defecto
    const rolVecino = await prisma.rol.findFirst({
      where: { nombreRol: 'vecino' },
    });

    if (!rolVecino) {
      res.status(500).json({
        success: false,
        message: 'Error: Rol de vecino no encontrado',
      });
      return;
    }

    // Crear usuario y actualizar solicitud en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const nuevoUsuario = await tx.usuario.create({
        data: {
          nombreCompleto: solicitud.nombreCompleto,
          correoElectronico: solicitud.correoElectronico,
          telefono: solicitud.telefono,
          contrasenaHash: solicitud.contrasenaHash,
          idRol: rolVecino.idRol,
          idCasa: idCasaAsignada,
          estadoCuenta: 'activo',
          fechaAprobacion: new Date(),
        },
      });

      // Actualizar solicitud
      const solicitudActualizada = await tx.solicitudRegistro.update({
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
          tipoOperacion: 'aprobacion_registro',
          descripcion: `Solicitud de registro aprobada para ${solicitud.correoElectronico}`,
          datosAdicionales: {
            idSolicitud: solicitud.idSolicitud,
            idUsuarioCreado: nuevoUsuario.idUsuario,
          },
        },
      });

      return { nuevoUsuario, solicitudActualizada };
    });

    // TODO: Enviar correo de confirmación al usuario
    // Descomentar cuando se configure el servicio de correo
    // try {
    //   await sendAccountApprovedEmail(
    //     resultado.nuevoUsuario.correoElectronico,
    //     resultado.nuevoUsuario.nombreCompleto
    //   );
    //   console.log(`✅ Correo de confirmación enviado a ${resultado.nuevoUsuario.correoElectronico}`);
    // } catch (emailError) {
    //   console.error('⚠️ Error al enviar correo de confirmación:', emailError);
    // }

    res.status(200).json({
      success: true,
      message: 'Solicitud aprobada exitosamente. Se ha creado la cuenta de usuario.',
      data: {
        usuario: {
          idUsuario: resultado.nuevoUsuario.idUsuario,
          nombreCompleto: resultado.nuevoUsuario.nombreCompleto,
          correoElectronico: resultado.nuevoUsuario.correoElectronico,
        },
      },
    });
  } catch (error) {
    console.error('Error en aprobarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar solicitud',
    });
  }
};

/**
 * SL_01: RECHAZAR SOLICITUD DE REGISTRO
 */
export const rechazarSolicitud = async (req: Request, res: Response): Promise<void> => {
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
    const solicitud = await prisma.solicitudRegistro.findUnique({
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
      await tx.solicitudRegistro.update({
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
          tipoOperacion: 'rechazo_registro',
          descripcion: `Solicitud de registro rechazada para ${solicitud.correoElectronico}`,
          datosAdicionales: {
            idSolicitud: solicitud.idSolicitud,
            motivo,
          },
        },
      });
    });

    // TODO: Enviar correo de notificación al solicitante
    // Descomentar cuando se configure el servicio de correo
    // try {
    //   await sendAccountRejectedEmail(
    //     solicitud.correoElectronico,
    //     solicitud.nombreCompleto,
    //     motivo
    //   );
    //   console.log(`✅ Correo de rechazo enviado a ${solicitud.correoElectronico}`);
    // } catch (emailError) {
    //   console.error('⚠️ Error al enviar correo de rechazo:', emailError);
    // }

    res.status(200).json({
      success: true,
      message: 'Solicitud rechazada.',
    });
  } catch (error) {
    console.error('Error en rechazarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
    });
  }
};

/**
 * VALIDADORES
 */
export const validacionAprobarSolicitud: any[] = [];

export const validacionRechazarSolicitud = [
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo del rechazo es obligatorio')
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
];

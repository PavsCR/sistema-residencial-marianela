/**
 * CONTROLADOR DE AUTENTICACIÓN
 *
 * Maneja todas las operaciones de autenticación y seguridad:
 * - AS_01: Registro de usuarios
 * - AS_02: Autenticación de usuarios (Login)
 * - AS_07: Restablecer contraseña
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../../config/prisma';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateResetToken
} from '../../shared/utils/password.utils';
import { generateToken } from '../../shared/utils/jwt.utils';

/**
 * AS_01: REGISTRO DE USUARIOS
 * Crear solicitud de registro que debe ser aprobada por un administrador
 */
export const registrarSolicitud = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
      return;
    }

    const { nombreCompleto, correoElectronico, contrasena } = req.body;

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(contrasena);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        message: 'La contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors,
      });
      return;
    }

    // Verificar que el correo no esté ya registrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correoElectronico },
    });

    if (usuarioExistente) {
      res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
      });
      return;
    }

    // Verificar que no haya solicitud pendiente con ese correo
    const solicitudExistente = await prisma.solicitudRegistro.findFirst({
      where: {
        correoElectronico,
        estado: 'pendiente',
      },
    });

    if (solicitudExistente) {
      res.status(400).json({
        success: false,
        message: 'Ya existe una solicitud pendiente con este correo electrónico',
      });
      return;
    }

    // Crear solicitud de registro
    const solicitud = await prisma.solicitudRegistro.create({
      data: {
        nombreCompleto,
        correoElectronico,
        estado: 'pendiente',
      },
    });

    // TODO: Enviar notificación al administrador sobre nueva solicitud

    res.status(201).json({
      success: true,
      message: 'Solicitud de registro enviada exitosamente. Un administrador revisará tu solicitud pronto.',
      data: {
        idSolicitud: solicitud.idSolicitud,
        fechaSolicitud: solicitud.fechaSolicitud,
      },
    });
  } catch (error) {
    console.error('Error en registrarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de registro',
    });
  }
};

/**
 * AS_02: LOGIN DE USUARIOS
 * Autenticar usuario y generar token JWT
 */
export const login = async (req: Request, res: Response): Promise<void> => {
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

    const { correoElectronico, contrasena } = req.body;

    // Buscar usuario por correo
    const usuario = await prisma.usuario.findUnique({
      where: { correoElectronico },
      include: {
        rol: true,
      },
    });

    // Mensaje genérico de error para no revelar si el usuario existe (AS_02)
    if (!usuario) {
      res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
      return;
    }

    // Verificar si la cuenta está bloqueada
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - new Date().getTime()) / (1000 * 60)
      );
      res.status(403).json({
        success: false,
        message: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minutos.`,
      });
      return;
    }

    // Verificar contraseña
    const contrasenaValida = await verifyPassword(contrasena, usuario.contrasenaHash);

    if (!contrasenaValida) {
      // Incrementar intentos fallidos
      const intentosFallidos = usuario.intentosFallidos + 1;
      const maxIntentos = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');

      // Bloquear cuenta si excede intentos máximos
      if (intentosFallidos >= maxIntentos) {
        const tiempoBloq = parseInt(process.env.LOCKOUT_TIME_MINUTES || '15');
        const bloqueadoHasta = new Date();
        bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + tiempoBloq);

        await prisma.usuario.update({
          where: { idUsuario: usuario.idUsuario },
          data: {
            intentosFallidos,
            bloqueadoHasta,
          },
        });

        res.status(403).json({
          success: false,
          message: `Cuenta bloqueada por ${tiempoBloq} minutos debido a múltiples intentos fallidos.`,
        });
        return;
      }

      // Actualizar intentos fallidos
      await prisma.usuario.update({
        where: { idUsuario: usuario.idUsuario },
        data: { intentosFallidos },
      });

      res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
        intentosRestantes: maxIntentos - intentosFallidos,
      });
      return;
    }

    // Verificar que la cuenta esté activa
    if (usuario.estadoCuenta !== 'activo') {
      res.status(403).json({
        success: false,
        message: `Cuenta ${usuario.estadoCuenta}. Contacta al administrador.`,
      });
      return;
    }

    // Login exitoso: resetear intentos fallidos y actualizar último acceso
    await prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        fechaUltimoAcceso: new Date(),
      },
    });

    // Generar token JWT
    const token = generateToken({
      idUsuario: usuario.idUsuario,
      correo: usuario.correoElectronico,
      rol: usuario.rol.nombreRol,
    });

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        usuario: {
          idUsuario: usuario.idUsuario,
          nombreCompleto: usuario.nombreCompleto,
          correoElectronico: usuario.correoElectronico,
          rol: usuario.rol.nombreRol,
          fechaUltimoAcceso: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el login',
    });
  }
};

/**
 * AS_07: SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA
 * Genera un token de recuperación y lo envía por correo
 */
export const solicitarRecuperacion = async (req: Request, res: Response): Promise<void> => {
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

    const { correoElectronico } = req.body;

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { correoElectronico },
    });

    // Por seguridad, siempre responder lo mismo aunque el usuario no exista
    if (!usuario) {
      res.status(200).json({
        success: true,
        message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
      });
      return;
    }

    // Generar token de recuperación
    const tokenRecuperacion = generateResetToken();
    const expiracionMinutos = parseInt(process.env.PASSWORD_RESET_EXPIRES || '60');
    const tokenExpira = new Date();
    tokenExpira.setMinutes(tokenExpira.getMinutes() + expiracionMinutos);

    // Guardar token en la base de datos
    await prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: {
        tokenRecuperacion,
        tokenRecuperacionExpira: tokenExpira,
      },
    });

    // TODO: Enviar correo con el enlace de recuperación
    // const enlaceRecuperacion = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${tokenRecuperacion}`;

    res.status(200).json({
      success: true,
      message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
      // En desarrollo, devolver el token (ELIMINAR EN PRODUCCIÓN)
      ...(process.env.NODE_ENV === 'development' && { debug: { token: tokenRecuperacion } }),
    });
  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
    });
  }
};

/**
 * AS_07: RESTABLECER CONTRASEÑA CON TOKEN
 */
export const restablecerContrasena = async (req: Request, res: Response): Promise<void> => {
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

    const { token, nuevaContrasena } = req.body;

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(nuevaContrasena);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        message: 'La contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors,
      });
      return;
    }

    // Buscar usuario con el token
    const usuario = await prisma.usuario.findFirst({
      where: {
        tokenRecuperacion: token,
        tokenRecuperacionExpira: {
          gte: new Date(), // Token no expirado
        },
      },
    });

    if (!usuario) {
      res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
      });
      return;
    }

    // Hashear nueva contraseña
    const nuevaContrasenaHash = await hashPassword(nuevaContrasena);

    // Actualizar contraseña y limpiar token
    await prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: {
        contrasenaHash: nuevaContrasenaHash,
        tokenRecuperacion: null,
        tokenRecuperacionExpira: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    console.error('Error en restablecerContrasena:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
    });
  }
};

/**
 * OBTENER PERFIL DEL USUARIO AUTENTICADO
 */
export const obtenerPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: req.user.idUsuario },
      select: {
        idUsuario: true,
        nombreCompleto: true,
        correoElectronico: true,
        estadoCuenta: true,
        fechaRegistro: true,
        fechaUltimoAcceso: true,
        rol: {
          select: {
            nombreRol: true,
            descripcion: true,
          },
        },
      },
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil',
    });
  }
};

/**
 * VALIDADORES DE EXPRESS-VALIDATOR
 */
export const validacionRegistro = [
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
    .normalizeEmail(),
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
];

export const validacionLogin = [
  body('correoElectronico')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

export const validacionSolicitarRecuperacion = [
  body('correoElectronico')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),
];

export const validacionRestablecerContrasena = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('El token es obligatorio'),
  body('nuevaContrasena')
    .notEmpty()
    .withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
];

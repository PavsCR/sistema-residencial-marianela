/**
 * RUTAS DE AUTENTICACIÓN Y SEGURIDAD
 *
 * Endpoints públicos y protegidos para autenticación
 */

import { Router } from 'express';
import {
  registrarSolicitud,
  login,
  solicitarRecuperacion,
  restablecerContrasena,
  obtenerPerfil,
  obtenerMiCasa,
  validacionRegistro,
  validacionLogin,
  validacionSolicitarRecuperacion,
  validacionRestablecerContrasena,
} from '../../controllers/autenticacion-seguridad/auth.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * RUTAS PÚBLICAS (sin autenticación)
 */

// AS_01: Registrar solicitud de nuevo usuario
router.post('/registro', validacionRegistro, registrarSolicitud);

// AS_02: Login de usuario
router.post('/login', validacionLogin, login);

// AS_07: Solicitar recuperación de contraseña
router.post('/recuperar-contrasena', validacionSolicitarRecuperacion, solicitarRecuperacion);

// AS_07: Restablecer contraseña con token
router.post('/restablecer-contrasena', validacionRestablecerContrasena, restablecerContrasena);

/**
 * RUTAS PROTEGIDAS (requieren autenticación)
 */

// Obtener perfil del usuario autenticado
router.get('/perfil', authenticateToken, obtenerPerfil);

// Obtener información de la casa del usuario
router.get('/mi-casa', authenticateToken, obtenerMiCasa);

// TODO: Agregar más rutas protegidas según sea necesario
// - Cambiar contraseña estando autenticado
// - Cerrar sesión
// - etc.

export default router;

/**
 * RUTAS DE SOLICITUDES DE EDICIÓN DE INFORMACIÓN
 *
 * Endpoints para gestión de solicitudes de edición de información personal
 */

import { Router } from 'express';
import {
  crearSolicitudEdicion,
  listarSolicitudesEdicion,
  aprobarSolicitudEdicion,
  rechazarSolicitudEdicion,
  validacionCrearSolicitud,
  validacionRechazarEdicion,
} from '../../controllers/solicitudes/edicionInfo.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * RUTAS PARA USUARIOS VECINOS
 */

// Crear solicitud de edición de información (cualquier usuario autenticado)
router.post('/', authenticateToken, validacionCrearSolicitud, crearSolicitudEdicion);

/**
 * RUTAS PARA ADMINISTRADORES
 */

// Listar solicitudes de edición pendientes (solo administradores)
router.get('/', authenticateToken, listarSolicitudesEdicion);

// Aprobar solicitud de edición (solo administradores)
router.put('/:id/aprobar', authenticateToken, aprobarSolicitudEdicion);

// Rechazar solicitud de edición (solo administradores)
router.put('/:id/rechazar', authenticateToken, validacionRechazarEdicion, rechazarSolicitudEdicion);

export default router;

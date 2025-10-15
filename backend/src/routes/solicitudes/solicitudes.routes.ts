/**
 * RUTAS DE SOLICITUDES
 *
 * Endpoints para gestión de solicitudes (solo administradores)
 */

import { Router } from 'express';
import {
  listarSolicitudesRegistro,
  obtenerSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  validacionAprobarSolicitud,
  validacionRechazarSolicitud,
} from '../../controllers/solicitudes/solicitudes.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * RUTAS PROTEGIDAS (requieren autenticación de administrador)
 */

// Listar todas las solicitudes de registro pendientes
router.get('/', authenticateToken, listarSolicitudesRegistro);

// Obtener detalle de una solicitud específica
router.get('/:id', authenticateToken, obtenerSolicitud);

// Aprobar una solicitud de registro
router.put('/:id/aprobar', authenticateToken, validacionAprobarSolicitud, aprobarSolicitud);

// Rechazar una solicitud de registro
router.put('/:id/rechazar', authenticateToken, validacionRechazarSolicitud, rechazarSolicitud);

export default router;

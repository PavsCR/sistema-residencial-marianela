/**
 * RUTAS DE SOLICITUDES DE DESACTIVACIÓN
 *
 * Endpoints para gestión de solicitudes de desactivación de cuentas
 */

import { Router } from 'express';
import {
  crearSolicitudDesactivacion,
  listarSolicitudesDesactivacion,
  aprobarSolicitudDesactivacion,
  rechazarSolicitudDesactivacion,
  validacionCrearSolicitudDesactivacion,
  validacionRechazarDesactivacion,
} from '../../controllers/solicitudes/desactivacion.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

// Crear solicitud de desactivación (cualquier usuario autenticado de la misma casa)
router.post('/', authenticateToken, validacionCrearSolicitudDesactivacion, crearSolicitudDesactivacion);

// Listar solicitudes de desactivación pendientes (solo administradores)
router.get('/', authenticateToken, listarSolicitudesDesactivacion);

// Aprobar solicitud de desactivación (solo administradores)
router.put('/:id/aprobar', authenticateToken, aprobarSolicitudDesactivacion);

// Rechazar solicitud de desactivación (solo administradores)
router.put('/:id/rechazar', authenticateToken, validacionRechazarDesactivacion, rechazarSolicitudDesactivacion);

export default router;

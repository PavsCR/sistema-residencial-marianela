/**
 * RUTAS DE SOLICITUDES DE REACTIVACIÓN
 *
 * Endpoints para gestión de solicitudes de reactivación de cuentas
 */

import { Router } from 'express';
import {
  crearSolicitudReactivacion,
  listarSolicitudesReactivacion,
  aprobarSolicitudReactivacion,
  rechazarSolicitudReactivacion,
  validacionCrearSolicitudReactivacion,
  validacionRechazarReactivacion,
} from '../../controllers/solicitudes/reactivacion.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

// Crear solicitud de reactivación (endpoint público - no requiere autenticación)
router.post('/', validacionCrearSolicitudReactivacion, crearSolicitudReactivacion);

// Listar solicitudes de reactivación pendientes (solo administradores)
router.get('/', authenticateToken, listarSolicitudesReactivacion);

// Aprobar solicitud de reactivación (solo administradores)
router.put('/:id/aprobar', authenticateToken, aprobarSolicitudReactivacion);

// Rechazar solicitud de reactivación (solo administradores)
router.put('/:id/rechazar', authenticateToken, validacionRechazarReactivacion, rechazarSolicitudReactivacion);

export default router;

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 *
 * Valida el token JWT en las peticiones protegidas
 * Cumple con el requerimiento AS_03 (Control de roles)
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.utils';

/**
 * Extender Request de Express para incluir usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware para verificar JWT
 * Uso: app.get('/ruta-protegida', authenticateToken, controlador)
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.',
      });
      return;
    }

    // Verificar y decodificar token
    const decoded = verifyToken(token);

    // Agregar usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para verificar rol específico
 * Uso: app.get('/admin', authenticateToken, requireRole('administrador'), controlador)
 *
 * Nota: super_admin siempre tiene acceso a todo
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    // Super admin tiene acceso a todo
    if (req.user.rol === 'super_admin') {
      next();
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario es super_admin
 * Uso: app.put('/usuarios/:id/rol', authenticateToken, requireSuperAdmin, controlador)
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
    return;
  }

  if (req.user.rol !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Esta operación requiere permisos de Super Administrador',
    });
    return;
  }

  next();
};

/**
 * Middleware para verificar que el usuario está activo
 */
export const requireActiveAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    // Aquí puedes agregar verificación adicional de estado de cuenta
    // Por ejemplo, consultar la BD para verificar que la cuenta sigue activa

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado de cuenta',
    });
  }
};

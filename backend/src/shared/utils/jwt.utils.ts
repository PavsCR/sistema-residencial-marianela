/**
 * UTILIDADES JWT (JSON Web Tokens)
 *
 * Funciones para crear y verificar tokens de autenticación
 */

import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Payload del JWT
 */
export interface JwtPayload {
  idUsuario: number;
  correo: string;
  rol: string;
}

/**
 * Generar un token JWT
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as any);
};

/**
 * Verificar y decodificar un token JWT
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Decodificar token sin verificar (útil para debugging, NO usar en producción)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};

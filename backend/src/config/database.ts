/**
 * CONFIGURACIÓN DE BASE DE DATOS
 *
 * Este archivo configura el pool de conexiones a PostgreSQL.
 *
 * ¿Qué es un Pool?
 * Un pool es un conjunto de conexiones a la base de datos que se mantienen abiertas
 * y se reutilizan. Esto es más eficiente que crear una nueva conexión cada vez.
 *
 * Ventajas del Pool:
 * - Mejor rendimiento (no hay que crear conexión cada vez)
 * - Maneja múltiples peticiones simultáneas
 * - Reconexión automática si se pierde la conexión
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración del Pool de Conexiones
 */
const pool = new Pool({
  // Host: La dirección del servidor de base de datos (en tu caso, AWS RDS)
  host: process.env.DB_HOST,

  // Port: Puerto de PostgreSQL (por defecto 5432)
  port: parseInt(process.env.DB_PORT || '5432'),

  // Database: Nombre de la base de datos
  database: process.env.DB_NAME,

  // User: Usuario de PostgreSQL
  user: process.env.DB_USER,

  // Password: Contraseña del usuario
  password: process.env.DB_PASSWORD,

  // Max: Número máximo de conexiones simultáneas en el pool
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),

  // IdleTimeoutMillis: Tiempo que una conexión puede estar inactiva antes de cerrarse (30 segundos)
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),

  // ConnectionTimeoutMillis: Tiempo máximo de espera para obtener una conexión (2 segundos)
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),

  // SSL: Necesario para bases de datos en la nube (Aiven, etc.)
  ssl: process.env.DB_HOST?.includes('aivencloud.com') ? {
    rejectUnauthorized: false // Permite certificados autofirmados
  } : false
});

/**
 * Evento: Cuando se conecta exitosamente
 */
pool.on('connect', () => {
  console.log('✅ Conexión a PostgreSQL establecida');
});

/**
 * Evento: Si hay un error en la conexión
 */
pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  // En producción, aquí podrías enviar notificación a un sistema de alertas
});

/**
 * Función para probar la conexión
 * Esta función se ejecuta al iniciar el servidor para verificar que todo esté bien
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    // Ejecutar una consulta simple para probar
    const result = await pool.query('SELECT NOW() as current_time, version() as version');

    console.log('🔗 Base de datos conectada correctamente');
    console.log(`⏰ Hora del servidor DB: ${result.rows[0].current_time}`);
    console.log(`📊 Versión de PostgreSQL: ${result.rows[0].version.split(',')[0]}`);

    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
};

/**
 * Función helper para ejecutar queries con manejo de errores
 *
 * @param text - La consulta SQL a ejecutar
 * @param params - Los parámetros para la consulta (previene SQL injection)
 * @returns El resultado de la consulta
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Query ejecutada en ${duration}ms`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error en query:', error);
    throw error;
  }
};

/**
 * Función para obtener un cliente del pool para transacciones
 *
 * Usar cuando necesites ejecutar múltiples queries que deben ser atómicas
 * (todas se ejecutan o ninguna)
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Función para cerrar el pool (útil para tests o al cerrar la aplicación)
 */
export const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool de conexiones cerrado');
};

// Exportar el pool por si se necesita acceso directo
export default pool;

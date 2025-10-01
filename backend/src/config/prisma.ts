/**
 * CLIENTE DE PRISMA
 *
 * Este archivo configura una instancia única de Prisma Client para toda la aplicación.
 * Usa el patrón Singleton para evitar crear múltiples conexiones.
 */

import { PrismaClient } from '@prisma/client';

// Declaración global para TypeScript en desarrollo (evita múltiples instancias en hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Instancia única de Prisma Client
 * En desarrollo: Reutiliza la instancia global para evitar múltiples conexiones en hot-reload
 * En producción: Crea una nueva instancia
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn'] // Logs detallados en desarrollo
      : ['error'], // Solo errores en producción
  });

// En desarrollo, guarda la instancia globalmente
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Función para probar la conexión a la base de datos
 */
export const testPrismaConnection = async (): Promise<boolean> => {
  try {
    // Probar una query simple (Prisma conecta automáticamente)
    const resultado = await prisma.$queryRaw<Array<{ now: Date; version: string }>>`
      SELECT NOW() as now, VERSION() as version
    `;

    console.log('✅ Prisma conectado exitosamente a PostgreSQL');
    console.log(`⏰ Hora del servidor DB: ${resultado[0].now}`);
    console.log(`📊 Versión de PostgreSQL: ${resultado[0].version.split(',')[0]}`);

    return true;
  } catch (error) {
    console.error('❌ Error al conectar Prisma:', error);
    return false;
  }
};

/**
 * Función para desconectar Prisma (útil para tests o cierre de aplicación)
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  console.log('🔌 Prisma desconectado');
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});

export default prisma;

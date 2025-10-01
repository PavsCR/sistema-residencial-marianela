/**
 * SEED DE BASE DE DATOS
 *
 * Este script inserta datos iniciales en la base de datos:
 * - Roles predeterminados (administrador, vecino)
 * - Usuario administrador por defecto (opcional)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // ============================================
  // 1. CREAR ROLES PREDETERMINADOS
  // ============================================
  console.log('📋 Creando roles...');

  const rolSuperAdmin = await prisma.rol.upsert({
    where: { nombreRol: 'super_admin' },
    update: {},
    create: {
      nombreRol: 'super_admin',
      descripcion: 'Super Administrador con permisos absolutos, puede modificar roles sin aprobación',
    },
  });

  const rolAdministrador = await prisma.rol.upsert({
    where: { nombreRol: 'administrador' },
    update: {},
    create: {
      nombreRol: 'administrador',
      descripcion: 'Administrador del sistema con acceso completo a todas las funcionalidades',
    },
  });

  const rolVecino = await prisma.rol.upsert({
    where: { nombreRol: 'vecino' },
    update: {},
    create: {
      nombreRol: 'vecino',
      descripcion: 'Vecino residente con acceso a funcionalidades básicas del sistema',
    },
  });

  console.log('✅ Roles creados:');
  console.log(`   - ${rolSuperAdmin.nombreRol} (ID: ${rolSuperAdmin.idRol})`);
  console.log(`   - ${rolAdministrador.nombreRol} (ID: ${rolAdministrador.idRol})`);
  console.log(`   - ${rolVecino.nombreRol} (ID: ${rolVecino.idRol})\n`);

  // ============================================
  // 2. CREAR USUARIO SUPER ADMIN (OBLIGATORIO)
  // ============================================
  console.log('👑 Verificando usuario Super Admin...');

  // Contraseña por defecto (debería cambiarse en primera instalación)
  const contrasenaHash = await bcrypt.hash('SuperAdmin2025!', 12);

  const superAdminUsuario = await prisma.usuario.upsert({
    where: { correoElectronico: 'superadmin@residencialmarianela.com' },
    update: {}, // Si ya existe, no hacer nada
    create: {
      nombreCompleto: 'Super Administrador',
      correoElectronico: 'superadmin@residencialmarianela.com',
      contrasenaHash: contrasenaHash,
      idRol: rolSuperAdmin.idRol,
      estadoCuenta: 'activo',
      fechaAprobacion: new Date(),
    },
  });

  console.log('✅ Usuario Super Admin verificado:');
  console.log(`   - Email: ${superAdminUsuario.correoElectronico}`);
  console.log(`   - Contraseña: SuperAdmin2025!`);
  console.log(`   - ⚠️  CAMBIAR CONTRASEÑA EN PRODUCCIÓN!\n`);

  console.log('✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

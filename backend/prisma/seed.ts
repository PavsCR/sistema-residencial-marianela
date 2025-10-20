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
  console.log('Iniciando seed de la base de datos...\n');

  // ============================================
  // 1. CREAR ROLES PREDETERMINADOS
  // ============================================
  console.log('Creando roles...');

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

  console.log('Roles creados:');
  console.log(`   - ${rolSuperAdmin.nombreRol} (ID: ${rolSuperAdmin.idRol})`);
  console.log(`   - ${rolAdministrador.nombreRol} (ID: ${rolAdministrador.idRol})`);
  console.log(`   - ${rolVecino.nombreRol} (ID: ${rolVecino.idRol})\n`);

  // ============================================
  // 2. CREAR CASAS DEL RESIDENCIAL (0-120)
  // ============================================
  console.log('Creando casas del residencial...');

  const casasExistentes = await prisma.casa.count();

  if (casasExistentes === 0) {
    const casasData = [];
    // Casa 0 para casos especiales (admins que no viven en el residencial)
    casasData.push({
      numeroCasa: '0',
      estadoPago: 'al_dia',
    });

    // Casas 1-120
    for (let i = 1; i <= 120; i++) {
      casasData.push({
        numeroCasa: i.toString(),
        estadoPago: 'al_dia',
      });
    }

    await prisma.casa.createMany({
      data: casasData,
      skipDuplicates: true,
    });

    console.log('121 casas creadas (0-120)\n');
  } else {
    // Verificar si existe casa 0
    const casa0 = await prisma.casa.findFirst({
      where: { numeroCasa: '0' },
    });

    if (!casa0) {
      await prisma.casa.create({
        data: {
          numeroCasa: '0',
          estadoPago: 'al_dia',
        },
      });
      console.log('Casa 0 creada para casos especiales\n');
    } else {
      console.log(`Ya existen ${casasExistentes} casas en la base de datos\n`);
    }
  }

  // ============================================
  // 3. CREAR USUARIO SUPER ADMIN (OBLIGATORIO)
  // ============================================
  console.log('Verificando usuario Super Admin...');

  // Obtener la casa 100
  const casa100 = await prisma.casa.findFirst({
    where: { numeroCasa: '100' },
  });

  // Contraseña por defecto (debería cambiarse en primera instalación)
  const contrasenaHash = await bcrypt.hash('SuperAdmin2025!', 12);

  const superAdminUsuario = await prisma.usuario.upsert({
    where: { correoElectronico: 'superadmin@residencialmarianela.com' },
    update: {
      idCasa: casa100?.idCasa,
    },
    create: {
      nombreCompleto: 'Super Administrador',
      correoElectronico: 'superadmin@residencialmarianela.com',
      contrasenaHash: contrasenaHash,
      idRol: rolSuperAdmin.idRol,
      idCasa: casa100?.idCasa,
      estadoCuenta: 'activo',
      fechaAprobacion: new Date(),
    },
  });

  console.log('Usuario Super Admin verificado:');
  console.log(`   - Email: ${superAdminUsuario.correoElectronico}`);
  console.log(`   - Casa: ${casa100?.numeroCasa || 'No asignada'}`);
  console.log(`   - Contraseña: SuperAdmin2025!`);
  console.log(`   - ⚠️  CAMBIAR CONTRASEÑA EN PRODUCCIÓN!\n`);

  console.log('Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

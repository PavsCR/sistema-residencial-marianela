/**
 * SEED PEQUEÑO PARA DEMOSTRACIÓN
 * Datos mínimos para mostrar funcionalidades
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed pequeño...\n');

  const passwordHash = await bcrypt.hash('password123', 10);
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin2025!', 12);

  // ============================================
  // 1. ROLES
  // ============================================
  console.log('👥 Creando roles...');
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombreRol: 'vecino' },
      update: {},
      create: { nombreRol: 'vecino', descripcion: 'Vecino del residencial' }
    }),
    prisma.rol.upsert({
      where: { nombreRol: 'administrador' },
      update: {},
      create: { nombreRol: 'administrador', descripcion: 'Administrador' }
    }),
    prisma.rol.upsert({
      where: { nombreRol: 'super_admin' },
      update: {},
      create: { nombreRol: 'super_admin', descripcion: 'Super administrador' }
    })
  ]);
  console.log(`✅ 3 roles creados\n`);

  // ============================================
  // 2. CASAS (solo 20 para demo)
  // ============================================
  console.log('🏠 Creando casas...');
  const casasCount = await prisma.casa.count();

  if (casasCount === 0) {
    const casasData = [{ numeroCasa: '0', estadoPago: 'al_dia' }];
    for (let i = 1; i <= 20; i++) {
      const estados = ['al_dia', 'moroso', 'en_arreglo'];
      const estado = i <= 15 ? 'al_dia' : estados[Math.floor(Math.random() * estados.length)];
      casasData.push({ numeroCasa: i.toString(), estadoPago: estado });
    }
    await prisma.casa.createMany({ data: casasData });
    console.log('✅ 21 casas creadas (0-20)\n');
  }

  const casas = await prisma.casa.findMany({ orderBy: { numeroCasa: 'asc' } });

  // ============================================
  // 3. USUARIOS (pocos)
  // ============================================
  console.log('👤 Creando usuarios...');

  // Super Admin
  await prisma.usuario.upsert({
    where: { correoElectronico: 'superadmin@residencialmarianela.com' },
    update: {
      contrasenaHash: superAdminPasswordHash
    },
    create: {
      nombreCompleto: 'Super Administrador',
      correoElectronico: 'superadmin@residencialmarianela.com',
      telefono: '8888-8888',
      contrasenaHash: superAdminPasswordHash,
      idRol: roles[2].idRol,
      idCasa: casas[0].idCasa,
      estadoCuenta: 'activo',
      fechaAprobacion: new Date()
    }
  });

  // 2 Administradores
  await prisma.usuario.upsert({
    where: { correoElectronico: 'admin1@residencial.com' },
    update: {},
    create: {
      nombreCompleto: 'María González',
      correoElectronico: 'admin1@residencial.com',
      telefono: '8000-0001',
      contrasenaHash: passwordHash,
      idRol: roles[1].idRol,
      idCasa: casas[1].idCasa,
      estadoCuenta: 'activo',
      fechaAprobacion: new Date()
    }
  });

  await prisma.usuario.upsert({
    where: { correoElectronico: 'admin2@residencial.com' },
    update: {},
    create: {
      nombreCompleto: 'Carlos Rodríguez',
      correoElectronico: 'admin2@residencial.com',
      telefono: '8000-0002',
      contrasenaHash: passwordHash,
      idRol: roles[1].idRol,
      idCasa: casas[2].idCasa,
      estadoCuenta: 'activo',
      fechaAprobacion: new Date()
    }
  });

  // 8 Vecinos
  const vecinos = ['Juan Pérez', 'Ana Martínez', 'Luis Hernández', 'Carmen López', 'Pedro Sánchez', 'Laura Ramírez', 'Jorge Torres', 'Isabel Flores'];
  for (let i = 0; i < vecinos.length; i++) {
    await prisma.usuario.upsert({
      where: { correoElectronico: `vecino${i + 1}@residencial.com` },
      update: {},
      create: {
        nombreCompleto: vecinos[i],
        correoElectronico: `vecino${i + 1}@residencial.com`,
        telefono: `7000-000${i + 1}`,
        contrasenaHash: passwordHash,
        idRol: roles[0].idRol,
        idCasa: casas[i + 3].idCasa,
        estadoCuenta: i < 6 ? 'activo' : 'pendiente',
        fechaAprobacion: i < 6 ? new Date() : null
      }
    });
  }

  console.log('✅ 11 usuarios creados (1 super admin, 2 admins, 8 vecinos)\n');

  // ============================================
  // 4. CATEGORÍAS (solo las principales)
  // ============================================
  console.log('💰 Creando categorías...');
  const categorias = await Promise.all([
    prisma.categoriaFinanciera.upsert({
      where: { nombre: 'Cuota Mensual' },
      update: {},
      create: { nombre: 'Cuota Mensual', descripcion: 'Pagos mensuales' }
    }),
    prisma.categoriaFinanciera.upsert({
      where: { nombre: 'Mantenimiento' },
      update: {},
      create: { nombre: 'Mantenimiento', descripcion: 'Gastos de mantenimiento' }
    }),
    prisma.categoriaFinanciera.upsert({
      where: { nombre: 'Seguridad' },
      update: {},
      create: { nombre: 'Seguridad', descripcion: 'Seguridad y vigilancia' }
    }),
    prisma.categoriaFinanciera.upsert({
      where: { nombre: 'Servicios Públicos' },
      update: {},
      create: { nombre: 'Servicios Públicos', descripcion: 'Agua, luz, internet' }
    }),
    prisma.categoriaFinanciera.upsert({
      where: { nombre: 'Jardinería' },
      update: {},
      create: { nombre: 'Jardinería', descripcion: 'Áreas verdes' }
    }),
    prisma.categoriaFinanciera.upsert({
      where: { nombre: 'Eventos' },
      update: {},
      create: { nombre: 'Eventos', descripcion: 'Eventos comunitarios' }
    })
  ]);
  console.log(`✅ 6 categorías creadas\n`);

  // ============================================
  // 5. PAGOS (solo últimos 2 meses, 10 casas)
  // ============================================
  console.log('💳 Creando pagos...');
  const metodos = ['transferencia', 'sinpe', 'deposito', 'efectivo'];
  const montoCuota = 25000;
  let pagosCount = 0;

  for (let mes = 0; mes < 2; mes++) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - mes);
    fecha.setDate(15);

    for (let i = 1; i <= 10; i++) {
      const estado = Math.random() < 0.7 ? 'aprobado' : (Math.random() < 0.5 ? 'pendiente' : 'rechazado');
      const metodo = metodos[Math.floor(Math.random() * metodos.length)];

      await prisma.pago.create({
        data: {
          idCasa: casas[i].idCasa,
          monto: montoCuota,
          descripcion: `Cuota ${fecha.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}`,
          fechaPago: fecha,
          metodoPago: metodo,
          comprobante: estado !== 'pendiente' ? `COMP-${i}-${mes}` : null,
          estado
        }
      });
      pagosCount++;
    }
  }
  console.log(`✅ ${pagosCount} pagos creados\n`);

  // ============================================
  // 6. MOVIMIENTOS (30 total)
  // ============================================
  console.log('📊 Creando movimientos...');

  // Ingresos de pagos aprobados
  const pagosAprobados = await prisma.pago.findMany({
    where: { estado: 'aprobado' },
    include: { casa: true }
  });

  for (const pago of pagosAprobados) {
    const existe = await prisma.movimientoFinanciero.findUnique({
      where: { idPago: pago.idPago }
    });

    if (!existe) {
      await prisma.movimientoFinanciero.create({
        data: {
          tipo: 'ingreso',
          idCategoria: categorias[0].idCategoria,
          detalles: `${pago.descripcion} - Casa ${pago.casa.numeroCasa}`,
          monto: pago.monto,
          fecha: pago.fechaPago,
          idPago: pago.idPago
        }
      });
    }
  }

  // Gastos (10 diferentes)
  const gastos = [
    { cat: 1, det: 'Pintura de portón', monto: 80000, fecha: -5 },
    { cat: 2, det: 'Pago mensual seguridad', monto: 250000, fecha: -2 },
    { cat: 2, det: 'Reparación cámaras', monto: 120000, fecha: -15 },
    { cat: 3, det: 'Electricidad áreas comunes', monto: 45000, fecha: -3 },
    { cat: 3, det: 'Agua áreas comunes', monto: 25000, fecha: -3 },
    { cat: 4, det: 'Mantenimiento jardines', monto: 60000, fecha: -10 },
    { cat: 4, det: 'Plantas nuevas', monto: 30000, fecha: -20 },
    { cat: 1, det: 'Herramientas mantenimiento', monto: 35000, fecha: -8 },
    { cat: 5, det: 'Fiesta fin de año', monto: 150000, fecha: -25 },
    { cat: 2, det: 'Nuevo sistema alarma', monto: 180000, fecha: -30 }
  ];

  for (const gasto of gastos) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + gasto.fecha);

    await prisma.movimientoFinanciero.create({
      data: {
        tipo: 'gasto',
        idCategoria: categorias[gasto.cat].idCategoria,
        detalles: gasto.det,
        monto: gasto.monto,
        fecha
      }
    });
  }

  const movimientos = await prisma.movimientoFinanciero.count();
  console.log(`✅ ${movimientos} movimientos creados\n`);

  // ============================================
  // 7. SOLICITUDES (5 de cada tipo)
  // ============================================
  console.log('📝 Creando solicitudes...');

  // Solicitudes de Registro
  for (let i = 0; i < 5; i++) {
    await prisma.solicitudRegistro.create({
      data: {
        nombreCompleto: `Nuevo Vecino ${i + 1}`,
        correoElectronico: `nuevo${i + 1}@residencial.com`,
        telefono: `5000-000${i + 1}`,
        numeroCasa: (11 + i).toString(),
        contrasenaHash: passwordHash,
        estado: 'pendiente'
      }
    });
  }

  // Solicitudes de Edición de Info
  const usuariosActivos = await prisma.usuario.findMany({
    where: { estadoCuenta: 'activo', idRol: roles[0].idRol },
    take: 3
  });

  for (let i = 0; i < 3; i++) {
    if (usuariosActivos[i]) {
      await prisma.solicitudEdicionInfo.create({
        data: {
          idUsuario: usuariosActivos[i].idUsuario,
          nombreCompletoActual: usuariosActivos[i].nombreCompleto,
          nombreCompletoNuevo: `${usuariosActivos[i].nombreCompleto} (Actualizado)`,
          correoActual: usuariosActivos[i].correoElectronico,
          correoNuevo: null,
          telefonoActual: usuariosActivos[i].telefono,
          telefonoNuevo: `7777-777${i}`,
          estado: 'pendiente'
        }
      });
    }
  }

  // Solicitudes de Cambio (datos genéricos)
  for (let i = 0; i < 2; i++) {
    if (usuariosActivos[i]) {
      await prisma.solicitudCambio.create({
        data: {
          idUsuario: usuariosActivos[i].idUsuario,
          datosOriginales: { info: 'datos antiguos' },
          datosNuevos: { info: 'datos nuevos' },
          motivo: `Solicitud de cambio ${i + 1}`,
          estado: 'pendiente'
        }
      });
    }
  }

  console.log('✅ Solicitudes creadas\n');

  // ============================================
  // RESUMEN
  // ============================================
  console.log('✨ Seed pequeño completado!\n');
  console.log('📊 Datos creados:');
  console.log('   - 3 roles');
  console.log('   - 21 casas');
  console.log('   - 11 usuarios');
  console.log('   - 6 categorías');
  console.log(`   - ${pagosCount} pagos`);
  console.log(`   - ${movimientos} movimientos`);
  console.log('   - 10 solicitudes\n');

  console.log('🔑 Credenciales:');
  console.log('   Super Admin: superadmin@residencialmarianela.com / SuperAdmin2025!');
  console.log('   Admin 1: admin1@residencial.com / password123');
  console.log('   Vecino 1: vecino1@residencial.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

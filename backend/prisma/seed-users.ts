import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👥 Agregando usuarios de prueba...');

  try {
    // Get the "vecino" role
    const vecinoRole = await prisma.rol.findUnique({
      where: { nombreRol: 'vecino' }
    });

    if (!vecinoRole) {
      console.log('❌ Rol "vecino" no encontrado');
      return;
    }

    // Get some houses
    const casas = await prisma.casa.findMany({
      where: {
        numeroCasa: {
          in: ['1', '2', '3', '5', '8', '10', '15', '20', '25', '30']
        }
      }
    });

    if (casas.length === 0) {
      console.log('❌ No se encontraron casas');
      return;
    }

    // Hash password for all test users
    const defaultPassword = await bcrypt.hash('Vecino2025!', 10);

    // Create test users
    const testUsers = [
      {
        nombreCompleto: 'María González Rodríguez',
        correoElectronico: 'maria.gonzalez@email.com',
        telefono: '8888-1111',
        numeroCasa: '1'
      },
      {
        nombreCompleto: 'Carlos Ramírez Mora',
        correoElectronico: 'carlos.ramirez@email.com',
        telefono: '8888-2222',
        numeroCasa: '2'
      },
      {
        nombreCompleto: 'Ana Patricia Vargas',
        correoElectronico: 'ana.vargas@email.com',
        telefono: '8888-3333',
        numeroCasa: '3'
      },
      {
        nombreCompleto: 'José Luis Hernández',
        correoElectronico: 'jose.hernandez@email.com',
        telefono: '8888-4444',
        numeroCasa: '5'
      },
      {
        nombreCompleto: 'Laura Jiménez Castro',
        correoElectronico: 'laura.jimenez@email.com',
        telefono: '8888-5555',
        numeroCasa: '8'
      },
      {
        nombreCompleto: 'Roberto Solís Pérez',
        correoElectronico: 'roberto.solis@email.com',
        telefono: '8888-6666',
        numeroCasa: '10'
      },
      {
        nombreCompleto: 'Sofía Méndez Rojas',
        correoElectronico: 'sofia.mendez@email.com',
        telefono: '8888-7777',
        numeroCasa: '15'
      },
      {
        nombreCompleto: 'Diego Alvarado Sánchez',
        correoElectronico: 'diego.alvarado@email.com',
        telefono: '8888-8888',
        numeroCasa: '20'
      },
      {
        nombreCompleto: 'Patricia Cordero Vega',
        correoElectronico: 'patricia.cordero@email.com',
        telefono: '8888-9999',
        numeroCasa: '25'
      },
      {
        nombreCompleto: 'Fernando Chacón Díaz',
        correoElectronico: 'fernando.chacon@email.com',
        telefono: '8888-0000',
        numeroCasa: '30'
      }
    ];

    let createdCount = 0;

    for (const userData of testUsers) {
      // Find the casa
      const casa = casas.find(c => c.numeroCasa === userData.numeroCasa);
      
      if (!casa) {
        console.log(`⚠️  Casa ${userData.numeroCasa} no encontrada, saltando usuario ${userData.nombreCompleto}`);
        continue;
      }

      // Check if user already exists
      const existingUser = await prisma.usuario.findUnique({
        where: { correoElectronico: userData.correoElectronico }
      });

      if (existingUser) {
        console.log(`⚠️  Usuario ${userData.correoElectronico} ya existe, saltando...`);
        continue;
      }

      // Create the user
      await prisma.usuario.create({
        data: {
          nombreCompleto: userData.nombreCompleto,
          correoElectronico: userData.correoElectronico,
          telefono: userData.telefono,
          contrasenaHash: defaultPassword,
          idRol: vecinoRole.idRol,
          idCasa: casa.idCasa,
          estadoCuenta: 'activo',
          fechaAprobacion: new Date()
        }
      });

      createdCount++;
      console.log(`✅ Usuario creado: ${userData.nombreCompleto} - Casa ${userData.numeroCasa}`);
    }

    console.log(`\n✅ ${createdCount} usuarios de prueba creados exitosamente`);
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Contraseña para todos: Vecino2025!');
    console.log('\n👥 Usuarios creados:');
    testUsers.forEach(user => {
      console.log(`   - ${user.correoElectronico} (Casa ${user.numeroCasa})`);
    });

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();

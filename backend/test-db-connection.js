/**
 * SCRIPT DE DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS
 *
 * Este script prueba diferentes configuraciones para conectarse a AWS RDS
 * y te ayuda a identificar qué está bloqueando la conexión.
 */

const { Client } = require('pg');
require('dotenv').config();

console.log('\n' + '='.repeat(60));
console.log('🔍 DIAGNÓSTICO DE CONEXIÓN AWS RDS');
console.log('='.repeat(60) + '\n');

// Mostrar configuración (sin mostrar la contraseña completa)
console.log('📋 Configuración actual:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Puerto: ${process.env.DB_PORT}`);
console.log(`   Base de datos: ${process.env.DB_NAME}`);
console.log(`   Usuario: ${process.env.DB_USER}`);
console.log(`   Contraseña: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NO CONFIGURADA'}`);
console.log('\n');

// Configuraciones a probar
const configs = [
  {
    name: 'Configuración 1: SSL con rejectUnauthorized: false',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000,
    }
  },
  {
    name: 'Configuración 2: SSL true (simple)',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: true,
      connectionTimeoutMillis: 5000,
    }
  },
  {
    name: 'Configuración 3: Sin SSL',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
      connectionTimeoutMillis: 5000,
    }
  }
];

// Función para probar una configuración
async function testConfig(name, config) {
  console.log(`\n🧪 Probando: ${name}`);
  console.log('─'.repeat(60));

  const client = new Client(config);

  try {
    console.log('   ⏳ Conectando...');
    await client.connect();
    console.log('   ✅ ¡CONEXIÓN EXITOSA!');

    // Probar una query simple
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('   ✅ Query ejecutada correctamente');
    console.log(`   📊 Base de datos: ${result.rows[0].current_database}`);
    console.log(`   👤 Usuario: ${result.rows[0].current_user}`);
    console.log(`   📦 Versión PostgreSQL: ${result.rows[0].version.split(',')[0]}`);

    await client.end();
    return true;
  } catch (error) {
    console.log('   ❌ Error al conectar');
    console.log(`   📝 Tipo de error: ${error.code || 'UNKNOWN'}`);
    console.log(`   💬 Mensaje: ${error.message}`);

    // Diagnóstico específico según el error
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  El servidor rechazó la conexión');
      console.log('   💡 Posibles causas:');
      console.log('      - El host o puerto son incorrectos');
      console.log('      - El servidor PostgreSQL no está ejecutándose');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.log('   ⚠️  Timeout de conexión');
      console.log('   💡 Posibles causas:');
      console.log('      - Security Group de AWS no permite tu IP');
      console.log('      - Firewall bloqueando el puerto 5432');
      console.log('      - La instancia RDS está pausada o inaccesible');
    } else if (error.code === '28P01') {
      console.log('   ⚠️  Autenticación fallida');
      console.log('   💡 Verifica usuario y contraseña');
    } else if (error.code === '3D000') {
      console.log('   ⚠️  Base de datos no existe');
      console.log('   💡 Verifica el nombre de la base de datos');
    }

    try {
      await client.end();
    } catch (e) {
      // Ignorar errores al cerrar
    }
    return false;
  }
}

// Ejecutar pruebas
async function runDiagnostics() {
  let successCount = 0;

  for (const { name, config } of configs) {
    const success = await testConfig(name, config);
    if (success) {
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('='.repeat(60));
  console.log(`Pruebas exitosas: ${successCount}/${configs.length}\n`);

  if (successCount === 0) {
    console.log('❌ No se pudo conectar con ninguna configuración\n');
    console.log('🔧 PASOS RECOMENDADOS:');
    console.log('1. Verifica que la instancia RDS esté activa en AWS Console');
    console.log('2. Verifica el Security Group:');
    console.log('   - Ve a AWS Console → RDS → Tu instancia');
    console.log('   - Click en la pestaña "Connectivity & security"');
    console.log('   - Click en el Security Group');
    console.log('   - Agrega una regla Inbound:');
    console.log('     * Type: PostgreSQL');
    console.log('     * Port: 5432');
    console.log('     * Source: 0.0.0.0/0 (para pruebas) o tu IP específica');
    console.log('3. Verifica que "Publicly accessible" esté en "Yes"');
    console.log('4. Espera 1-2 minutos después de cambiar el Security Group\n');
  } else if (successCount < configs.length) {
    console.log('⚠️  Algunas configuraciones funcionaron\n');
    console.log('💡 Usa la configuración que funcionó en tu archivo database.ts\n');
  } else {
    console.log('✅ ¡Todas las configuraciones funcionaron!\n');
    console.log('💡 Tu base de datos está configurada correctamente\n');
  }
}

// Ejecutar
runDiagnostics().catch(error => {
  console.error('\n❌ Error crítico:', error);
  process.exit(1);
});

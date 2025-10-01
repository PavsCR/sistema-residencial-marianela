const http = require('http');

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`${method} ${path}`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(responseData);
          console.log('Response:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log('Response:', responseData);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    if (data) req.write(data);
    req.end();
  });
}

async function testAuth() {
  console.log('\n🧪 Probando sistema de autenticación...\n');

  // Test 1: Login con super admin
  console.log('Test 1: Login con super admin');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    correoElectronico: 'superadmin@residencialmarianela.com',
    contrasena: 'SuperAdmin2025!'
  });

  // Test 2: Registro de nuevo usuario (con timestamp para hacerlo único)
  const timestamp = Date.now();
  const testEmail = `usuario${timestamp}@example.com`;
  console.log('\nTest 2: Registro de nuevo usuario');
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    nombreCompleto: 'Usuario Test',
    correoElectronico: testEmail,
    contrasena: 'Password123!'
  });

  // Test 3: Intentar registrar el mismo usuario otra vez
  console.log('\nTest 3: Intentar registrar usuario duplicado');
  await makeRequest('POST', '/api/auth/register', {
    nombreCompleto: 'Usuario Test',
    correoElectronico: testEmail,
    contrasena: 'Password123!'
  });

  // Test 4: Login inválido
  console.log('\nTest 4: Login con credenciales incorrectas');
  await makeRequest('POST', '/api/auth/login', {
    correoElectronico: 'noexiste@example.com',
    contrasena: 'wrongpassword'
  });

  // Test 5: Intentar login con usuario pendiente (el que acabamos de registrar)
  if (registerResult && registerResult.user) {
    console.log('\nTest 5: Intentar login con cuenta pendiente de aprobación');
    await makeRequest('POST', '/api/auth/login', {
      correoElectronico: testEmail,
      contrasena: 'Password123!'
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Pruebas completadas\n');
}

testAuth().catch(console.error);

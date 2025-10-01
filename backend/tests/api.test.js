const http = require('http');

function testAPI(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log(`\n=== ${method} ${path} ===`);
        console.log('Status:', res.statusCode);
        try {
          console.log('Response:', JSON.parse(responseData));
        } catch (e) {
          console.log('Response:', responseData);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Health check
    await testAPI('GET', '/health', {});

    // Test 2: Login with super admin
    await testAPI('POST', '/api/auth/login', {
      correoElectronico: 'superadmin@residencialmarianela.com',
      contrasena: 'SuperAdmin2025!'
    });

    // Test 3: Registration
    await testAPI('POST', '/api/auth/registro', {
      nombreCompleto: 'Juan Perez',
      correoElectronico: 'juan@example.com',
      contrasena: 'Password123!'
    });

    // Test 4: Invalid login
    await testAPI('POST', '/api/auth/login', {
      correoElectronico: 'noexiste@example.com',
      contrasena: 'wrongpassword'
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();

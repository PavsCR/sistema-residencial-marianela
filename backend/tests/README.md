# Tests del Backend

Este directorio contiene las pruebas del sistema.

## Ejecutar tests

```bash
# Ejecutar todos los tests de autenticación
npm test
# o
npm run test:auth

# Ejecutar tests de API general
npm run test:api
```

## Archivos de test

- `auth.test.js` - Pruebas del sistema de autenticación (login, registro)
- `api.test.js` - Pruebas generales de la API

## Notas

- Asegúrate de que el servidor esté corriendo en el puerto 3001 antes de ejecutar los tests
- Los tests de registro usan timestamps para generar correos únicos, por lo que se pueden ejecutar múltiples veces sin conflictos

# 📊 Guía de Pruebas del Sistema de Reportes

## 🎯 Objetivo
Verificar que el sistema de reportes personalizados funcione correctamente con filtros, visualización y descarga de datos.

## ✅ Pre-requisitos
1. Backend corriendo en `http://localhost:3001`
2. Frontend corriendo (usualmente en `http://localhost:5173`)
3. Usuario con credenciales válidas (administrador o super_admin)

## 📝 Casos de Prueba

### 🏠 Prueba 1: Reporte de Casas

**Pasos:**
1. Navegar a la sección "Reportes" en el menú principal
2. Hacer clic en el botón "🏠 Casas"
3. (Opcional) Seleccionar un filtro de "Estado de Pago": Al día / Moroso / En arreglo
4. Hacer clic en "📊 Generar Reporte"

**Resultado Esperado:**
- ✅ Se muestra una tabla con todas las casas del residencial
- ✅ Cada fila muestra: Número de casa, Estado de pago, Cantidad de usuarios, Últimos pagos
- ✅ Los totales muestran:
  - Total de casas
  - Casas al día (badge verde)
  - Casas morosas (badge rojo)
  - Casas con usuarios

**Validaciones:**
- [ ] Los badges de estado tienen colores correctos (verde=al día, rojo=moroso, azul=en arreglo)
- [ ] Los números coinciden con los datos reales
- [ ] El filtro funciona correctamente
- [ ] El botón "Descargar Excel" genera un archivo CSV

---

### 👥 Prueba 2: Reporte de Usuarios

**Pasos:**
1. Hacer clic en el botón "👥 Usuarios"
2. Aplicar filtros opcionales:
   - Estado de Cuenta: Activo / Pendiente / Suspendido
   - Rol: Vecino / Administrador / Super Admin
   - Número de Casa: Ej. "A-1"
3. Hacer clic en "📊 Generar Reporte"

**Resultado Esperado:**
- ✅ Tabla con: Nombre, Correo, Casa, Rol, Estado, Fecha Registro
- ✅ Totales muestran:
  - Total de usuarios
  - Usuarios activos (verde)
  - Usuarios pendientes (amarillo)
  - Usuarios suspendidos (rojo)

**Validaciones:**
- [ ] Los filtros se aplican correctamente
- [ ] Los badges de estado tienen colores correctos
- [ ] Las fechas se muestran en formato legible (español)
- [ ] El botón "Limpiar" resetea todos los filtros

---

### 💰 Prueba 3: Reporte de Pagos

**Pasos:**
1. Hacer clic en el botón "💰 Pagos"
2. Configurar filtros:
   - Fecha Inicio: Seleccionar fecha
   - Fecha Fin: Seleccionar fecha
   - Número de Casa: Opcional
   - Estado: Pendiente / Aprobado / Rechazado
   - Método de Pago: Efectivo / Transferencia / Tarjeta
3. Hacer clic en "📊 Generar Reporte"

**Resultado Esperado:**
- ✅ Tabla con: Casa, Monto (₡), Descripción, Fecha, Método, Estado
- ✅ Totales muestran:
  - Total de pagos
  - Monto total en colones (₡)
  - Pagos aprobados
  - Pagos pendientes

**Validaciones:**
- [ ] Los montos se muestran en formato de moneda costarricense (₡)
- [ ] El filtro de fechas funciona correctamente
- [ ] Los estados tienen badges con colores (verde=aprobado, amarillo=pendiente, rojo=rechazado)
- [ ] El descargable Excel incluye todos los campos

---

### 💸 Prueba 4: Reporte de Movimientos Financieros

**Pasos:**
1. Hacer clic en el botón "💸 Movimientos Financieros"
2. Aplicar filtros:
   - Fecha Inicio y Fecha Fin
   - Tipo: Ingreso / Gasto
   - Categoría: Seleccionar de la lista (se cargan dinámicamente)
3. Hacer clic en "📊 Generar Reporte"

**Resultado Esperado:**
- ✅ Tabla con: Tipo, Categoría, Detalles, Monto, Fecha
- ✅ Totales muestran:
  - Total Ingresos (verde, positivo)
  - Total Gastos (rojo, negativo)
  - Balance (azul, positivo o negativo según resultado)

**Validaciones:**
- [ ] Los ingresos se muestran en verde
- [ ] Los gastos se muestran en rojo
- [ ] El balance calcula correctamente (Ingresos - Gastos)
- [ ] Las categorías se cargan desde la base de datos
- [ ] El filtro por tipo funciona correctamente

---

## 📥 Prueba 5: Funcionalidad de Descarga

**Pasos para cada tipo de reporte:**
1. Generar un reporte con datos
2. Hacer clic en "📥 Descargar Excel"

**Resultado Esperado:**
- ✅ Se descarga un archivo CSV con el nombre: `reporte_[tipo]_[fecha].csv`
- ✅ El archivo contiene:
  - Primera fila: encabezados de columnas
  - Filas siguientes: todos los datos del reporte
  - Formato compatible con Excel

**Validaciones:**
- [ ] El archivo se descarga automáticamente
- [ ] El nombre del archivo incluye el tipo de reporte y la fecha
- [ ] El archivo se abre correctamente en Excel
- [ ] Todos los datos se exportan correctamente
- [ ] Los caracteres especiales (₡, ñ, acentos) se muestran correctamente

---

## 🧪 Pruebas de Edge Cases

### Caso 1: Sin datos
1. Aplicar filtros que no coincidan con ningún dato
2. Generar reporte
3. **Esperado:** Mensaje "No hay datos para mostrar"

### Caso 2: Sin autenticación
1. Cerrar sesión
2. Intentar acceder a /reportes
3. **Esperado:** Redirección a login

### Caso 3: Múltiples filtros
1. Aplicar varios filtros simultáneamente
2. Generar reporte
3. **Esperado:** Solo datos que cumplan TODOS los filtros

### Caso 4: Limpiar filtros
1. Aplicar varios filtros
2. Hacer clic en "🗑️ Limpiar"
3. **Esperado:** Todos los campos de filtro vacíos, reporte se limpia

---

## 🔍 Pruebas de API (Backend)

### Endpoint 1: GET /api/reportes/pagos
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reportes/pagos?fechaInicio=2024-01-01&fechaFin=2024-12-31&estado=aprobado"
```

### Endpoint 2: GET /api/reportes/movimientos
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reportes/movimientos?tipo=ingreso"
```

### Endpoint 3: GET /api/reportes/usuarios
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reportes/usuarios?estadoCuenta=activo"
```

### Endpoint 4: GET /api/reportes/casas
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reportes/casas?estadoPago=moroso"
```

### Endpoint 5: GET /api/reportes/categorias
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reportes/categorias"
```

---

## 📋 Checklist de Validación Final

### Funcionalidades Core
- [ ] Los 4 tipos de reportes se generan correctamente
- [ ] Los filtros funcionan en cada tipo de reporte
- [ ] Los totales se calculan correctamente
- [ ] Las tablas muestran datos ordenados y legibles
- [ ] Los badges de estado tienen colores correctos

### Experiencia de Usuario
- [ ] Los botones tienen hover effects
- [ ] El loading spinner aparece durante la carga
- [ ] Los mensajes de error son claros
- [ ] El diseño es responsive (funciona en móvil)
- [ ] Los iconos son intuitivos

### Descarga de Datos
- [ ] La descarga en Excel/CSV funciona
- [ ] El nombre del archivo es descriptivo
- [ ] Todos los datos se exportan correctamente
- [ ] El formato es compatible con Excel

### Performance
- [ ] Los reportes se generan en menos de 2 segundos
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs del backend
- [ ] La navegación entre tipos de reporte es fluida

---

## 🐛 Reportar Problemas

Si encuentras algún problema:
1. Anota el tipo de reporte que estabas generando
2. Lista los filtros que aplicaste
3. Copia el mensaje de error (si hay)
4. Toma un screenshot de la pantalla
5. Revisa la consola del navegador (F12)
6. Revisa los logs del backend

---

## ✅ Criterios de Éxito

El sistema de reportes está listo para producción si:
- ✅ Todos los tipos de reporte funcionan
- ✅ Todos los filtros se aplican correctamente
- ✅ La descarga de datos funciona
- ✅ No hay errores de consola
- ✅ El diseño es responsive
- ✅ Los totales son precisos

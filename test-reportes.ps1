# Script de prueba para endpoints de reportes
# Ejecutar línea por línea en PowerShell

# 1. Login para obtener token (ajusta el correo y contraseña según tu usuario de prueba)
$loginBody = @{
    correoElectronico = "super@marianela.com"
    contrasena = "super123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/usuarios/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Token obtenido: $token" -ForegroundColor Green

# 2. Probar reporte de CASAS
Write-Host "`n=== PRUEBA 1: Reporte de Casas ===" -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
}
$casasResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/casas" -Method Get -Headers $headers
Write-Host "Total de casas: $($casasResponse.data.totales.totalCasas)" -ForegroundColor Yellow
Write-Host "Casas al día: $($casasResponse.data.totales.casasAlDia)" -ForegroundColor Green
Write-Host "Casas morosas: $($casasResponse.data.totales.casasMorosas)" -ForegroundColor Red
$casasResponse.data.casas | Select-Object -First 5 | Format-Table numeroCasa, estadoPago

# 3. Probar reporte de USUARIOS
Write-Host "`n=== PRUEBA 2: Reporte de Usuarios ===" -ForegroundColor Cyan
$usuariosResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/usuarios" -Method Get -Headers $headers
Write-Host "Total de usuarios: $($usuariosResponse.data.totales.totalUsuarios)" -ForegroundColor Yellow
Write-Host "Usuarios activos: $($usuariosResponse.data.totales.usuariosActivos)" -ForegroundColor Green
Write-Host "Usuarios pendientes: $($usuariosResponse.data.totales.usuariosPendientes)" -ForegroundColor Magenta
$usuariosResponse.data.usuarios | Select-Object -First 5 | Format-Table nombreCompleto, estadoCuenta

# 4. Probar reporte de PAGOS (sin filtros)
Write-Host "`n=== PRUEBA 3: Reporte de Pagos ===" -ForegroundColor Cyan
$pagosResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/pagos" -Method Get -Headers $headers
Write-Host "Total de pagos: $($pagosResponse.data.totales.totalPagos)" -ForegroundColor Yellow
Write-Host "Monto total: ₡$($pagosResponse.data.totales.montoTotal)" -ForegroundColor Green
Write-Host "Pagos aprobados: $($pagosResponse.data.totales.pagosAprobados)" -ForegroundColor Green
Write-Host "Pagos pendientes: $($pagosResponse.data.totales.pagosPendientes)" -ForegroundColor Magenta

# 5. Probar reporte de PAGOS con filtros por estado
Write-Host "`n=== PRUEBA 4: Reporte de Pagos Aprobados ===" -ForegroundColor Cyan
$pagosAprobadosResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/pagos?estado=aprobado" -Method Get -Headers $headers
Write-Host "Pagos aprobados: $($pagosAprobadosResponse.data.totales.totalPagos)" -ForegroundColor Green
Write-Host "Monto total aprobado: ₡$($pagosAprobadosResponse.data.totales.montoTotal)" -ForegroundColor Green

# 6. Probar reporte de MOVIMIENTOS FINANCIEROS
Write-Host "`n=== PRUEBA 5: Reporte de Movimientos Financieros ===" -ForegroundColor Cyan
$movimientosResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/movimientos" -Method Get -Headers $headers
Write-Host "Total de movimientos: $($movimientosResponse.data.totales.totalMovimientos)" -ForegroundColor Yellow
Write-Host "Total ingresos: ₡$($movimientosResponse.data.totales.totalIngresos)" -ForegroundColor Green
Write-Host "Total gastos: ₡$($movimientosResponse.data.totales.totalGastos)" -ForegroundColor Red
Write-Host "Balance: ₡$($movimientosResponse.data.totales.balance)" -ForegroundColor Cyan

# 7. Probar reporte de MOVIMIENTOS con filtro de tipo
Write-Host "`n=== PRUEBA 6: Reporte de Ingresos ===" -ForegroundColor Cyan
$ingresosResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/movimientos?tipo=ingreso" -Method Get -Headers $headers
Write-Host "Total de ingresos: $($ingresosResponse.data.totales.totalMovimientos)" -ForegroundColor Green
Write-Host "Monto total: ₡$($ingresosResponse.data.totales.totalIngresos)" -ForegroundColor Green

# 8. Probar categorías financieras
Write-Host "`n=== PRUEBA 7: Categorías Financieras ===" -ForegroundColor Cyan
$categoriasResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/reportes/categorias" -Method Get -Headers $headers
Write-Host "Total de categorías: $($categoriasResponse.data.Count)" -ForegroundColor Yellow
$categoriasResponse.data | Format-Table nombre, idCategoria

Write-Host "`n✅ TODAS LAS PRUEBAS COMPLETADAS" -ForegroundColor Green

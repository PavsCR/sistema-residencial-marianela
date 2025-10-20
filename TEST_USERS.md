# Test Users - Sistema Residencial Marianela

## 🔐 Default Credentials

**Password for all test users:** `Vecino2025!`

## 👥 Test Users List

| Casa | Nombre Completo | Email | Teléfono | Rol | Pagos |
|------|----------------|-------|----------|-----|-------|
| 1 | María González Rodríguez | maria.gonzalez@email.com | 8888-1111 | Vecino | ✅ 4 pagos |
| 2 | Carlos Ramírez Mora | carlos.ramirez@email.com | 8888-2222 | Vecino | ✅ 5 pagos |
| 3 | Ana Patricia Vargas | ana.vargas@email.com | 8888-3333 | Vecino | ✅ 4 pagos |
| 5 | José Luis Hernández | jose.hernandez@email.com | 8888-4444 | Vecino | ✅ 6 pagos |
| 8 | Laura Jiménez Castro | laura.jimenez@email.com | 8888-5555 | Vecino | ✅ 4 pagos |
| 10 | Roberto Solís Pérez | roberto.solis@email.com | 8888-6666 | Vecino | - |
| 15 | Sofía Méndez Rojas | sofia.mendez@email.com | 8888-7777 | Vecino | - |
| 20 | Diego Alvarado Sánchez | diego.alvarado@email.com | 8888-8888 | Vecino | - |
| 25 | Patricia Cordero Vega | patricia.cordero@email.com | 8888-9999 | Vecino | - |
| 30 | Fernando Chacón Díaz | fernando.chacon@email.com | 8888-0000 | Vecino | - |
| 100 | Super Admin | superadmin@residencialmarianela.com | N/A | Super Admin | ✅ 10 pagos |

## 📝 Notes

- All test users have `estadoCuenta: 'activo'` (active account)
- All test users have the role of "vecino" (resident)
- The Super Admin user was created during initial database seeding
- Each user is linked to their respective house (casa)
- Houses 1, 2, 3, 5, 8, and 100 have payment history for testing

## 🧪 Testing Payment History

Best test users with payment data:
- **Casa 100** (Super Admin): 10 payments from Jan-Oct 2025
- **Casa 5** (José Luis Hernández): 6 payments including extraordinary payment
- **Casa 2** (Carlos Ramírez): 5 payments
- **Casa 1, 3, 8**: 4 payments each

## 🔄 Re-seeding

If you need to recreate the data:

**Users:**
```bash
cd backend
npx tsx prisma/seed-users.ts
```

**Payments for Casa 100:**
```bash
cd backend
npx tsx prisma/seed-pagos.ts
```

**Payments for other houses:**
```bash
cd backend
npx tsx prisma/seed-more-pagos.ts
```

The scripts will skip records that already exist to prevent duplicates.

## 🗑️ Clean Up

To remove all test users (except Super Admin):
```sql
DELETE FROM usuarios WHERE correo_electronico LIKE '%@email.com';
```

To remove all test payments:
```sql
DELETE FROM pagos;
```

## 📊 Database Status

✅ 10 test users created and ready
✅ Linked to houses 1, 2, 3, 5, 8, 10, 15, 20, 25, 30
✅ All accounts are active and approved
✅ Password: `Vecino2025!` (hashed with bcrypt)
✅ 23 payments for houses 1, 2, 3, 5, 8
✅ 10 payments for house 100 (Super Admin)
✅ **Total: 33 payments across 6 houses**

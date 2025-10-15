import { prisma } from '../src/config/prisma';

async function updateHouseStatuses() {
  console.log('Updating house statuses...');
  
  // Update some houses with different payment statuses to match frontend expectations
  // Map database statuses to frontend statuses: al_dia, moroso, en_arreglo -> al_dia, pendiente, especial, extra
  
  await prisma.casa.updateMany({
    where: { numeroCasa: { in: ['3', '8', '10'] } },
    data: { estadoPago: 'pendiente' }
  });
  
  await prisma.casa.updateMany({
    where: { numeroCasa: { in: ['5', '100'] } },
    data: { estadoPago: 'especial' }
  });
  
  await prisma.casa.updateMany({
    where: { numeroCasa: { in: ['1', '2', '4', '6', '7', '9', '50'] } },
    data: { estadoPago: 'al_dia' }
  });
  
  console.log('House statuses updated successfully!');
  
  // Show updated statuses
  const houses = await prisma.casa.findMany({
    where: { numeroCasa: { in: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '50', '100'] } },
    select: { numeroCasa: true, estadoPago: true },
    orderBy: { numeroCasa: 'asc' }
  });
  
  console.log('Current house statuses:');
  houses.forEach(house => {
    console.log(`Casa ${house.numeroCasa}: ${house.estadoPago}`);
  });
  
  await prisma.$disconnect();
}

updateHouseStatuses().catch(console.error);
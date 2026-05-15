import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkYesterdayOrders() {
  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date();
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  console.log(`Checking orders between ${yesterdayStart.toISOString()} and ${yesterdayEnd.toISOString()}`);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: yesterdayStart,
        lte: yesterdayEnd,
      },
    },
    include: {
      items: true,
      branch: true,
    },
  });

  console.log(`Found ${orders.length} orders from yesterday.`);

  orders.forEach((order, index) => {
    console.log(`Order ${index + 1}: ID=${order.id}, Branch=${order.branch?.name || 'Main'}, Total=${order.totalAmount}, Status=${order.status}, Items=${order.items.length}`);
    order.items.forEach(item => {
        console.log(`  - Product ID: ${item.productId}, Quantity: ${item.quantity}`);
    });
  });

  // Also check if there are any orders at all
  const totalOrders = await prisma.order.count();
  console.log(`Total orders in database: ${totalOrders}`);
  
  const latestOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { branch: true }
  });
  console.log('Latest 5 orders:');
  latestOrders.forEach(o => console.log(`  ID: ${o.id}, Date: ${o.createdAt.toISOString()}, Branch: ${o.branch?.name}, Status: ${o.status}`));
}

checkYesterdayOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllOrders() {
  const orders = await prisma.order.findMany({
    include: {
      branch: true,
      items: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  console.log(`Found ${orders.length} total orders.`);

  orders.forEach((o, i) => {
    console.log(`${i+1}. ID: ${o.id}, Date: ${o.createdAt.toISOString()}, Branch: ${o.branch?.name || 'NULL'}, Total: ${o.totalAmount}, Status: ${o.status}`);
  });
  
  const branches = await prisma.branch.findMany();
  console.log('\nBranches:');
  branches.forEach(b => console.log(`  ${b.id}: ${b.name}`));
}

checkAllOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

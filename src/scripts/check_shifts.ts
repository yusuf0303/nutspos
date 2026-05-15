import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShifts() {
  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date();
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  console.log(`Checking shifts between ${yesterdayStart.toISOString()} and ${yesterdayEnd.toISOString()}`);

  const shifts = await prisma.shift.findMany({
    where: {
      createdAt: {
        gte: yesterdayStart,
        lte: yesterdayEnd,
      },
    },
    include: {
      branch: true,
      user: true,
      orders: true
    },
  });

  console.log(`Found ${shifts.length} shifts from yesterday.`);

  shifts.forEach((shift, index) => {
    console.log(`Shift ${index + 1}: ID=${shift.id}, Branch=${shift.branch?.name || 'Main'}, User=${shift.user.name}, Status=${shift.status}, Orders=${shift.orders.length}`);
  });

  const latestShifts = await prisma.shift.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { branch: true }
  });
  console.log('Latest 5 shifts:');
  latestShifts.forEach(s => console.log(`  ID: ${s.id}, Date: ${s.createdAt.toISOString()}, Branch: ${s.branch?.name}, Status: ${s.status}`));
}

checkShifts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

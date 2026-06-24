const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Tozalash boshlandi...");
    
    // Delete all child relations first
    await prisma.adjustmentItem.deleteMany();
    await prisma.inventoryAdjustment.deleteMany();
    await prisma.transferItem.deleteMany();
    await prisma.stockTransfer.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.barcode.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.expense.deleteMany();
    
    // Delete masters
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();
    
    // Delete all users except admin
    await prisma.user.deleteMany({
        where: {
            email: { not: 'admin@nuts.com' }
        }
    });
    await prisma.branch.deleteMany();

    console.log("Baza to'liq tozalandi!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

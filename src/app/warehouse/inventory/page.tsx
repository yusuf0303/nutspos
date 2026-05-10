import { prisma } from '@/lib/prisma';
import InventoryList from '@/components/warehouse/InventoryList';

export default async function InventoryPage() {
    const inventory = await prisma.inventory.findMany({
        include: { product: true },
        orderBy: { updatedAt: 'desc' }
    });

    return <InventoryList initialInventory={inventory} />;
}

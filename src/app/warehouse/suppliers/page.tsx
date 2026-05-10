import { prisma } from '@/lib/prisma';
import SupplierList from '@/components/warehouse/SupplierList';

export default async function SuppliersPage() {
    const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    });

    return <SupplierList suppliers={suppliers} />;
}

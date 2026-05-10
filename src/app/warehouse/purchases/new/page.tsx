import { prisma } from '@/lib/prisma';
import NewPurchaseOrderForm from '@/components/purchases/NewPurchaseOrderForm';

export default async function NewPurchaseOrderPage() {
    const suppliers = await prisma.supplier.findMany();
    const products = await prisma.product.findMany();

    return (
        <div style={{ padding: '2rem' }}>
            <NewPurchaseOrderForm suppliers={suppliers} products={products} />
        </div>
    );
}

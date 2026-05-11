import { prisma } from '@/lib/prisma';
import AdjustmentDetail from '@/components/warehouse/AdjustmentDetail';
import { notFound } from 'next/navigation';

export default async function AdjustmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const adjustment = await prisma.inventoryAdjustment.findUnique({
        where: { id },
        include: {
            branch: true,
            items: {
                include: { product: true }
            }
        }
    });

    if (!adjustment) notFound();

    const products = await prisma.product.findMany();

    return (
        <div style={{ padding: '2rem' }}>
            <AdjustmentDetail adjustment={adjustment} products={products} />
        </div>
    );
}

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PurchaseOrderDetail from '@/components/purchases/PurchaseOrderDetail';

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            supplier: true,
            user: true,
            branch: true,
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!po) {
        notFound();
    }

    return (
        <div style={{ padding: '2rem' }}>
            <PurchaseOrderDetail po={po} />
        </div>
    );
}

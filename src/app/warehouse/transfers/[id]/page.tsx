import { prisma } from '@/lib/prisma';
import TransferDetail from '@/components/warehouse/TransferDetail';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
        include: {
            fromBranch: true,
            toBranch: true,
            user: true,
            items: {
                include: { product: true }
            }
        }
    });

    if (!transfer) notFound();

    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });

    return (
        <div style={{ padding: '2rem' }}>
            <TransferDetail transfer={transfer} products={products} />
        </div>
    );
}

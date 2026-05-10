import { prisma } from '@/lib/prisma';
import ShiftDetail from '@/components/warehouse/ShiftDetail';
import { notFound } from 'next/navigation';

export default async function ShiftPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const shift = await prisma.shift.findUnique({
        where: { id },
        include: {
            user: true,
            branch: true,
            orders: {
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!shift) {
        notFound();
    }

    return <ShiftDetail shift={shift as any} />;
}

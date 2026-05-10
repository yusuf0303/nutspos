import { prisma } from '@/lib/prisma';
import ShiftDetail from '@/components/warehouse/ShiftDetail';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function POSShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

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

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <ShiftDetail shift={shift as any} backUrl="/pos/history" />
            </div>
        </div>
    );
}

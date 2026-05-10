import { prisma } from '@/lib/prisma';
import ShiftList from '@/components/warehouse/ShiftList';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function POSHistoryPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!currentUser || !currentUser.branchId) {
        redirect('/pos');
    }

    const shifts = await prisma.shift.findMany({
        where: {
            branchId: currentUser.branchId
        },
        include: {
            user: true,
            branch: true,
            orders: true
        },
        orderBy: {
            startTime: 'desc'
        }
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <Link href="/pos" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>← Dashboardga qaytish</Link>
                        <h1 style={{ fontSize: '2.25rem', marginTop: '0.5rem' }}>Smenalar Tarixi</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Filialingizdagi barcha kassa sessiyalari.</p>
                    </div>
                </div>

                <ShiftList initialShifts={shifts as any[]} linkPrefix="/pos/history" />
            </div>
        </div>
    );
}

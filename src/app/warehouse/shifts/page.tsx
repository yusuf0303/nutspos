import { prisma } from '@/lib/prisma';
import ShiftList from '@/components/warehouse/ShiftList';

export const dynamic = 'force-dynamic';

export default async function ShiftsPage() {
    const shifts = await prisma.shift.findMany({
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Kassa Smenalari</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Barcha filiallardagi kassa sessiyalari va naqd pul aylanmasi nazorati.</p>
                </div>
            </div>

            <ShiftList initialShifts={shifts as any[]} />
        </div>
    );
}

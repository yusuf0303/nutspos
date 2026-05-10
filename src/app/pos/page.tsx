import { prisma } from '@/lib/prisma';
import ShiftDashboard from '@/components/pos/ShiftDashboard';

export default async function POSPage() {
    const currentUser = await prisma.user.findFirst({
        include: { branch: true }
    });

    return (
        <ShiftDashboard user={currentUser as any} />
    );
}

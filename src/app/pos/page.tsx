import { prisma } from '@/lib/prisma';
import ShiftDashboard from '@/components/pos/ShiftDashboard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function POSPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { branch: true }
    });

    if (!currentUser) {
        redirect('/login');
    }

    return (
        <ShiftDashboard user={currentUser as any} />
    );
}

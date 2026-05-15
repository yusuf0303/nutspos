import { prisma } from '@/lib/prisma';
import POSTerminal from '@/components/pos/POSTerminal';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function TerminalPage() {
    // 1. Get current user from session
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { branch: true }
    });

    if (!user) {
        redirect('/login');
    }

    // 2. Check for active shift for the BRANCH
    const activeShift = await prisma.shift.findFirst({
        where: {
            branchId: user.branchId || undefined,
            status: 'OPEN'
        }
    });

    // If no shift, redirect back to dashboard
    if (!activeShift) {
        redirect('/pos');
    }

    // 3. Load POS data
    const [products, customers, categories, allowNegativeInv] = await Promise.all([
        prisma.product.findMany({ 
            include: { 
                category: true, 
                inventory: {
                    where: { branchId: user.branchId || undefined }
                } 
            } 
        }),
        prisma.customer.findMany({ orderBy: { name: 'asc' } }),
        prisma.category.findMany({ orderBy: { name: 'asc' } }),
        import('@/app/actions/settingActions').then(m => m.getSetting('ALLOW_NEGATIVE_INVENTORY', 'false'))
    ]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <POSTerminal
                initialProducts={products as any[]}
                initialCustomers={customers as any[]}
                initialCategories={categories as any[]}
                user={user as any}
                allowNegativeInventory={allowNegativeInv === 'true'}
            />
        </div>
    );
}

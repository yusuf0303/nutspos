import { prisma } from '@/lib/prisma';
import POSTerminal from '@/components/pos/POSTerminal';
import { redirect } from 'next/navigation';

export default async function TerminalPage() {
    // 1. Get current user
    const user = await prisma.user.findFirst({
        include: { branch: true }
    });

    if (!user) {
        redirect('/login');
    }

    // 2. Check for active shift
    const activeShift = await prisma.shift.findFirst({
        where: {
            userId: user.id,
            status: 'OPEN'
        }
    });

    // If no shift, redirect back to dashboard
    if (!activeShift) {
        redirect('/pos');
    }

    // 3. Load POS data
    const [products, customers, categories] = await Promise.all([
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
    ]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <POSTerminal
                initialProducts={products as any[]}
                initialCustomers={customers as any[]}
                initialCategories={categories as any[]}
                user={user as any}
            />
        </div>
    );
}

import { prisma } from '@/lib/prisma';
import NewPurchaseOrderForm from '@/components/purchases/NewPurchaseOrderForm';
import { auth } from '@/auth';

export default async function NewPurchaseOrderPage() {
    const session = await auth();
    const suppliers = await prisma.supplier.findMany();
    const products = await prisma.product.findMany();
    const branches = await prisma.branch.findMany();

    return (
        <div style={{ padding: '2rem' }}>
            <NewPurchaseOrderForm 
                suppliers={suppliers} 
                products={products} 
                branches={branches} 
                user={session?.user} 
            />
        </div>
    );
}

import { prisma } from '@/lib/prisma';
import AddProductForm from '@/components/warehouse/AddProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
    const categories = await prisma.category.findMany();
    const suppliers = await prisma.supplier.findMany();

    return <AddProductForm categories={categories} suppliers={suppliers} />;
}

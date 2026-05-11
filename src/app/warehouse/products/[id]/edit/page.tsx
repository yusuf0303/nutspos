import { prisma } from '@/lib/prisma';
import EditProductForm from '@/components/warehouse/EditProductForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id }
    });

    if (!product) {
        notFound();
    }

    const categories = await prisma.category.findMany();
    const suppliers = await prisma.supplier.findMany();

    return <EditProductForm product={product} categories={categories} suppliers={suppliers} />;
}

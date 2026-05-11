import { prisma } from '@/lib/prisma';
import CategoryList from '@/components/warehouse/CategoryList';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    return <CategoryList initialCategories={categories} />;
}

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCategory(data: {
    name: string,
    description?: string
}) {
    try {
        await prisma.category.create({
            data
        });

        revalidatePath('/warehouse/categories');
        revalidatePath('/warehouse/products');
        return { success: true };
    } catch (error: any) {
        console.error("Create Category Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateCategory(id: string, data: {
    name?: string,
    description?: string
}) {
    try {
        await prisma.category.update({
            where: { id },
            data
        });

        revalidatePath('/warehouse/categories');
        revalidatePath('/warehouse/products');
        return { success: true };
    } catch (error: any) {
        console.error("Update Category Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(id: string) {
    try {
        // Check if there are products in this category
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productCount > 0) {
            throw new Error("Ushbu kategoriyada mahsulotlar bor. Avval ularni o'chiring yoki boshqa kategoriyaga o'tkazing.");
        }

        await prisma.category.delete({
            where: { id }
        });

        revalidatePath('/warehouse/categories');
        revalidatePath('/warehouse/products');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Category Error:", error);
        return { success: false, error: error.message };
    }
}

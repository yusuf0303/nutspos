'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createProduct(data: {
    name: string,
    sku: string,
    price: number,
    cost: number,
    categoryId: string,
    supplierId?: string,
    unit?: string,
    description?: string
}) {
    try {
        const product = await prisma.$transaction(async (tx: any) => {
            const newProduct = await tx.product.create({
                data: {
                    name: data.name,
                    sku: data.sku,
                    price: data.price,
                    cost: data.cost,
                    categoryId: data.categoryId,
                    supplierId: data.supplierId,
                    unit: data.unit || 'dona',
                    description: data.description
                }
            });

            // Initialize inventory
            await tx.inventory.create({
                data: {
                    productId: newProduct.id,
                    location: "Main Warehouse",
                    quantity: 0
                }
            });

            return newProduct;
        });

        revalidatePath('/warehouse/products');
        return { success: true, id: product.id };
    } catch (error: any) {
        console.error("Create Product Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateProduct(id: string, data: {
    name?: string,
    sku?: string,
    price?: number,
    cost?: number,
    categoryId?: string,
    supplierId?: string,
    unit?: string,
    description?: string
}) {
    try {
        await prisma.product.update({
            where: { id },
            data
        });

        revalidatePath('/warehouse/products');
        return { success: true };
    } catch (error: any) {
        console.error("Update Product Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id }
        });

        revalidatePath('/warehouse/products');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Product Error:", error);
        return { success: false, error: error.message };
    }
}

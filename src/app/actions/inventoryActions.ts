'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function adjustInventory(data: {
    productId: string,
    location: string,
    adjustment: number, // positive for addition, negative for subtraction
    reason: string
}) {
    try {
        await prisma.inventory.update({
            where: {
                productId_location: {
                    productId: data.productId,
                    location: data.location
                }
            },
            data: {
                quantity: {
                    increment: data.adjustment
                }
            }
        });

        // Optional: Log this in an Activity table if it existed
        console.log(`Inventory Adjusted: ${data.productId} at ${data.location} by ${data.adjustment}. Reason: ${data.reason}`);

        revalidatePath('/warehouse/inventory');
        revalidatePath('/warehouse/products');
        revalidatePath('/warehouse');
        return { success: true };
    } catch (error: any) {
        console.error("Inventory Adjustment Error:", error);
        return { success: false, error: error.message };
    }
}

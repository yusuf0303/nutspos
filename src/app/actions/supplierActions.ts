'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSupplier(data: {
    name: string,
    contactName?: string,
    email?: string,
    phone?: string,
    address?: string
}) {
    try {
        await prisma.supplier.create({
            data
        });

        revalidatePath('/warehouse/suppliers');
        return { success: true };
    } catch (error: any) {
        console.error("Create Supplier Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateSupplier(id: string, data: {
    name?: string,
    contactName?: string,
    email?: string,
    phone?: string,
    address?: string
}) {
    try {
        await prisma.supplier.update({
            where: { id },
            data
        });

        revalidatePath('/warehouse/suppliers');
        return { success: true };
    } catch (error: any) {
        console.error("Update Supplier Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteSupplier(id: string) {
    try {
        // Check for existing purchase orders
        const poCount = await prisma.purchaseOrder.count({
            where: { supplierId: id }
        });

        if (poCount > 0) {
            throw new Error("Ushbu ta'minotchiga bog'liq buyurtmalar bor. O'chirishning iloji yo'q.");
        }

        await prisma.supplier.delete({
            where: { id }
        });

        revalidatePath('/warehouse/suppliers');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Supplier Error:", error);
        return { success: false, error: error.message };
    }
}

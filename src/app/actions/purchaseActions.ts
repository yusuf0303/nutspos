'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPurchaseOrder(data: {
    supplierId: string;
    userId: string;
    branchId: string;
    note?: string;
    items: { productId: string; quantity: number; cost: number; price: number }[];
}) {
    try {
        const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.cost), 0);

        const po = await prisma.$transaction(async (tx: any) => {
            // Update product selling prices
            for (const item of data.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { price: item.price }
                });
            }

            const documentNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

            return await tx.purchaseOrder.create({
                data: {
                    documentNumber,
                    supplierId: data.supplierId,
                    userId: data.userId,
                    branchId: data.branchId,
                    totalAmount,
                    status: 'PENDING',
                    note: data.note,
                    items: {
                        create: data.items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            cost: item.cost
                        }))
                    }
                }
            });
        });

        revalidatePath('/warehouse/purchases');
        revalidatePath('/warehouse/products');
        return { success: true, poId: po.id };
    } catch (error: any) {
        console.error("PO Creation Error:", error);
        return { success: false, error: error.message };
    }
}

export async function receivePurchaseOrder(poId: string) {
    try {
        await prisma.$transaction(async (tx: any) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { id: poId },
                include: { items: true }
            });

            if (!po || po.status === 'RECEIVED') {
                throw new Error("Buyurtma topilmadi yoki allaqachon qabul qilingan.");
            }

            // 1. Update status
            await tx.purchaseOrder.update({
                where: { id: poId },
                data: { status: 'RECEIVED' }
            });

            // 2. Update inventory and product cost
            for (const item of po.items) {
                await tx.inventory.upsert({
                    where: { productId_branchId: { productId: item.productId, branchId: po.branchId } },
                    create: { productId: item.productId, quantity: item.quantity, branchId: po.branchId },
                    update: { quantity: { increment: item.quantity } }
                });

                // Optional: Update product's master cost to the latest purchase cost
                await tx.product.update({
                    where: { id: item.productId },
                    data: { cost: item.cost }
                });
            }
        });

        revalidatePath('/warehouse/purchases');
        revalidatePath('/warehouse/inventory');
        revalidatePath('/warehouse/products');

        return { success: true };
    } catch (error: any) {
        console.error("PO Receipt Error:", error);
        return { success: false, error: error.message };
    }
}

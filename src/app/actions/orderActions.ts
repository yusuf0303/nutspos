'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSetting } from './settingActions';

export async function cancelOrder(orderId: string) {
    try {
        // Run everything in a transaction to ensure integrity
        await prisma.$transaction(async (tx: any) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order || order.status === 'CANCELLED') {
                throw new Error("Buyurtma topilmadi yoki allaqachon bekor qilingan");
            }

            // 1. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });

            // 2. Restore inventory for each item
            for (const item of order.items) {
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: {
                        quantity: {
                            increment: item.quantity
                        }
                    }
                });
            }
        });

        revalidatePath('/warehouse/sales');
        revalidatePath('/warehouse/inventory');
        revalidatePath('/warehouse');

        return { success: true };
    } catch (error: any) {
        console.error("Refund Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createOrder(data: {
    items: { productId: string, quantity: number, price: number, cost: number, discount?: number }[],
    totalAmount: number,
    paymentType: string,
    cashAmount?: number,
    cardAmount?: number,
    clickAmount?: number,
    customerId?: string,
    userId: string,
    branchId?: string,
    shiftId?: string,
    cashbackUsed?: number,
    discount?: number
}) {
    try {
        // Get dynamic cashback percentage before transaction
        const cashbackPercentStr = await getSetting('CASHBACK_PERCENT', '1');
        const cashbackPercent = parseFloat(cashbackPercentStr) / 100;

        const order = await prisma.$transaction(async (tx: any) => {
            // 1. Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId: data.userId,
                    branchId: data.branchId || null,
                    shiftId: data.shiftId || null,
                    customerId: data.customerId || null,
                    totalAmount: data.totalAmount,
                    paymentType: data.paymentType,
                    cashAmount: data.cashAmount || 0,
                    cardAmount: data.cardAmount || 0,
                    clickAmount: data.clickAmount || 0,
                    cashbackUsed: data.cashbackUsed || 0,
                    discount: data.discount || 0,
                    status: 'COMPLETED',
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            cost: item.cost,
                            discount: item.discount || 0
                        }))
                    }
                }
            });

            // 2. Update inventory
            for (const item of data.items) {
                // Try to find inventory for this branch, otherwise fallback to "Main Warehouse"
                const inventory = await tx.inventory.findFirst({
                    where: {
                        productId: item.productId,
                        OR: [
                            { branchId: data.branchId },
                            { location: "Main Warehouse" }
                        ]
                    }
                });

                if (inventory) {
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: {
                            quantity: {
                                decrement: item.quantity
                            }
                        }
                    });
                }
            }

            // 3. Update customer cashback (points) if present
            if (data.customerId) {
                const cashbackEarned = Math.round(data.totalAmount * cashbackPercent);
                const spent = data.cashbackUsed || 0;
                const netChange = cashbackEarned - spent;

                console.log(`[Cashback Calculation] Total: ${data.totalAmount}, Rate: ${cashbackPercentStr}%, Earned: ${cashbackEarned}, Spent: ${spent}, Net: ${netChange}`);

                await tx.customer.update({
                    where: { id: data.customerId },
                    data: {
                        points: {
                            increment: netChange
                        }
                    }
                });
            }

            const updatedCustomer = data.customerId ? await tx.customer.findUnique({ where: { id: data.customerId } }) : null;

            return { order: newOrder, newPoints: updatedCustomer?.points || 0 };
        });

        revalidatePath('/warehouse/sales');
        revalidatePath('/warehouse/inventory');
        revalidatePath('/warehouse/products');
        revalidatePath('/warehouse');

        return { success: true, orderId: order.order.id, newPoints: order.newPoints };
    } catch (error: any) {
        console.error("Checkout Error:", error);
        return { success: false, error: error.message };
    }
}

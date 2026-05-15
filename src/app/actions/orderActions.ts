'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSetting } from './settingActions';

export async function refundOrder(orderId: string) {
    try {
        await prisma.$transaction(async (tx: any) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order || order.status === 'REFUNDED') {
                throw new Error("Buyurtma topilmadi yoki allaqachon qaytarilgan");
            }

            // 1. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'REFUNDED' }
            });

            // 2. Restore inventory for each item at the CORRECT branch
            for (const item of order.items) {
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: order.branchId
                        }
                    },
                    update: {
                        quantity: {
                            increment: item.quantity
                        }
                    },
                    create: {
                        productId: item.productId,
                        branchId: order.branchId,
                        quantity: item.quantity
                    }
                });
            }

            // 3. Reverse customer points if applicable
            if (order.customerId) {
                const cashbackPercentStr = await getSetting('CASHBACK_PERCENT', '1');
                const cashbackPercent = parseFloat(cashbackPercentStr) / 100;
                
                const pointsEarned = Math.round(order.totalAmount * cashbackPercent);
                const pointsSpent = order.cashbackUsed || 0;
                
                // Deduction = Points earned should be removed, points spent should be returned
                const netPointsAdjustment = pointsSpent - pointsEarned;

                await tx.customer.update({
                    where: { id: order.customerId },
                    data: {
                        points: {
                            increment: netPointsAdjustment
                        }
                    }
                });
            }
        });

        revalidatePath('/warehouse/sales');
        revalidatePath('/warehouse/inventory');
        revalidatePath('/pos');
        revalidatePath('/pos/history');
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

        // 1. Check if shift is valid (less than 24h old) if shiftId is provided
        if (data.shiftId) {
            const shift = await prisma.shift.findUnique({
                where: { id: data.shiftId }
            });

            if (shift && shift.status === 'OPEN') {
                const shiftDurationHours = (Date.now() - shift.createdAt.getTime()) / (1000 * 60 * 60);
                if (shiftDurationHours >= 24) {
                    throw new Error("Smena muddati (24 soat) tugagan. Iltimos, yangi smena oching.");
                }
            } else if (shift && shift.status === 'CLOSED') {
                throw new Error("Ushbu smena yopilgan. Iltimos, yangi smena oching.");
            }
        }

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
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: data.branchId || null
                        }
                    },
                    update: {
                        quantity: {
                            decrement: item.quantity
                        }
                    },
                    create: {
                        productId: item.productId,
                        branchId: data.branchId || null,
                        quantity: -item.quantity
                    }
                });
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

        return { success: true, order: order.order, newPoints: order.newPoints };
    } catch (error: any) {
        console.error("Checkout Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getOrderById(id: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        return { success: true, order };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getRecentOrders(branchId: string, limit: number = 10) {
    try {
        const orders = await prisma.order.findMany({
            where: { branchId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        return { success: true, orders };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

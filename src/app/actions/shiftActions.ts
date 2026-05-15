'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function openShift(data: {
    userId: string;
    branchId: string;
    startingCash: number;
}) {
    try {
        // Check if there's already an open shift for this branch
        const existingShift = await prisma.shift.findFirst({
            where: {
                branchId: data.branchId,
                status: 'OPEN'
            }
        });

        if (existingShift) {
            return { success: false, error: "Ushbu filialda allaqachon ochiq smena mavjud!" };
        }

        const shift = await prisma.shift.create({
            data: {
                userId: data.userId,
                branchId: data.branchId,
                startingCash: data.startingCash,
                status: 'OPEN'
            }
        });

        revalidatePath('/pos');
        revalidatePath('/warehouse/shifts');
        return { success: true, shift };
    } catch (error: any) {
        console.error("Open Shift Error:", error);
        return { success: false, error: error.message };
    }
}

export async function closeShift(shiftId: string, data: {
    endingCash: number;
}) {
    try {
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
            include: { orders: true }
        });

        if (!shift) {
            return { success: false, error: "Smena topilmadi!" };
        }

        // Calculate expected cash
        const cashSales = shift.orders
            .filter(o => o.status === 'COMPLETED')
            .reduce((acc, o) => acc + o.cashAmount, 0);

        const expectedCash = shift.startingCash + cashSales;

        await prisma.shift.update({
            where: { id: shiftId },
            data: {
                endingCash: data.endingCash,
                expectedCash,
                status: 'CLOSED',
                endTime: new Date()
            }
        });

        revalidatePath('/pos');
        revalidatePath('/warehouse/shifts');
        return { success: true };
    } catch (error: any) {
        console.error("Close Shift Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getCurrentShift(branchId: string) {
    try {
        const shift = await prisma.shift.findFirst({
            where: {
                branchId,
                status: 'OPEN'
            },
            include: {
                branch: true,
                orders: true,
                user: true
            }
        });

        if (shift) {
            const shiftDurationHours = (Date.now() - shift.createdAt.getTime()) / (1000 * 60 * 60);
            
            // Agar smena 24 soatdan ko'p ochiq bo'lsa, uni avtomatik yopamiz
            if (shiftDurationHours >= 24) {
                const cashSales = shift.orders
                    .filter(o => o.status === 'COMPLETED')
                    .reduce((acc, o) => acc + o.cashAmount, 0);

                const expectedCash = shift.startingCash + cashSales;

                await prisma.shift.update({
                    where: { id: shift.id },
                    data: {
                        status: 'CLOSED',
                        endingCash: expectedCash,
                        expectedCash: expectedCash,
                        endTime: new Date()
                    }
                });

                revalidatePath('/pos');
                return { success: true, shift: null };
            }
        }

        return { success: true, shift };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getShiftStats(shiftId: string) {
    try {
        const allOrders = await prisma.order.findMany({
            where: { shiftId }
        });

        const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');
        const refundedOrders = allOrders.filter(o => o.status === 'REFUNDED');

        const stats = {
            totalAmount: completedOrders.reduce((s, o) => s + o.totalAmount, 0),
            cashAmount: completedOrders.reduce((s, o) => s + o.cashAmount, 0),
            cardAmount: completedOrders.reduce((s, o) => s + o.cardAmount, 0),
            clickAmount: completedOrders.reduce((s, o) => s + o.clickAmount, 0),
            orderCount: completedOrders.length,
            refundCount: refundedOrders.length,
            refundAmount: refundedOrders.reduce((s, o) => s + o.totalAmount, 0),
        };

        return { success: true, stats };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { shifts = [], orders = [], orderItems = [] } = body;

        // Upsert shifts
        for (const shift of shifts) {
            await prisma.shift.upsert({
                where: { id: shift.id },
                create: shift,
                update: shift
            });
        }

        // Upsert orders
        for (const order of orders) {
            await prisma.order.upsert({
                where: { id: order.id },
                create: order,
                update: order
            });
        }

        // Upsert order items
        for (const item of orderItems) {
            await prisma.orderItem.upsert({
                where: { id: item.id },
                create: item,
                update: item
            });
        }

        return NextResponse.json({ success: true, message: 'Sync successful' });
    } catch (error: any) {
        console.error("Sync push error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

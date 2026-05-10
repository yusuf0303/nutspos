'use server';

import { prisma } from '@/lib/prisma';

export async function exportSalesToCSV() {
    try {
        const orders = await prisma.order.findMany({
            include: { items: { include: { product: true } }, customer: true },
            orderBy: { createdAt: 'desc' }
        });

        let csvContent = "ID,Sana,Mijoz,To'lov Turi,Naqd,Karta,Click,Jami,Status,Mahsulotlar\n";

        orders.forEach(order => {
            const date = order.createdAt.toLocaleDateString();
            const customer = order.customer?.name || "Mehmon";
            const items = order.items.map(i => `${i.product.name} (x${i.quantity})`).join("; ");

            csvContent += `${order.id.slice(-6)},${date},${customer},${order.paymentType},${order.cashAmount},${order.cardAmount},${order.clickAmount},${order.totalAmount},${order.status},"${items}"\n`;
        });

        return { success: true, data: csvContent };
    } catch (error: any) {
        console.error("Export Error:", error);
        return { success: false, error: error.message };
    }
}

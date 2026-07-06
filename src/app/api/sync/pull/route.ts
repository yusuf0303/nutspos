import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lastSync = searchParams.get('lastSync');
        const syncDate = lastSync ? new Date(lastSync) : new Date(0);
        const isFirstSync = syncDate.getTime() === 0;

        // Fetch master and transactional data that changed since lastSync
        const [users, branches, categories, suppliers, products, customers, shifts, orders, orderItems] = await Promise.all([
            prisma.user.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.branch.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.category.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.supplier.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.product.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.customer.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.shift.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.order.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.orderItem.findMany({ where: { updatedAt: { gt: syncDate } } })
        ]);

        // Barcodelar: faqat sinxronlangan produktlarga tegishli barcodelarni yuboramiz.
        // Bu foreign key xatosini oldini oladi.
        // Birinchi sync da: barcha produktlarning barcodelari
        // Keyingi synclarda: faqat o'zgargan produktlarning barcodelari
        let barcodes: any[] = [];
        if (products.length > 0) {
            const productIds = products.map((p: any) => p.id);
            barcodes = await prisma.barcode.findMany({
                where: { productId: { in: productIds } }
            });
        } else if (isFirstSync) {
            // Birinchi sync da hech bir produkt o'zgarmagan bo'lsa ham barcha barcodelarni yuboramiz
            barcodes = await prisma.barcode.findMany();
        }

        return NextResponse.json({
            success: true,
            data: {
                users,
                branches,
                categories,
                suppliers,
                products,
                barcodes,
                customers,
                shifts,
                orders,
                orderItems
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lastSync = searchParams.get('lastSync');
        const syncDate = lastSync ? new Date(lastSync) : new Date(0);

        // Fetch master data that changed since lastSync
        const [users, branches, categories, suppliers, products, barcodes, customers] = await Promise.all([
            prisma.user.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.branch.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.category.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.supplier.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.product.findMany({ where: { updatedAt: { gt: syncDate } } }),
            prisma.barcode.findMany(), // barcodes don't have updatedAt, fetch all
            prisma.customer.findMany({ where: { updatedAt: { gt: syncDate } } })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                users,
                branches,
                categories,
                suppliers,
                products,
                barcodes,
                customers
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

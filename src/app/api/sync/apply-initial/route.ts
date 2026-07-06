import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserConflict, resolveProductConflict, resolveBarcodeConflict } from '@/lib/syncConflictResolver';

// Dastur ishga tushganda serverdan kelgan barcha ma'lumotlarni lokal bazaga yozadi
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { users = [], branches = [], categories = [], suppliers = [], products = [], barcodes = [], customers = [], shifts = [], orders = [], orderItems = [] } = body;

        // Barcha ma'lumotlarni lokal bazaga upsert qilamiz (tartib muhim - foreign keys)
        let counts = { users: 0, branches: 0, categories: 0, suppliers: 0, products: 0, barcodes: 0, customers: 0, shifts: 0, orders: 0, orderItems: 0 };

        // 1. Branches
        for (const item of branches) {
            try {
                const { id, ...data } = item;
                await prisma.branch.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.branches++;
            } catch (e) { console.error('Branch upsert error:', e); }
        }

        // 2. Categories
        for (const item of categories) {
            try {
                const { id, ...data } = item;
                await prisma.category.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.categories++;
            } catch (e) { console.error('Category upsert error:', e); }
        }

        // 3. Suppliers
        for (const item of suppliers) {
            try {
                const { id, ...data } = item;
                await prisma.supplier.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.suppliers++;
            } catch (e) { console.error('Supplier upsert error:', e); }
        }

        // 4. Users (parollar bilan)
        for (const item of users) {
            try {
                await resolveUserConflict(item);
                const { id, ...data } = item;
                await prisma.user.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.users++;
            } catch (e) { console.error('User upsert error:', e); }
        }

        // 5. Products (categories va supplierlarga bog'liq)
        for (const item of products) {
            try {
                await resolveProductConflict(item);
                const { id, ...data } = item;
                await prisma.product.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.products++;
            } catch (e) { console.error('Product upsert error:', e); }
        }

        // 6. Barcodes (productlarga bog'liq)
        for (const item of barcodes) {
            try {
                await resolveBarcodeConflict(item);
                const { id, ...data } = item;
                const productExists = await prisma.product.findUnique({ where: { id: item.productId } });
                if (productExists) {
                    await prisma.barcode.upsert({ where: { id }, create: { id, ...data }, update: data });
                    counts.barcodes++;
                }
            } catch (e) { console.error('Barcode upsert error:', e); }
        }

        // 7. Customers
        for (const item of customers) {
            try {
                const { id, ...data } = item;
                await prisma.customer.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.customers++;
            } catch (e) { console.error('Customer upsert error:', e); }
        }

        // 8. Shifts
        for (const item of shifts) {
            try {
                const { id, ...data } = item;
                await prisma.shift.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.shifts++;
            } catch (e) { console.error('Shift upsert error:', e); }
        }

        // 9. Orders
        for (const item of orders) {
            try {
                const { id, ...data } = item;
                await prisma.order.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.orders++;
            } catch (e) { console.error('Order upsert error:', e); }
        }

        // 10. OrderItems
        for (const item of orderItems) {
            try {
                const { id, ...data } = item;
                await prisma.orderItem.upsert({ where: { id }, create: { id, ...data }, update: data });
                counts.orderItems++;
            } catch (e) { console.error('OrderItem upsert error:', e); }
        }

        return NextResponse.json({
            success: true,
            message: 'Barcha ma\'lumotlar lokal bazaga yozildi',
            counts
        });
    } catch (error: any) {
        console.error('apply-initial error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

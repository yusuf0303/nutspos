'use server';

import { prisma } from '@/lib/prisma';
import { getSetting, updateSetting } from './settingActions';

const DEFAULT_SYNC_URL = process.env.SYNC_SERVER_URL || 'https://nutspos.uz';

export async function syncWithServer() {
    try {
        const lastSyncPullStr = await getSetting('LAST_SYNC_PULL_TIME', '');
        const lastSyncPushStr = await getSetting('LAST_SYNC_PUSH_TIME', '');
        
        const lastSyncPull = lastSyncPullStr ? new Date(lastSyncPullStr) : new Date(0);
        const lastSyncPush = lastSyncPushStr ? new Date(lastSyncPushStr) : new Date(0);

        // 1. PULL DATA FROM SERVER
        const pullRes = await fetch(`${DEFAULT_SYNC_URL}/api/sync/pull?lastSync=${lastSyncPull.toISOString()}`);
        if (!pullRes.ok) {
            throw new Error(`Server returned ${pullRes.status}`);
        }
        const pullData = await pullRes.json();
        
        if (pullData.success && pullData.data) {
            const { users, branches, categories, suppliers, products, barcodes, customers } = pullData.data;

            // Upsert in transactions or sequentially
            for (const item of branches) {
                await prisma.branch.upsert({ where: { id: item.id }, create: item, update: item });
            }
            for (const item of users) {
                await prisma.user.upsert({ where: { id: item.id }, create: item, update: item });
            }
            for (const item of categories) {
                await prisma.category.upsert({ where: { id: item.id }, create: item, update: item });
            }
            for (const item of suppliers) {
                await prisma.supplier.upsert({ where: { id: item.id }, create: item, update: item });
            }
            for (const item of products) {
                await prisma.product.upsert({ where: { id: item.id }, create: item, update: item });
            }
            for (const item of customers) {
                await prisma.customer.upsert({ where: { id: item.id }, create: item, update: item });
            }
            // Barcodes
            for (const item of barcodes) {
                await prisma.barcode.upsert({ where: { id: item.id }, create: item, update: item });
            }

            await updateSetting('LAST_SYNC_PULL_TIME', new Date().toISOString());
        }

        // 2. PUSH DATA TO SERVER
        const shifts = await prisma.shift.findMany({ where: { updatedAt: { gt: lastSyncPush } } });
        const orders = await prisma.order.findMany({ where: { updatedAt: { gt: lastSyncPush } } });
        const orderItems = await prisma.orderItem.findMany({ where: { updatedAt: { gt: lastSyncPush } } });

        if (shifts.length > 0 || orders.length > 0 || orderItems.length > 0) {
            const pushRes = await fetch(`${DEFAULT_SYNC_URL}/api/sync/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shifts, orders, orderItems })
            });

            if (!pushRes.ok) {
                throw new Error(`Server push returned ${pushRes.status}`);
            }

            const pushResult = await pushRes.json();
            if (pushResult.success) {
                await updateSetting('LAST_SYNC_PUSH_TIME', new Date().toISOString());
            }
        }

        return { success: true, message: 'Sinxronlash muvaffaqiyatli yakunlandi' };
    } catch (error: any) {
        console.error('Sync error:', error);
        return { success: false, error: error.message || 'Sinxronlashda xatolik yuz berdi' };
    }
}

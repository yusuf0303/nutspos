import { prisma } from './prisma';

export async function resolveUserConflict(item: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: item.email } });
    if (existingUser && existingUser.id !== item.id) {
        console.log(`[Sync] Resolving user email conflict for ${item.email}: local ID ${existingUser.id} -> server ID ${item.id}`);
        
        // Update related tables to point to the new ID
        await prisma.$executeRawUnsafe(`UPDATE "Order" SET userId = ? WHERE userId = ?`, item.id, existingUser.id);
        await prisma.$executeRawUnsafe(`UPDATE "PurchaseOrder" SET userId = ? WHERE userId = ?`, item.id, existingUser.id);
        await prisma.$executeRawUnsafe(`UPDATE "Shift" SET userId = ? WHERE userId = ?`, item.id, existingUser.id);
        await prisma.$executeRawUnsafe(`UPDATE "InventoryAdjustment" SET userId = ? WHERE userId = ?`, item.id, existingUser.id);
        await prisma.$executeRawUnsafe(`UPDATE "StockTransfer" SET userId = ? WHERE userId = ?`, item.id, existingUser.id);
        
        // Update the User table ID directly
        await prisma.$executeRawUnsafe(`UPDATE "User" SET id = ? WHERE id = ?`, item.id, existingUser.id);
    }
}

export async function resolveProductConflict(item: any) {
    const existingProduct = await prisma.product.findUnique({ where: { sku: item.sku } });
    if (existingProduct && existingProduct.id !== item.id) {
        console.log(`[Sync] Resolving product SKU conflict for ${item.sku}: local ID ${existingProduct.id} -> server ID ${item.id}`);
        
        // Update references to product ID
        await prisma.$executeRawUnsafe(`UPDATE "Inventory" SET productId = ? WHERE productId = ?`, item.id, existingProduct.id);
        await prisma.$executeRawUnsafe(`UPDATE "OrderItem" SET productId = ? WHERE productId = ?`, item.id, existingProduct.id);
        await prisma.$executeRawUnsafe(`UPDATE "PurchaseOrderItem" SET productId = ? WHERE productId = ?`, item.id, existingProduct.id);
        await prisma.$executeRawUnsafe(`UPDATE "AdjustmentItem" SET productId = ? WHERE productId = ?`, item.id, existingProduct.id);
        await prisma.$executeRawUnsafe(`UPDATE "TransferItem" SET productId = ? WHERE productId = ?`, item.id, existingProduct.id);
        await prisma.$executeRawUnsafe(`UPDATE "Barcode" SET productId = ? WHERE productId = ?`, item.id, existingProduct.id);
        
        // Update the Product table ID directly
        await prisma.$executeRawUnsafe(`UPDATE "Product" SET id = ? WHERE id = ?`, item.id, existingProduct.id);
    }
}

export async function resolveBarcodeConflict(item: any) {
    const existingBarcode = await prisma.barcode.findUnique({ where: { code: item.code } });
    if (existingBarcode && existingBarcode.id !== item.id) {
        console.log(`[Sync] Resolving barcode code conflict for ${item.code}: local ID ${existingBarcode.id} -> server ID ${item.id}`);
        
        // Just delete the old local barcode to avoid duplicate code violation
        await prisma.barcode.delete({ where: { id: existingBarcode.id } });
    }
}

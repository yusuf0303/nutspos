'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// 1. Create a new Inventory Adjustment Document
export async function createAdjustment(branchId: string, reason?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const adjustment = await prisma.inventoryAdjustment.create({
            data: {
                branchId,
                userId: session.user.id,
                reason: reason || "Inventarizatsiya",
                status: "PENDING"
            }
        });

        revalidatePath('/warehouse/inventory');
        return { success: true, id: adjustment.id };
    } catch (error: any) {
        console.error("Create Adjustment Error:", error);
        return { success: false, error: error.message };
    }
}

// 2. Add or Update Item in Adjustment Document
export async function updateAdjustmentItem(adjustmentId: string, productId: string, actualQuantity: number) {
    try {
        const adjustment = await prisma.inventoryAdjustment.findUnique({
            where: { id: adjustmentId },
            include: { branch: true }
        });

        if (!adjustment || adjustment.status !== "PENDING") {
            return { success: false, error: "Hujjat topilmadi yoki tahrirlab bo'lmaydi." };
        }

        // Get expected quantity from current inventory
        const inventory = await prisma.inventory.findUnique({
            where: {
                productId_branchId: {
                    productId,
                    branchId: adjustment.branchId
                }
            }
        });

        const expectedQuantity = inventory?.quantity || 0;

        const existingItem = await prisma.adjustmentItem.findFirst({
            where: { adjustmentId, productId }
        });

        if (existingItem) {
            await prisma.adjustmentItem.update({
                where: { id: existingItem.id },
                data: { actualQuantity }
            });
        } else {
            await prisma.adjustmentItem.create({
                data: {
                    adjustmentId,
                    productId,
                    expectedQuantity,
                    actualQuantity
                }
            });
        }

        revalidatePath(`/warehouse/inventory/adjustments/${adjustmentId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Update Adjustment Item Error:", error);
        return { success: false, error: error.message };
    }
}

// 3. Complete Adjustment - Update Inventory
export async function completeAdjustment(adjustmentId: string) {
    try {
        const adjustment = await prisma.inventoryAdjustment.findUnique({
            where: { id: adjustmentId },
            include: { items: true }
        });

        if (!adjustment || adjustment.status !== "PENDING") {
            return { success: false, error: "Hujjat topilmadi yoki allaqachon yakunlangan." };
        }

        if (adjustment.items.length === 0) {
            return { success: false, error: "Hujjatda mahsulotlar yo'q." };
        }

        // Update Inventory for each item
        await prisma.$transaction(async (tx) => {
            for (const item of adjustment.items) {
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: adjustment.branchId
                        }
                    },
                    update: { quantity: item.actualQuantity },
                    create: {
                        productId: item.productId,
                        branchId: adjustment.branchId,
                        quantity: item.actualQuantity
                    }
                });
            }

            await tx.inventoryAdjustment.update({
                where: { id: adjustmentId },
                data: { status: "COMPLETED" }
            });
        });

        revalidatePath('/warehouse/inventory');
        revalidatePath('/warehouse/products');
        return { success: true };
    } catch (error: any) {
        console.error("Complete Adjustment Error:", error);
        return { success: false, error: error.message };
    }
}

// 4. Get Inventory Summary (Total + Branch-wise + Pending Adjustments)
export async function getInventorySummary() {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                inventory: {
                    include: { branch: true }
                }
            }
        });

        const branches = await prisma.branch.findMany();

        const pendingAdjustments = await prisma.inventoryAdjustment.findMany({
            where: { status: "PENDING" },
            include: { branch: true, user: true },
            orderBy: { createdAt: 'desc' }
        });

        const completedAdjustments = await prisma.inventoryAdjustment.findMany({
            where: { status: "COMPLETED" },
            include: { branch: true, user: true },
            orderBy: { updatedAt: 'desc' },
            take: 20
        });

        const summary = products.map(p => {
            const totalStock = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            const branchStock = branches.map(b => ({
                branchName: b.name,
                branchId: b.id,
                quantity: p.inventory.find(inv => inv.branchId === b.id)?.quantity || 0
            }));

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                unit: p.unit,
                category: p.category.name,
                totalStock,
                branchStock
            };
        });

        return { success: true, data: summary, branches, pendingAdjustments, completedAdjustments };
    } catch (error: any) {
        console.error("Get Inventory Summary Error:", error);
        return { success: false, error: error.message };
    }
}

// 5. Remove Item from Adjustment Document
export async function removeAdjustmentItem(itemId: string) {
    try {
        const item = await prisma.adjustmentItem.findUnique({
            where: { id: itemId },
            include: { adjustment: true }
        });
        if (!item) return { success: false, error: "Item not found" };

        await prisma.adjustmentItem.delete({
            where: { id: itemId }
        });
        
        revalidatePath(`/warehouse/inventory/adjustments/${item.adjustmentId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Remove Adjustment Item Error:", error);
        return { success: false, error: error.message };
    }
}

// 6. Revert Completed Adjustment
export async function revertAdjustment(adjustmentId: string) {
    try {
        const adjustment = await prisma.inventoryAdjustment.findUnique({
            where: { id: adjustmentId },
            include: { items: true }
        });

        if (!adjustment || adjustment.status !== "COMPLETED") {
            return { success: false, error: "Hujjat topilmadi yoki u yakunlanmagan." };
        }

        await prisma.$transaction(async (tx) => {
            for (const item of adjustment.items) {
                // Calculate the difference that was originally applied
                const diff = item.actualQuantity - item.expectedQuantity;

                // Find current inventory
                const inventory = await tx.inventory.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: adjustment.branchId
                        }
                    }
                });

                if (inventory) {
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: {
                            quantity: inventory.quantity - diff
                        }
                    });
                }
            }

            await tx.inventoryAdjustment.update({
                where: { id: adjustmentId },
                data: { status: "PENDING" }
            });
        });

        revalidatePath('/warehouse/inventory');
        revalidatePath('/warehouse/products');
        revalidatePath(`/warehouse/inventory/adjustments/${adjustmentId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Revert Adjustment Error:", error);
        return { success: false, error: error.message };
    }
}

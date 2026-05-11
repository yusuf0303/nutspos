'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// 1. Create a new Stock Transfer Document
export async function createTransfer(fromBranchId: string, toBranchId: string, reason?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (fromBranchId === toBranchId) {
        return { success: false, error: "Jo'natuvchi va qabul qiluvchi filiallar bir xil bo'lishi mumkin emas." };
    }

    try {
        const transfer = await prisma.stockTransfer.create({
            data: {
                fromBranchId,
                toBranchId,
                userId: session.user.id,
                reason: reason || "Filiallar orasida ko'chirish",
                status: "PENDING"
            }
        });

        revalidatePath('/warehouse/transfers');
        return { success: true, id: transfer.id };
    } catch (error: any) {
        console.error("Create Transfer Error:", error);
        return { success: false, error: error.message };
    }
}

// 2. Add or Update Item in Transfer Document
export async function updateTransferItem(transferId: string, productId: string, quantity: number) {
    try {
        const transfer = await prisma.stockTransfer.findUnique({
            where: { id: transferId }
        });

        if (!transfer || transfer.status !== "PENDING") {
            return { success: false, error: "Hujjat topilmadi yoki tahrirlab bo'lmaydi." };
        }

        const existingItem = await prisma.transferItem.findFirst({
            where: { transferId, productId }
        });

        if (existingItem) {
            await prisma.transferItem.update({
                where: { id: existingItem.id },
                data: { quantity }
            });
        } else {
            await prisma.transferItem.create({
                data: { transferId, productId, quantity }
            });
        }

        revalidatePath(`/warehouse/transfers/${transferId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Update Transfer Item Error:", error);
        return { success: false, error: error.message };
    }
}

// 3. Remove item from Transfer
export async function removeTransferItem(itemId: string) {
    try {
        await prisma.transferItem.delete({ where: { id: itemId } });
        revalidatePath('/warehouse/transfers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 4. Complete Transfer - Move stock between branches
export async function completeTransfer(transferId: string) {
    try {
        const transfer = await prisma.stockTransfer.findUnique({
            where: { id: transferId },
            include: { items: true }
        });

        if (!transfer || transfer.status !== "PENDING") {
            return { success: false, error: "Hujjat topilmadi yoki allaqachon yakunlangan." };
        }

        if (transfer.items.length === 0) {
            return { success: false, error: "Hujjatda mahsulotlar yo'q." };
        }

        // Validate sufficient stock in source branch
        for (const item of transfer.items) {
            const fromInv = await prisma.inventory.findUnique({
                where: {
                    productId_branchId: {
                        productId: item.productId,
                        branchId: transfer.fromBranchId
                    }
                }
            });
            if (!fromInv || fromInv.quantity < item.quantity) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                return { 
                    success: false, 
                    error: `"${product?.name}" mahsulotidan jo'natuvchi filialda yetarli qoldiq yo'q. Mavjud: ${fromInv?.quantity || 0}` 
                };
            }
        }

        // Execute transfer in a transaction
        await prisma.$transaction(async (tx) => {
            for (const item of transfer.items) {
                // Deduct from source branch
                await tx.inventory.update({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: transfer.fromBranchId
                        }
                    },
                    data: { quantity: { decrement: item.quantity } }
                });

                // Add to destination branch
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: transfer.toBranchId
                        }
                    },
                    update: { quantity: { increment: item.quantity } },
                    create: {
                        productId: item.productId,
                        branchId: transfer.toBranchId,
                        quantity: item.quantity
                    }
                });
            }

            await tx.stockTransfer.update({
                where: { id: transferId },
                data: { status: "COMPLETED" }
            });
        });

        revalidatePath('/warehouse/transfers');
        revalidatePath('/warehouse/inventory');
        return { success: true };
    } catch (error: any) {
        console.error("Complete Transfer Error:", error);
        return { success: false, error: error.message };
    }
}

// 5. Get all transfers list
export async function getTransfers() {
    try {
        const transfers = await prisma.stockTransfer.findMany({
            include: {
                fromBranch: true,
                toBranch: true,
                user: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: transfers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

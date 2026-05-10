'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createBranch(data: {
    name: string;
    address?: string;
    phone?: string;
}) {
    try {
        const branch = await prisma.branch.create({
            data
        });

        revalidatePath('/warehouse/branches');
        return { success: true, branch };
    } catch (error: any) {
        console.error("Create Branch Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateBranch(id: string, data: {
    name?: string;
    address?: string;
    phone?: string;
}) {
    try {
        await prisma.branch.update({
            where: { id },
            data
        });

        revalidatePath('/warehouse/branches');
        return { success: true };
    } catch (error: any) {
        console.error("Update Branch Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteBranch(id: string) {
    try {
        await prisma.branch.delete({
            where: { id }
        });

        revalidatePath('/warehouse/branches');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Branch Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getBranches() {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, branches };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

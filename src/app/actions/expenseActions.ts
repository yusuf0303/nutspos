'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addExpense(data: {
    description: string;
    amount: number;
    category: string;
    date: Date;
    branchId?: string | null;
}) {
    try {
        await prisma.expense.create({
            data: {
                description: data.description,
                amount: data.amount,
                category: data.category,
                date: data.date,
                branchId: data.branchId || null
            }
        });

        revalidatePath('/warehouse/expenses');
        revalidatePath('/warehouse'); // Dashboard might show expense summary

        return { success: true };
    } catch (error: any) {
        console.error("Expense Creation Error:", error);
        return { success: false, error: error.message };
    }
}

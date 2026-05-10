'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: {
    name: string,
    email?: string,
    phone?: string,
    address?: string
}) {
    try {
        if (data.phone) {
            const existingCustomer = await prisma.customer.findFirst({
                where: { phone: data.phone }
            });
            if (existingCustomer) {
                return { success: false, error: "Ushbu telefon raqamiga ega mijoz bazada mavjud!" };
            }
        }

        const customer = await prisma.customer.create({
            data: { ...data, points: 0 }
        });

        revalidatePath('/warehouse/customers');
        return { success: true, customer };
    } catch (error: any) {
        console.error("Create Customer Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateCustomer(id: string, data: {
    name?: string,
    email?: string,
    phone?: string,
    address?: string,
    points?: number
}) {
    try {
        if (data.phone) {
            const existingCustomer = await prisma.customer.findFirst({
                where: { phone: data.phone, id: { not: id } }
            });
            if (existingCustomer) {
                return { success: false, error: "Ushbu telefon raqamiga ega boshqa mijoz bazada mavjud!" };
            }
        }

        await prisma.customer.update({
            where: { id },
            data
        });

        revalidatePath('/warehouse/customers');
        return { success: true };
    } catch (error: any) {
        console.error("Update Customer Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteCustomer(id: string) {
    try {
        await prisma.customer.delete({
            where: { id }
        });

        revalidatePath('/warehouse/customers');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Customer Error:", error);
        return { success: false, error: error.message };
    }
}

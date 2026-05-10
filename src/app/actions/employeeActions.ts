'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function createEmployee(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    branchId?: string;
}) {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const employee = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword
            }
        });

        revalidatePath('/warehouse/employees');
        return { success: true, employee };
    } catch (error: any) {
        console.error("Create Employee Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateEmployee(id: string, data: {
    name?: string;
    email?: string;
    role?: Role;
    branchId?: string;
}) {
    try {
        await prisma.user.update({
            where: { id },
            data
        });

        revalidatePath('/warehouse/employees');
        return { success: true };
    } catch (error: any) {
        console.error("Update Employee Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteEmployee(id: string) {
    try {
        await prisma.user.delete({
            where: { id }
        });

        revalidatePath('/warehouse/employees');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Employee Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getEmployees() {
    try {
        const employees = await prisma.user.findMany({
            include: { branch: true },
            orderBy: { name: 'asc' }
        });
        return { success: true, employees };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key }
        });
        return setting?.value ?? defaultValue;
    } catch (error) {
        console.error(`Get Setting Error [${key}]:`, error);
        return defaultValue;
    }
}

export async function updateSetting(key: string, value: string) {
    try {
        await prisma.globalSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        revalidatePath('/warehouse/settings');
        revalidatePath('/pos/terminal');
        return { success: true };
    } catch (error: any) {
        console.error(`Update Setting Error [${key}]:`, error);
        return { success: false, error: error.message };
    }
}

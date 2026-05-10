'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
    let redirectTo = '/pos';
    try {
        const result = await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirect: false,
        });

        if (result?.error) {
            return { error: 'Elektron pochta yoki parol noto\'g\'ri.' };
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Elektron pochta yoki parol noto\'g\'ri.' };
                default:
                    return { error: 'Tizimga kirishda xatolik yuz berdi.' };
            }
        }
        throw error;
    }
    
    // If successful, redirect manually
    redirect(redirectTo);
}

export async function logoutAction() {
    await signOut();
}

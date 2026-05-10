'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function loginAction(prevState: any, formData: FormData) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Elektron pochta yoki parol noto\'g\'ri.' };
                default:
                    return { error: 'Tizimga kirishda xatolik yuz berdi.' };
            }
        }
        throw error; // Rethrow NEXT_REDIRECT
    }
}

export async function logoutAction() {
    await signOut();
}

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Yuklanmoqda...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const [isPending, setIsPending] = useState(false);
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('callbackUrl') || '/pos';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            // next-auth/react orqali client-side login (Server Action ishlatmasdan)
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                showToast('Elektron pochta yoki parol noto\'g\'ri.', 'error');
            } else {
                // Login muvaffaqiyatli bo'lsa yo'naltirish
                window.location.href = redirectTo;
            }
        } catch (error) {
            showToast('Tizimga kirishda xatolik yuz berdi.', 'error');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
            background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Xush Kelibsiz</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>NUTS POS & Ombor tizimiga kiring</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Elektron Pochta</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="admin@nuts.com"
                            required
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Parol</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    <button type="submit" disabled={isPending} className="btn" style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '1rem', opacity: isPending ? 0.7 : 1 }}>
                        {isPending ? 'Kirilmoqda...' : 'Tizimga Kirish'}
                    </button>
                </form>
            </div>
        </div>
    );
}

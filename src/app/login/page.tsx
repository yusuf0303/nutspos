'use client';

import { useActionState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/authActions';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Yuklanmoqda...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, null);
    const { showToast } = useToast();

    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('callbackUrl') || '/pos';

    useEffect(() => {
        if (state?.error) {
            showToast(state.error, 'error');
        }
    }, [state, showToast]);

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
                    action={formAction}
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

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function FilterBar({ categories }: { categories: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        startTransition(() => {
            router.replace(`/warehouse/products?${params.toString()}`);
        });
    };

    const handleCategoryChange = (catId: string) => {
        const params = new URLSearchParams(searchParams);
        if (catId) {
            params.set('category', catId);
        } else {
            params.delete('category');
        }
        startTransition(() => {
            router.replace(`/warehouse/products?${params.toString()}`);
        });
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
                <input
                    type="text"
                    placeholder="Nomi yoki SKU bo'yicha qidirish..."
                    defaultValue={searchParams.get('search')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                    }}
                />
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            </div>

            <select
                defaultValue={searchParams.get('category')?.toString()}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '200px'
                }}
            >
                <option value="">Barcha Kategoriyalar</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            {isPending && (
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                    Yangilanmoqda...
                </div>
            )}
        </div>
    );
}

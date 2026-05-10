'use client';

import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
    const { t, lang } = useLanguage();

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{ width: '260px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                            NUTS
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('warehouseSystem')}</p>
                    </div>
                    <LanguageSwitcher />
                </div>
                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    <Link href="/warehouse" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('dashboard')}
                    </Link>
                    <Link href="/warehouse/products" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('products')}
                    </Link>
                    <Link href="/warehouse/categories" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('categories')}
                    </Link>
                    <Link href="/warehouse/inventory" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('inventory')}
                    </Link>
                    <Link href="/warehouse/purchases" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {lang === 'uz' ? 'Ta\'minotlar' : 'Purchases'}
                    </Link>
                    <Link href="/warehouse/expenses" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {lang === 'uz' ? 'Xarajatlar' : 'Expenses'}
                    </Link>
                    <Link href="/warehouse/suppliers" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {lang === 'uz' ? 'Ta\'minotchilar' : 'Suppliers'}
                    </Link>
                    <Link href="/warehouse/sales" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('sales')}
                    </Link>
                    <Link href="/warehouse/customers" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('customers')}
                    </Link>
                    <Link href="/warehouse/branches" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('branches')}
                    </Link>
                    <Link href="/warehouse/employees" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('employees')}
                    </Link>
                    <Link href="/warehouse/shifts" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500 }} className="nav-link">
                        {t('shifts')}
                    </Link>
                    <Link href="/warehouse/settings" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background 0.2s', fontWeight: 500, borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }} className="nav-link">
                        {lang === 'uz' ? '⚙️ Sozlamalar' : '⚙️ Settings'}
                    </Link>
                </nav>
                <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                    <Link href="/pos" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                        {t('openPos')}
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
                {children}
            </main>
        </div>
    )
}

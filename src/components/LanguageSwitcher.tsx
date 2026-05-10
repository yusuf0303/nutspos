'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
    const { lang, setLang } = useLanguage();

    return (
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button
                onClick={() => setLang('uz')}
                style={{
                    padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '2px', border: 'none', cursor: 'pointer',
                    background: lang === 'uz' ? 'var(--accent-primary)' : 'transparent',
                    color: lang === 'uz' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: lang === 'uz' ? 600 : 400
                }}
            >
                UZ
            </button>
            <button
                onClick={() => setLang('en')}
                style={{
                    padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '2px', border: 'none', cursor: 'pointer',
                    background: lang === 'en' ? 'var(--accent-primary)' : 'transparent',
                    color: lang === 'en' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: lang === 'en' ? 600 : 400
                }}
            >
                EN
            </button>
        </div>
    );
}

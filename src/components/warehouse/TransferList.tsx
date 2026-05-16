'use client';

import Link from 'next/link';

const statusColor: Record<string, string> = {
    PENDING: 'var(--warning)',
    COMPLETED: 'var(--success)',
    CANCELLED: 'var(--danger)'
};

const statusLabel: Record<string, string> = {
    PENDING: 'Kutilmoqda',
    COMPLETED: 'Yakunlandi',
    CANCELLED: 'Bekor qilindi'
};

import { deleteTransfer } from '@/app/actions/transferActions';
import { useToast } from '@/context/ToastContext';

export default function TransferList({ transfers }: { transfers: any[] }) {
    const { showToast } = useToast();
    const formatDate = (d: Date) => {
        const date = new Date(d);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu hujjatni o'chirishni tasdiqlaysizmi?")) {
            const res = await deleteTransfer(id);
            if (res.success) {
                showToast("Hujjat o'chirildi", "success");
            } else {
                showToast("Xato: " + res.error, "error");
            }
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ko'chirish Hujjatlari</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Filiallar orasidagi mahsulot harakatlarini boshqaring.</p>
                </div>
                <Link href="/warehouse/transfers/new" className="btn">
                    + Yangi Ko'chirish
                </Link>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Hujjat Kodi</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Sana</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Mas'ul Shaxs</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Jo'natuvchi</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Qabul Qiluvchi</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, textAlign: 'center' }}>Mahsulotlar</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, textAlign: 'center' }}>Holat</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.length === 0 ? (
                            <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Ko'chirish hujjatlari topilmadi</td></tr>
                        ) : (
                            transfers.map((t: any) => (
                                <tr key={t.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/warehouse/transfers/${t.id}`} style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none', fontFamily: 'monospace' }}>
                                            MVT-{t.id.slice(-7).toUpperCase()}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{formatDate(t.createdAt)}</td>
                                    <td style={{ padding: '1rem' }}>{t.user?.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {t.fromBranch?.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {t.toBranch?.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{t.items?.length || 0} ta</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', background: `${statusColor[t.status]}20`, color: statusColor[t.status], borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {statusLabel[t.status] || t.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {t.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                style={{ padding: '0.4rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                title="Hujjatni o'chirish"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

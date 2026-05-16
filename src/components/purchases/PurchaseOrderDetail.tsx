'use client';

import Link from 'next/link';

export default function PurchaseOrderDetail({ po }: { po: any }) {
    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <Link href="/warehouse/purchases" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ← Orqaga
                        </Link>
                        <h1 style={{ fontSize: '2rem', margin: 0 }}>Hujjat: {po.documentNumber}</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Yaratilgan sana: {new Date(po.createdAt).toLocaleString()} | Holati: 
                        <span style={{ 
                            marginLeft: '0.5rem',
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            background: po.status === 'RECEIVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: po.status === 'RECEIVED' ? 'var(--success)' : 'var(--warning)',
                            border: `1px solid ${po.status === 'RECEIVED' ? 'var(--success)' : 'var(--warning)'}22`
                        }}>
                            {po.status === 'RECEIVED' ? 'QABUL QILINDI' : 'KUTILMOQDA'}
                        </span>
                    </p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Ma'lumotlar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Yetkazib beruvchi:</span>
                            <span style={{ fontWeight: 600 }}>{po.supplier.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Qabul qiluvchi filial:</span>
                            <span style={{ fontWeight: 600 }}>{po.branch?.name || 'Markaziy ombor'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Mas'ul shaxs:</span>
                            <span style={{ fontWeight: 600 }}>{po.user.name}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Hujjat izohi</h3>
                    <div style={{ color: 'var(--text-primary)', fontStyle: po.note ? 'normal' : 'italic' }}>
                        {po.note || "Izoh qoldirilmagan."}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                    Mahsulotlar ro'yxati
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Mahsulot</th>
                            <th style={{ padding: '1rem' }}>SKU</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Soni</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Kirim Narxi</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Jami</th>
                        </tr>
                    </thead>
                    <tbody>
                        {po.items.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{item.product.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.product.sku}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{item.quantity} {item.product.unit}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{item.cost.toLocaleString()} so'm</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>{(item.quantity * item.cost).toLocaleString()} so'm</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot style={{ background: 'var(--bg-tertiary)', fontWeight: 700 }}>
                        <tr>
                            <td colSpan={4} style={{ padding: '1rem', textAlign: 'right' }}>UMUMIY SUMMA:</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                                {po.totalAmount.toLocaleString()} so'm
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

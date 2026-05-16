import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ReceivePOButton from '@/components/purchases/ReceivePOButton';

export default async function PurchaseOrdersPage() {
    const purchases = await prisma.purchaseOrder.findMany({
        include: { supplier: true, user: true, items: true, branch: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Ta'minot Buyurtmalari</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Yetkazib beruvchilardan mahsulot sotib olish va kirim qilish.</p>
                </div>
                <Link href="/warehouse/purchases/new" className="btn">+ Yangi Buyurtma</Link>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Hujjat #</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Yetkazib beruvchi</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Filial</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Sana</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Jami</th>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Hali ta'minot buyurtmalari mavjud emas.
                                </td>
                            </tr>
                        ) : (
                            purchases.map((po: any) => (
                                <tr key={po.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{po.documentNumber || po.id.slice(-6).toUpperCase()}</td>
                                    <td style={{ padding: '1rem' }}>{po.supplier.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{po.branch?.name || '---'}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{po.createdAt.toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.625rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                            background: po.status === 'RECEIVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: po.status === 'RECEIVED' ? 'var(--success)' : 'var(--warning)',
                                            border: `1px solid ${po.status === 'RECEIVED' ? 'var(--success)' : 'var(--warning)'}22`
                                        }}>
                                            {po.status === 'RECEIVED' ? 'QABUL QILINDI' : 'KUTILMOQDA'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 700 }}>{po.totalAmount.toLocaleString()} so'm</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                        <ReceivePOButton poId={po.id} status={po.status} />
                                        <Link href={`/warehouse/purchases/${po.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}>
                                            Batafsil
                                        </Link>
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

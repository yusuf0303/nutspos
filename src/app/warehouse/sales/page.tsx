import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import RefundButton from '@/components/sales/RefundButton';

export default async function SalesHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const orderId = typeof resolvedParams.id === 'string' ? resolvedParams.id : undefined;

    if (orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                user: true,
                items: { include: { product: true } }
            }
        });

        if (!order) return <div>Buyurtma topilmadi</div>;

        return (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/warehouse/sales" className="btn btn-secondary" style={{ padding: '0.5rem' }}>← Orqaga</Link>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Buyurtma #{order.id.slice(-6).toUpperCase()}</h1>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '1.25rem' }}>Tranzaksiya Holati</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                                <span style={{ color: order.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                                    {order.status === 'COMPLETED' ? 'YAKUNLANDI' : 'QAYTARILDI'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>To'lov turi:</span>
                                <span style={{ fontWeight: 500 }}>
                                    {order.paymentType === 'CASH' ? 'Naqd' : order.paymentType === 'CARD' ? 'Karta' : order.paymentType === 'CLICK' ? 'Click' : 'Aralash'}
                                </span>
                            </div>
                            {order.paymentType === 'SPLIT' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', marginTop: '0.25rem' }}>
                                    {order.cashAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-muted)' }}>Naqd:</span><span>{order.cashAmount.toLocaleString()}</span></div>}
                                    {order.cardAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-muted)' }}>Karta:</span><span>{order.cardAmount.toLocaleString()}</span></div>}
                                    {order.clickAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--text-muted)' }}>Click:</span><span>{order.clickAmount.toLocaleString()}</span></div>}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Sana:</span>
                                <span>{new Date(order.createdAt).toLocaleString('uz-UZ')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Kassir:</span>
                                <span>{order.user?.name}</span>
                            </div>
                        </div>
                        <RefundButton orderId={order.id} status={order.status} />
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Mahsulot</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Miqdor</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Narxi</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Jami</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item: any) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.product.sku}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{item.price.toLocaleString()} so'm</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString()} so'm</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <td colSpan={3} style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>UMUMIY TO'LOV:</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, fontSize: '1.25rem', color: 'var(--success)' }}>{order.totalAmount.toLocaleString()} so'm</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    let orders: any[] = [];
    try {
        orders = await prisma.order.findMany({
            include: { customer: true, user: true, _count: { select: { items: true } } },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) { }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Savdo Tarixi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>O'tgan tranzaksiyalar, cheklar va daromad ma'lumotlarini ko'rib chiqing.</p>
                </div>
                <button className="btn btn-secondary">CSV formatida yuklash</button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Buyurtma ID va Sana</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Mijoz</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Mahsulotlar</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Jami / Holat</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ma'lumotlar Mavjud emas</h3>
                                    <p>Tranzaksiyalar POS orqali amalga oshirilgandan so'ng bu yerda paydo bo'ladi.</p>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', ':hover': { background: 'var(--bg-tertiary)' } } as any}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>#{order.id.slice(-6).toUpperCase()}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {order.customer?.name || 'Oddiy xaridor'}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {order._count?.items || 0} dona
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.totalAmount.toLocaleString()} so'm</div>
                                        <span style={{
                                            display: 'inline-flex', padding: '0.125rem 0.5rem',
                                            background: order.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: order.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)',
                                            borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem'
                                        }}>
                                            {order.status === 'COMPLETED' ? 'YAKUNLANDI' : 'QAYTARILDI'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link href={`/warehouse/sales?id=${order.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Batafsil</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

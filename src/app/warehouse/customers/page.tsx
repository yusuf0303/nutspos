import { prisma } from '@/lib/prisma';
import CustomerList from '@/components/warehouse/CustomerList';
import Link from 'next/link';

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const customerId = typeof resolvedParams.id === 'string' ? resolvedParams.id : undefined;

    if (customerId) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                orders: {
                    include: { _count: { select: { items: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!customer) return <div>Mijoz topilmadi</div>;

        return (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/warehouse/customers" className="btn btn-secondary" style={{ padding: '0.5rem' }}>← Orqaga</Link>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>{customer.name} - Xarid Tarixi</h1>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Mijoz Ma'lumotlari</h3>
                        <p style={{ margin: '0.5rem 0' }}><strong>Email:</strong> {customer.email || 'Mavjud emas'}</p>
                        <p style={{ margin: '0.5rem 0' }}><strong>Telefon:</strong> {customer.phone || 'Mavjud emas'}</p>
                        <p style={{ margin: '0.5rem 0' }}><strong>Sodiqlik Ballari:</strong> {customer.points}</p>
                        <p style={{ margin: '0.5rem 0' }}><strong>A'zo bo'lgan sana:</strong> {new Date(customer.createdAt).toLocaleDateString('uz-UZ')}</p>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Buyurtma ID</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Sana</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Miqdor</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Jami</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customer.orders.map((order: any) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>#{order.id.slice(-6).toUpperCase()}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</td>
                                        <td style={{ padding: '1rem' }}>{order._count.items} mahsulot</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>{order.totalAmount.toLocaleString()} so'm</td>
                                    </tr>
                                ))}
                                {customer.orders.length === 0 && (
                                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Hali xaridlar yo'q</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return <CustomerList initialCustomers={customers} />;
}

import { prisma } from '@/lib/prisma';
import FilterBar from '@/components/warehouse/FilterBar';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const searchTerm = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;
    const categoryId = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;

    let products: any[] = [];
    let categories: any[] = [];

    try {
        categories = await prisma.category.findMany();
        products = await prisma.product.findMany({
            where: {
                AND: [
                    searchTerm ? {
                        OR: [
                            { name: { contains: searchTerm } },
                            { sku: { contains: searchTerm } }
                        ]
                    } : {},
                    categoryId ? { categoryId } : {}
                ]
            },
            include: { category: true, inventory: true },
            orderBy: { updatedAt: 'desc' }
        });
    } catch (error) { }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mahsulotlar Galereyasi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Katalog, zaxira tafsilotlari va narxlarni boshqaring.</p>
                </div>
                <a href="/warehouse/products/new" className="btn">+ Mahsulot Qo'shish</a>
            </header>

            <FilterBar categories={categories} />

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>SKU va Nomi</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Kategoriya</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Zaxira</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Narxi / Birlik</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Mahsulot Topilmadi</h3>
                                    <p>{searchTerm || categoryId ? "Qidiruv bo'yicha hech narsa topilmadi." : "Mahsulotlar katalogini yaratishni boshlang."}</p>
                                </td>
                            </tr>
                        ) : (
                            products.map((product: any) => {
                                const stock = product.inventory?.[0]?.quantity || 0;
                                let statusColor = 'var(--success)';
                                let statusBg = 'rgba(16, 185, 129, 0.1)';
                                let statusText = 'Mavjud';

                                if (stock === 0) {
                                    statusColor = 'var(--danger)';
                                    statusBg = 'rgba(239, 68, 68, 0.1)';
                                    statusText = 'Tugagan';
                                } else if (stock < 10) {
                                    statusColor = 'var(--warning)';
                                    statusBg = 'rgba(245, 158, 11, 0.1)';
                                    statusText = 'Kam qolgan';
                                }

                                return (
                                    <tr key={product.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{product.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{product.sku}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem',
                                                background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500
                                            }}>
                                                {product.category?.name || 'Kategoriyasiz'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.125rem 0.625rem', background: statusBg, color: statusColor,
                                                    borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${statusColor.replace('var(', 'rgba(').replace(')', ', 0.2)')}`
                                                }}>
                                                    {statusText}
                                                </span>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{stock} {product.unit || 'dona'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.price.toLocaleString()} so'm</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>1 {product.unit || 'dona'} uchun</div>
                                        </td>
                                        <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <ProductActionButtons productId={product.id} />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import ProductActionButtons from '@/components/warehouse/ProductActionButtons';

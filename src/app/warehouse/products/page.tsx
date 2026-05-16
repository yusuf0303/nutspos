import { prisma } from '@/lib/prisma';
import FilterBar from '@/components/warehouse/FilterBar';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const searchTerm = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;
    const categoryId = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
    const stockStatus = typeof resolvedParams.stockStatus === 'string' ? resolvedParams.stockStatus : undefined;
    const sortBy = typeof resolvedParams.sortBy === 'string' ? resolvedParams.sortBy : 'updatedAt';
    const sortOrder = resolvedParams.sortOrder === 'asc' ? 'asc' : 'desc';
    const unit = typeof resolvedParams.unit === 'string' ? resolvedParams.unit : undefined;

    let products: any[] = [];
    let categories: any[] = [];
    let units: string[] = [];

    try {
        categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        
        // Robust way to get unique units from database
        const allUnits = await prisma.product.findMany({
            select: { unit: true }
        });
        units = Array.from(new Set(allUnits.map(u => u.unit).filter(Boolean))) as string[];
        
        const whereClause: any = {
            AND: [
                searchTerm ? {
                    OR: [
                        { name: { contains: searchTerm } },
                        { sku: { contains: searchTerm } }
                    ]
                } : {},
                categoryId ? { categoryId } : {},
                unit ? { unit } : {}
            ]
        };

        const orderByClause: any = {};
        if (sortBy === 'category') {
            orderByClause.category = { name: sortOrder };
        } else if (['name', 'sku', 'price', 'updatedAt'].includes(sortBy)) {
            orderByClause[sortBy] = sortOrder;
        } else {
            orderByClause.updatedAt = 'desc';
        }

        products = await prisma.product.findMany({
            where: whereClause,
            include: { category: true, inventory: true },
            orderBy: Object.keys(orderByClause).length > 0 ? orderByClause : undefined
        });

        // In-memory stock filtering (Complex because it relies on relation sum)
        if (stockStatus) {
            products = products.filter(p => {
                const stock = p.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0;
                if (stockStatus === 'OUT') return stock === 0;
                if (stockStatus === 'LOW') return stock > 0 && stock < 10;
                if (stockStatus === 'IN') return stock >= 10;
                return true;
            });
        }

        // In-memory stock sorting
        if (sortBy === 'stock') {
            products.sort((a, b) => {
                const stockA = a.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0;
                const stockB = b.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0;
                return sortOrder === 'asc' ? stockA - stockB : stockB - stockA;
            });
        }

    } catch (error) {
        console.error("Products Page Error:", error);
    }

    const getSortLink = (field: string) => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (categoryId) params.set('category', categoryId);
        if (stockStatus) params.set('stockStatus', stockStatus);
        if (unit) params.set('unit', unit);
        
        const isCurrent = sortBy === field;
        const nextOrder = isCurrent && sortOrder === 'asc' ? 'desc' : 'asc';
        
        params.set('sortBy', field);
        params.set('sortOrder', nextOrder);
        
        return `?${params.toString()}`;
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <span style={{ opacity: 0.3, marginLeft: '0.25rem' }}>↕</span>;
        return <span style={{ marginLeft: '0.25rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mahsulotlar Galereyasi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Katalog, zaxira tafsilotlari va narxlarni boshqaring.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {(searchTerm || categoryId || stockStatus || unit || sortBy !== 'updatedAt') && (
                        <Link 
                            href="/warehouse/products" 
                            style={{ fontSize: '0.875rem', color: 'var(--danger)', textDecoration: 'none', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                            ✕ Barchasini Tozalash
                        </Link>
                    )}
                    <a href="/warehouse/products/new" className="btn">+ Mahsulot Qo'shish</a>
                </div>
            </header>

            <FilterBar categories={categories} units={units} />

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
                                <Link href={getSortLink('name')} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                    SKU va Nomi <SortIcon field="name" />
                                </Link>
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
                                <Link href={getSortLink('category')} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                    Kategoriya <SortIcon field="category" />
                                </Link>
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
                                <Link href={getSortLink('stock')} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                    Zaxira <SortIcon field="stock" />
                                </Link>
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
                                <Link href={getSortLink('price')} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                    Narxi / Birlik <SortIcon field="price" />
                                </Link>
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Mahsulot Topilmadi</h3>
                                    <p>{searchTerm || categoryId || stockStatus ? "Qidiruv bo'yicha hech narsa topilmadi." : "Mahsulotlar katalogini yaratishni boshlang."}</p>
                                </td>
                            </tr>
                        ) : (
                            products.map((product: any) => {
                                const stock = product.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0;
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
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{Number(stock.toFixed(3))} {product.unit || 'dona'}</span>
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

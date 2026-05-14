'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateTransferItem, completeTransfer, removeTransferItem } from '@/app/actions/transferActions';
import { useToast } from '@/context/ToastContext';

export default function TransferDetail({ transfer, products }: { transfer: any, products: any[] }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const filteredProducts = useMemo(() => {
        if (searchTerm.length < 1) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [searchTerm, products]);

    const handleAddItem = async (product: any) => {
        setLoading(true);
        const result = await updateTransferItem(transfer.id, product.id, 1);
        setLoading(false);
        if (result.success) {
            setSearchTerm('');
            setShowResults(false);
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const handleUpdateQty = async (productId: string, qty: number) => {
        if (qty <= 0) return;
        await updateTransferItem(transfer.id, productId, qty);
        router.refresh();
    };

    const handleRemoveItem = async (itemId: string) => {
        await removeTransferItem(itemId);
        router.refresh();
    };

    const handleComplete = async () => {
        if (!confirm("Ko'chirishni tasdiqlaysizmi? Mahsulotlar filiallar orasida ko'chiriladi.")) return;
        setLoading(true);
        const result = await completeTransfer(transfer.id);
        setLoading(false);
        if (result.success) {
            showToast("Ko'chirish muvaffaqiyatli amalga oshirildi!", "success");
            router.push('/warehouse/transfers');
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const formatDate = (d: Date) => {
        if (!mounted) return '';
        const date = new Date(d);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    };

    const thStyle: React.CSSProperties = { padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' };
    const tdStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' };

    if (!mounted) return null;

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {/* Header */}
            <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                    Ko'chirish: Hujjat MVT-{transfer.id.slice(-7).toUpperCase()} dan {formatDate(transfer.createdAt).split(' ')[0]}
                </h1>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Jo'natuvchi: <b style={{ color: '#ef4444' }}>{transfer.fromBranch.name}</b>
                    {' → '}
                    Qabul qiluvchi: <b style={{ color: '#22c55e' }}>{transfer.toBranch.name}</b>
                    {' | '}
                    Mas'ul: <b>{transfer.user?.name}</b>
                    {' | '}
                    Holat: <b style={{ color: transfer.status === 'COMPLETED' ? 'var(--success)' : transfer.status === 'CANCELLED' ? 'var(--danger)' : 'var(--warning)' }}>
                        {transfer.status === 'PENDING' ? 'Kutilmoqda' : transfer.status === 'COMPLETED' ? 'Yakunlandi' : 'Bekor qilindi'}
                    </b>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {transfer.status === 'PENDING' && (
                    <>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="🔍 Mahsulot qidirish..."
                                style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', width: '250px' }}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                                onFocus={() => setShowResults(true)}
                            />
                            {showResults && filteredProducts.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', zIndex: 50, marginTop: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.4)' }}>
                                    {filteredProducts.map(p => (
                                        <div key={p.id} onClick={() => handleAddItem(p)}
                                            style={{ padding: '0.625rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                            className="table-row-hover">
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku} | {p.unit}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={handleComplete} disabled={loading || transfer.items.length === 0} className="btn" style={{ marginLeft: 'auto', background: 'var(--success)' }}>
                            ✅ O'tkazish
                        </button>
                    </>
                )}
                <button onClick={() => router.push('/warehouse/transfers')} className="btn btn-secondary" style={{ marginLeft: transfer.status !== 'PENDING' ? 'auto' : '0' }}>
                    ← Orqaga
                </button>
            </div>

            {/* Items Table */}
            <div style={{ overflowX: 'auto', padding: 0 }} className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>#</th>
                            <th style={{ ...thStyle, textAlign: 'left' }}>Mahsulot kodi</th>
                            <th style={{ ...thStyle, textAlign: 'left' }}>Nomi</th>
                            <th style={thStyle}>O'lchov birligi</th>
                            <th style={thStyle}>Miqdori</th>
                            {transfer.status === 'PENDING' && <th style={thStyle}>Amallar</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {transfer.items.length === 0 ? (
                            <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                Hujjatga mahsulot qo'shilmagan. Yuqoridagi qidiruvdan mahsulot tanlang.
                            </td></tr>
                        ) : (
                            transfer.items.map((item: any, index: number) => (
                                <tr key={item.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', width: '40px', color: 'var(--text-muted)' }}>{index + 1}</td>
                                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{item.product.sku}</td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{item.product.name}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>{item.product.unit}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center', width: '100px' }}>
                                        {transfer.status === 'PENDING' ? (
                                            <input
                                                type="number"
                                                min={1}
                                                step={item.product.unit === 'dona' ? "1" : "any"}
                                                defaultValue={item.quantity}
                                                onKeyDown={(e) => {
                                                    if (item.product.unit === 'dona' && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (item.product.unit === 'dona') val = Math.round(val);
                                                    handleUpdateQty(item.productId, val);
                                                }}
                                                style={{ width: '70px', padding: '0.25rem', textAlign: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontWeight: 700 }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                                        )}
                                    </td>
                                    {transfer.status === 'PENDING' && (
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>✕</button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {transfer.items.length > 0 && (
                        <tfoot>
                            <tr>
                                <td colSpan={transfer.status === 'PENDING' ? 4 : 3} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, background: 'var(--bg-tertiary)' }}>
                                    Jami mahsulotlar:
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, background: 'var(--bg-tertiary)', color: 'var(--accent-primary)' }}>
                                    {transfer.items.reduce((s: number, i: any) => s + i.quantity, 0)} dona
                                </td>
                                {transfer.status === 'PENDING' && <td style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}></td>}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

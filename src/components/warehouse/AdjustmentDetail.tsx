'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdjustmentItem, completeAdjustment, removeAdjustmentItem } from '@/app/actions/inventoryActions';
import { useToast } from '@/context/ToastContext';

export default function AdjustmentDetail({ adjustment, products }: { adjustment: any, products: any[] }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    // Filter products
    const filteredProducts = useMemo(() => {
        if (searchTerm.length < 1) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [searchTerm, products]);

    const handleAddItem = async (product: any) => {
        setLoading(true);
        const result = await updateAdjustmentItem(adjustment.id, product.id, 0); // Default 0 or keep existing
        setLoading(false);
        if (result.success) {
            setSearchTerm('');
            setShowResults(false);
            router.refresh();
        }
    };

    const handleUpdateQty = async (productId: string, qty: number) => {
        await updateAdjustmentItem(adjustment.id, productId, qty);
        router.refresh();
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!confirm("Ushbu mahsulotni ro'yxatdan o'chirishni xohlaysizmi?")) return;
        setLoading(true);
        const result = await removeAdjustmentItem(itemId);
        setLoading(false);
        if (result.success) {
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const handleComplete = async () => {
        if (!confirm("Hujjatni yakunlamoqchimisiz? Bu bazadagi qoldiqlarni o'zgartiradi.")) return;
        setLoading(true);
        const result = await completeAdjustment(adjustment.id);
        setLoading(false);
        if (result.success) {
            showToast("Inventarizatsiya yakunlandi", "success");
            router.push('/warehouse/inventory');
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    if (!mounted) return null; // Avoid hydration mismatch by not rendering on server initial pass

    // Styling
    const thStyle = { padding: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' as const, position: 'sticky' as const, top: 0, zIndex: 10 };
    const tdStyle = { padding: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' };
    const inputStyle = { width: '100%', border: 'none', background: 'transparent', color: '#0078d7', textAlign: 'center' as const, outline: 'none', fontWeight: 700 };

    // Calculate totals
    const totalExpectedSum = adjustment.items.reduce((sum: number, item: any) => sum + (item.expectedQuantity * item.product.price), 0);
    const totalActualSum = adjustment.items.reduce((sum: number, item: any) => sum + (item.actualQuantity * item.product.price), 0);
    const totalDiffSum = totalActualSum - totalExpectedSum;

    return (
        <div style={{ animation: 'fadeIn 0.3s', background: '#f5f5f5', color: '#333', padding: '1rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, color: '#444' }}>
                    Inventarizatsiya: Hujjat INV-{adjustment.id.slice(-6).toUpperCase()} dan {new Date(adjustment.createdAt).toLocaleDateString('uz-UZ')}
                </h1>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#666' }}>
                    Ombor: <b>{adjustment.branch.name.toUpperCase()}</b><br />
                    Miqdor solishtirish: Inventarizatsiya amaliyoti sanasiga
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', background: '#e0e0e0', padding: '0.25rem', border: '1px solid #ccc' }}>
                <button className="btn-erp" style={{ color: 'red' }}>✕</button>
                <button className="btn-erp" onClick={() => router.refresh()}>🔄</button>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Qidirish..." 
                        style={{ padding: '0.2rem 0.5rem', border: '1px solid #ccc', fontSize: '0.875rem', width: '200px' }}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                    />
                    {showResults && filteredProducts.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => handleAddItem(p)} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }} className="erp-item-hover">
                                    {p.name} ({p.sku})
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button className="btn-erp">Tanlash ▾</button>
                <button className="btn-erp">Nomenklaturani to'ldirish ▾</button>
                <button className="btn-erp" onClick={handleComplete} style={{ marginLeft: 'auto', background: '#4caf50', color: 'white', fontWeight: 'bold' }}>Inventarizatsiyani yopish</button>
                <button className="btn-erp" onClick={() => router.push('/warehouse/inventory')}>Saqlash va Chiqish</button>
            </div>

            {/* Main Table */}
            <div style={{ flex: 1, overflow: 'auto', background: 'white', border: '1px solid #ccc' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>Kod</th>
                            <th style={thStyle}>Nomi</th>
                            <th style={thStyle}>Sana</th>
                            <th style={thStyle}>Haqiqiy miq...</th>
                            <th style={thStyle}>Hisobdagi mi...</th>
                            <th style={thStyle}>Narx</th>
                            <th style={thStyle}>Farq</th>
                            <th style={thStyle}>Haqiqiy summa</th>
                            <th style={thStyle}>Hisobdagi summa</th>
                            <th style={thStyle}>Farq summasi</th>
                            {adjustment.status === 'PENDING' && <th style={thStyle}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {adjustment.items.map((item: any, index: number) => {
                            const diff = item.actualQuantity - item.expectedQuantity;
                            const actualSum = item.actualQuantity * item.product.price;
                            const expectedSum = item.expectedQuantity * item.product.price;
                            const diffSum = actualSum - expectedSum;

                            return (
                                <tr key={item.id} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', width: '30px' }}>{index + 1}</td>
                                    <td style={{ ...tdStyle, width: '80px' }}>{item.product.sku}</td>
                                    <td style={{ ...tdStyle }}>{item.product.name}</td>
                                    <td style={{ ...tdStyle, fontSize: '0.7rem', width: '110px' }}>{formatDate(item.updatedAt)}</td>
                                    <td style={{ ...tdStyle, width: '80px', background: '#fff' }}>
                                        <input 
                                            type="number" 
                                            step={item.product.unit === 'dona' ? "1" : "any"}
                                            style={inputStyle} 
                                            defaultValue={item.actualQuantity}
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
                                        />
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center', width: '80px', color: '#666' }}>{item.expectedQuantity}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', width: '100px' }}>{item.product.price.toLocaleString()}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center', width: '60px', color: diff < 0 ? 'red' : diff > 0 ? 'blue' : 'inherit' }}>{diff}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', width: '110px' }}>{actualSum.toLocaleString()}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', width: '110px', color: '#666' }}>{expectedSum.toLocaleString()}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right', width: '110px', fontWeight: 600 }}>{diffSum.toLocaleString()}</td>
                                    {adjustment.status === 'PENDING' && (
                                        <td style={{ ...tdStyle, textAlign: 'center', width: '40px' }}>
                                            <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 700, fontSize: '1.25rem' }} title="O'chirish">✕</button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {/* Footer Totals */}
                    </tbody>
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, boxShadow: '0 -2px 5px rgba(0,0,0,0.05)' }}>
                        <tr style={{ fontWeight: 'bold' }}>
                            <td colSpan={8} style={{ ...tdStyle, textAlign: 'right', background: '#eee' }}>JAMI:</td>
                            <td style={{ ...tdStyle, textAlign: 'right', background: '#eee' }}>{totalActualSum.toLocaleString()}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', background: '#eee' }}>{totalExpectedSum.toLocaleString()}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', background: '#eee' }}>{totalDiffSum.toLocaleString()}</td>
                            {adjustment.status === 'PENDING' && <td style={{...tdStyle, background: '#eee'}}></td>}
                        </tr>
                    </tfoot>
                </table>
            </div>

            <style jsx>{`
                .btn-erp {
                    background: transparent;
                    border: 1px solid transparent;
                    padding: 0.1rem 0.5rem;
                    font-size: 0.75rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .btn-erp:hover {
                    background: #fff;
                    border-color: #999;
                }
                .erp-item-hover:hover {
                    background: #0078d7;
                    color: white;
                }
            `}</style>
        </div>
    );
}

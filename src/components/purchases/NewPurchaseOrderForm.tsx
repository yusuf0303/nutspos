'use client';

import { useState } from 'react';
import { createPurchaseOrder } from '@/app/actions/purchaseActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function NewPurchaseOrderForm({ suppliers, products }: { suppliers: any[], products: any[] }) {
    const { showToast } = useToast();
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<{ productId: string, quantity: number, cost: number, price: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, cost: 0, price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) {
            showToast("Iltimos, yetkazib beruvchi va kamida bitta mahsulotni tanlang", "warning");
            return;
        }

        setLoading(true);
        try {
            const res = await createPurchaseOrder({
                supplierId,
                userId: 'clw1234567890', // Placeholder
                items
            });
            setLoading(false);

            if (res.success) {
                showToast("Buyurtma muvaffaqiyatli yaratildi", "success");
                router.push('/warehouse/purchases');
            } else {
                showToast("Xato: " + res.error, "error");
            }
        } catch (error) {
            setLoading(false);
            showToast("Kutilmagan xatolik yuz berdi", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Yangi Ta'minot Buyurtmasi</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Yetkazib beruvchi va mahsulotlarni tanlang.</p>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Yetkazib beruvchi</label>
                    <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        required
                    >
                        <option value="">Tanlang...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <label style={{ fontWeight: 600 }}>Mahsulotlar</label>
                        <button type="button" onClick={addItem} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}>+ Mahsulot Qo'shish</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map((item, index) => {
                            const itemCost = item.cost || 0;
                            const itemPrice = item.price || 0;
                            const itemQty = item.quantity || 0;
                            const totalCost = itemCost * itemQty;
                            const totalRevenue = itemPrice * itemQty;
                            const profit = totalRevenue - totalCost;
                            const markupPercent = itemCost > 0 ? ((itemPrice - itemCost) / itemCost * 100).toFixed(1) : 0;

                            return (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Mahsulot</label>
                                    <select
                                        value={item.productId}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            const selectedProduct = products.find(p => p.id === pid);
                                            const newItems = [...items];
                                            newItems[index].productId = pid;
                                            if (selectedProduct) {
                                                newItems[index].price = selectedProduct.price;
                                            }
                                            setItems(newItems);
                                        }}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                        required
                                    >
                                        <option value="">Tanlang...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Soni</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                            min="1"
                                            style={{ width: '100%', padding: '0.5rem', paddingRight: '3rem', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                            required
                                        />
                                        <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {products.find(p => p.id === item.productId)?.unit || ''}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Kirim Narxi</label>
                                    <input
                                        type="number"
                                        value={item.cost}
                                        onChange={(e) => updateItem(index, 'cost', parseFloat(e.target.value))}
                                        min="0"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Sotish Narxi</label>
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                                        min="0"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Ustama %</label>
                                    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {markupPercent}%
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Jami Tannarx</label>
                                    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {totalCost.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Jami Sotish</label>
                                    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {totalRevenue.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Sof Foyda</label>
                                    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', color: profit > 0 ? 'var(--success)' : profit < 0 ? 'var(--danger)' : 'var(--text-primary)', textAlign: 'right', fontWeight: 600 }}>
                                        {profit.toLocaleString()}
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeItem(index)} style={{ padding: '0.5rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
                            </div>
                        )})}
                    </div>
                    
                    {items.length > 0 && (
                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Jami Hisob-kitob</div>
                            <div style={{ display: 'flex', gap: '3rem', textAlign: 'right' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jami Tannarx (Xarajat):</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                                        {items.reduce((acc, item) => acc + ((item.quantity || 0) * (item.cost || 0)), 0).toLocaleString()} so'm
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jami Sotish (Kutilayotgan tushum):</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                                        {items.reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0).toLocaleString()} so'm
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Kutilayotgan Sof Foyda:</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {items.reduce((acc, item) => acc + ((item.quantity || 0) * ((item.price || 0) - (item.cost || 0))), 0).toLocaleString()} so'm
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                        {loading ? "Yaratilmoqda..." : "Buyurtmani Tasdiqlash"}
                    </button>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                        Bekor Qilish
                    </button>
                </div>
            </div>
        </form>
    );
}

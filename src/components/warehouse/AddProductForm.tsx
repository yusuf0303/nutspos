'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/app/actions/productActions';
import { useToast } from '@/context/ToastContext';

const UNITS = [
    { value: 'dona', label: 'Dona (pcs)' },
    { value: 'kg', label: 'Kilogramm (kg)' },
    { value: 'g', label: 'Gramm (g)' },
    { value: 'litr', label: 'Litr (L)' },
    { value: 'ml', label: 'Millilitr (ml)' },
    { value: 'm', label: 'Metr (m)' },
    { value: 'm2', label: 'Kvadrat metr (m²)' },
    { value: 'm3', label: 'Kub metr (m³)' },
    { value: 'quti', label: 'Quti (box)' },
    { value: 'juft', label: 'Juft (pair)' },
    { value: 'to\'plam', label: "To'plam (set)" },
    { value: 'paket', label: 'Paket (pack)' },
];

export default function AddProductForm({ categories, suppliers }: { categories: any[], suppliers: any[] }) {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        cost: '',
        categoryId: categories[0]?.id || '',
        supplierId: '',
        unit: 'dona',
        description: ''
    });
    const [barcodes, setBarcodes] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await createProduct({
            name: formData.name,
            sku: formData.sku,
            price: Number(formData.price),
            cost: Number(formData.cost),
            categoryId: formData.categoryId,
            supplierId: formData.supplierId || undefined,
            unit: formData.unit,
            description: formData.description,
            barcodes: barcodes.filter(b => b.trim() !== '')
        });

        setLoading(false);
        if (result.success) {
            showToast("Mahsulot muvaffaqiyatli qo'shildi", "success");
            router.push('/warehouse/products');
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const addBarcode = () => setBarcodes([...barcodes, '']);
    const removeBarcode = (index: number) => setBarcodes(barcodes.filter((_, i) => i !== index));
    const updateBarcode = (index: number, val: string) => {
        const newBarcodes = [...barcodes];
        newBarcodes[index] = val;
        setBarcodes(newBarcodes);
    };

    const iStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };
    const labelStyle = { display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '4rem', animation: 'fadeIn 0.5s' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Yangi Mahsulot</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Katalogga yangi mahsulot qo'shing.</p>
            </header>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Name + SKU */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Nomi</label>
                        <input required type="text" style={iStyle} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Asosiy SKU / Barcode</label>
                        <input required type="text" style={iStyle} value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                </div>

                {/* Additional Barcodes */}
                <div className="form-group">
                    <label style={labelStyle}>Qo'shimcha Barcodelar</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {barcodes.map((code, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    style={iStyle} 
                                    value={code} 
                                    placeholder="Barcode kiriting..."
                                    onChange={(e) => updateBarcode(index, e.target.value)} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => removeBarcode(index)}
                                    style={{ padding: '0 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={addBarcode}
                            className="btn btn-secondary"
                            style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                            + Yana qo'shish
                        </button>
                    </div>
                </div>

                {/* Category + Supplier */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Kategoriya</label>
                        <select required style={iStyle} value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Asosiy Ta'minotchi</label>
                        <select style={iStyle} value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}>
                            <option value="">— Tanlang —</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Price + Cost + Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={labelStyle}>Sotuv Narxi (so'm)</label>
                        <input required type="number" min={0} style={iStyle} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>Tannarxi (so'm)</label>
                        <input required type="number" min={0} style={iStyle} value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={labelStyle}>O'lchov Birligi</label>
                        <select required style={iStyle} value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label style={labelStyle}>Tavsif (Ixtiyoriy)</label>
                    <textarea rows={3} style={{ ...iStyle, resize: 'vertical' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1 }}>Bekor Qilish</button>
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 2 }}>{loading ? "Saqlanmoqda..." : "Saqlash"}</button>
                </div>
            </form>
        </div>
    );
}

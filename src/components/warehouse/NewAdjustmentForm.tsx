'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdjustment } from '@/app/actions/inventoryActions';
import { useToast } from '@/context/ToastContext';

export default function NewAdjustmentForm({ branches }: { branches: any[] }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        branchId: branches[0]?.id || '',
        reason: 'Inventarizatsiya'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await createAdjustment(formData.branchId, formData.reason);
        
        setLoading(false);
        if (result.success) {
            showToast("Hujjat ochildi", "success");
            router.push(`/warehouse/inventory/adjustments/${result.id}`);
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const iStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };
    const labelStyle = { display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Yangi Inventarizatsiya Hujjati</h1>
            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                    <label style={labelStyle}>Filial</label>
                    <select required style={iStyle} value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})}>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label style={labelStyle}>Sabab / Tavsif</label>
                    <input required type="text" style={iStyle} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1 }}>Bekor Qilish</button>
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 2 }}>{loading ? "Ochilmoqda..." : "Hujjat Ochish"}</button>
                </div>
            </form>
        </div>
    );
}

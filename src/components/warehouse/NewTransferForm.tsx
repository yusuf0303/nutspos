'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTransfer } from '@/app/actions/transferActions';
import { useToast } from '@/context/ToastContext';

export default function NewTransferForm({ branches }: { branches: any[] }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fromBranchId: branches[0]?.id || '',
        toBranchId: branches[1]?.id || branches[0]?.id || '',
        reason: "Filiallar orasida ko'chirish"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.fromBranchId === formData.toBranchId) {
            showToast("Jo'natuvchi va qabul qiluvchi bir xil bo'lishi mumkin emas", "error");
            return;
        }
        setLoading(true);
        const result = await createTransfer(formData.fromBranchId, formData.toBranchId, formData.reason);
        setLoading(false);
        if (result.success) {
            showToast("Ko'chirish hujjati ochildi", "success");
            router.push(`/warehouse/transfers/${result.id}`);
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    const iStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Yangi Ko'chirish Hujjati</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Filiallar orasida mahsulot ko'chirish uchun hujjat oching.</p>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={labelStyle}>Jo'natuvchi Filial</label>
                    <select required style={iStyle} value={formData.fromBranchId} onChange={(e) => setFormData({ ...formData, fromBranchId: e.target.value })}>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--accent-primary)' }}>
                    ⬇
                </div>

                <div>
                    <label style={labelStyle}>Qabul Qiluvchi Filial</label>
                    <select required style={iStyle} value={formData.toBranchId} onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Izoh</label>
                    <input type="text" style={iStyle} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary" style={{ flex: 1 }}>Bekor Qilish</button>
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 2 }}>
                        {loading ? "Ochilmoqda..." : "Hujjat Ochish"}
                    </button>
                </div>
            </form>
        </div>
    );
}

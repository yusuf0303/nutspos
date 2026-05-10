'use client';

import { useState } from 'react';
import { adjustInventory } from '@/app/actions/inventoryActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function InventoryAdjustmentModal({
    isOpen,
    onClose,
    inventoryItem
}: {
    isOpen: boolean,
    onClose: () => void,
    inventoryItem?: any
}) {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        adjustment: 0,
        reason: ''
    });

    if (!isOpen || !inventoryItem) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.adjustment === 0) {
            showToast("Haqiqiy miqdorni kiriting", "warning");
            return;
        }

        setLoading(true);
        const result = await adjustInventory({
            productId: inventoryItem.productId,
            location: inventoryItem.location,
            adjustment: formData.adjustment,
            reason: formData.reason
        });

        setLoading(false);
        if (result.success) {
            showToast("Ombor miqdori yangilandi", "success");
            onClose();
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <form onSubmit={handleSubmit} className="card glass" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: 0 }}>Zaxirani To'g'irlash</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Mahsulot: <strong>{inventoryItem.product.name}</strong></p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Joriy miqdor: {inventoryItem.quantity} dona</p>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Miqdor O'zgarishi (+/-)</label>
                    <input
                        required
                        type="number"
                        className="input"
                        placeholder="M-n: -5 yoki 10"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        value={formData.adjustment}
                        onChange={(e) => setFormData({ ...formData, adjustment: Number(e.target.value) })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Sabab</label>
                    <select
                        required
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    >
                        <option value="">Tanlang...</option>
                        <option value="Damaged">Yaroqsiz / Buzilgan</option>
                        <option value="Miscounted">Xato hisoblangan</option>
                        <option value="Return">Mijoz qaytarishi</option>
                        <option value="Expiry">Muddati o'tgan</option>
                        <option value="Other">Boshqa</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Bekor Qilish</button>
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 1 }}>{loading ? "Saqlanmoqda..." : "To'g'irlash"}</button>
                </div>
            </form>
        </div>
    );
}

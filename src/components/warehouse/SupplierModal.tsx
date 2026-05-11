'use client';

import { useState, useEffect } from 'react';
import { createSupplier, updateSupplier } from '@/app/actions/supplierActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function SupplierModal({
    isOpen,
    onClose,
    supplier
}: {
    isOpen: boolean,
    onClose: () => void,
    supplier?: any
}) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: ''
            });
        }
    }, [supplier, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = supplier
            ? await updateSupplier(supplier.id, formData)
            : await createSupplier(formData);

        setLoading(false);
        if (result.success) {
            showToast(`Yetkazib beruvchi muvaffaqiyatli ${supplier ? 'yangilandi' : 'qo\'shildi'}`, "success");
            onClose();
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <form onSubmit={handleSubmit} className="card glass" style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: 0 }}>{supplier ? "Ta'minotchini Tahrirlash" : "Yangi Ta'minotchi"}</h2>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kompaniya Nomi</label>
                    <input
                        required
                        type="text"
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Telefon</label>
                    <input
                        type="text"
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
                    <input
                        type="email"
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Manzil</label>
                    <textarea
                        className="input"
                        rows={2}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'none' }}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Bekor Qilish</button>
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 2 }}>{loading ? "Saqlanmoqda..." : "Saqlash"}</button>
                </div>
            </form>
        </div>
    );
}

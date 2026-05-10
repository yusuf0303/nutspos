'use client';

import { useState, useEffect } from 'react';
import { createCustomer, updateCustomer } from '@/app/actions/customerActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function CustomerModal({
    isOpen,
    onClose,
    customer
}: {
    isOpen: boolean,
    onClose: () => void,
    customer?: any
}) {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: ''
            });
        }
    }, [customer, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = customer
            ? await updateCustomer(customer.id, formData)
            : await createCustomer(formData);

        setLoading(false);
        if (result.success) {
            showToast(`Mijoz muvaffaqiyatli ${customer ? 'yangilandi' : 'qo\'shildi'}`, "success");
            onClose();
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <form onSubmit={handleSubmit} className="card glass" style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: 0 }}>{customer ? "Mijozni Tahrirlash" : "Yangi Mijoz Qo'shish"}</h2>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>F.I.SH (Nomi)</label>
                    <input
                        required
                        type="text"
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 2 }}>{loading ? "Saqlanmoqda..." : "Mijozni Saqlash"}</button>
                </div>
            </form>
        </div>
    );
}

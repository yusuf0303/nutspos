'use client';

import { useState, useEffect } from 'react';
import { createCategory, updateCategory } from '@/app/actions/categoryActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function CategoryModal({
    isOpen,
    onClose,
    category
}: {
    isOpen: boolean,
    onClose: () => void,
    category?: any
}) {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || ''
            });
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
    }, [category, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = category
            ? await updateCategory(category.id, formData)
            : await createCategory(formData);

        setLoading(false);
        if (result.success) {
            showToast(`Kategoriya muvaffaqiyatli ${category ? 'yangilandi' : 'qo\'shildi'}`, "success");
            onClose();
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <form onSubmit={handleSubmit} className="card glass" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: 0 }}>{category ? "Kategoriyani Tahrirlash" : "Yangi Kategoriya"}</h2>

                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nomi</label>
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
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tavsif</label>
                    <textarea
                        className="input"
                        rows={3}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'none' }}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Bekor Qilish</button>
                    <button type="submit" disabled={loading} className="btn" style={{ flex: 1 }}>{loading ? "Saqlanmoqda..." : "Saqlash"}</button>
                </div>
            </form>
        </div>
    );
}

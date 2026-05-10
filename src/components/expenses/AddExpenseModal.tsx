'use client';

import { useState } from 'react';
import { addExpense } from '@/app/actions/expenseActions';
import { useToast } from '@/context/ToastContext';

export default function AddExpenseModal() {
    const [isOpen, setIsOpen] = useState(false);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Rent'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await addExpense({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: new Date()
            });
            setLoading(false);

            if (result.success) {
                showToast("Xarajat muvaffaqiyatli saqlandi", "success");
                setFormData({ description: '', amount: '', category: 'Rent' });
                setIsOpen(false);
            } else {
                showToast("Xato: " + result.error, "error");
            }
        } catch (error) {
            setLoading(false);
            showToast("Kutilmagan xatolik yuz berdi", "error");
        }
    };

    if (!isOpen) return <button onClick={() => setIsOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>+ Yangi Xarajat</button>;


    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
            <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Yangi Xarajat Qayd Etish</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tavsif</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            placeholder="Masalan: Do'kon ijarasi"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Summa (so'm)</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Kategoriya</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <option value="Rent">Ijara</option>
                            <option value="Salary">Oylik Maosh</option>
                            <option value="Utility">Kommunal</option>
                            <option value="Marketing">Reklama</option>
                            <option value="Other">Boshqa</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                            {loading ? "Saqlanmoqda..." : "Saqlash"}
                        </button>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            Bekor Qilish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

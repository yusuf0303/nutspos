'use client';

import { useState } from 'react';
import { createBranch, updateBranch, deleteBranch } from '@/app/actions/branchActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function BranchList({ initialBranches }: { initialBranches: any[] }) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
    const router = useRouter();

    const handleEdit = (branch: any) => {
        setSelectedBranch(branch);
        setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu filialni o'chirmoqchimisiz?")) {
            const res = await deleteBranch(id);
            if (res.success) {
                showToast("Filial o'chirildi", "success");
                router.refresh();
            } else {
                showToast("Xato: " + res.error, "error");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = selectedBranch 
            ? await updateBranch(selectedBranch.id, formData)
            : await createBranch(formData);
        
        setLoading(false);
        if (res.success) {
            showToast(selectedBranch ? "Filial yangilandi" : "Filial qo'shildi", "success");
            setIsModalOpen(false);
            setFormData({ name: '', address: '', phone: '' });
            router.refresh();
        } else {
            showToast("Xato: " + res.error, "error");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Filiallar</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Do'konlar va filiallar tarmog'ini boshqarish.</p>
                </div>
                <button
                    onClick={() => { setSelectedBranch(null); setFormData({ name: '', address: '', phone: '' }); setIsModalOpen(true); }}
                    className="btn"
                >
                    + Yangi Filial
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Nomi</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Manzil</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Telefon</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialBranches.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Hali filiallar yo'q.
                                </td>
                            </tr>
                        ) : (
                            initialBranches.map((branch: any) => (
                                <tr key={branch.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{branch.name}</td>
                                    <td style={{ padding: '1rem' }}>{branch.address || "—"}</td>
                                    <td style={{ padding: '1rem' }}>{branch.phone || "—"}</td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(branch)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Tahrirlash</button>
                                        <button onClick={() => handleDelete(branch.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>O'chirish</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{selectedBranch ? "Filialni Tahrirlash" : "Yangi Filial Qo'shish"}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Filial Nomi</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Manzil</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Telefon</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                                    {loading ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                    Bekor Qilish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

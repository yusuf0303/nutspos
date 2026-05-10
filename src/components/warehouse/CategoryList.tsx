'use client';

import { useState } from 'react';
import CategoryModal from '@/components/warehouse/CategoryModal';
import { deleteCategory } from '@/app/actions/categoryActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function CategoryList({ initialCategories }: { initialCategories: any[] }) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const router = useRouter();

    const handleEdit = (cat: any) => {
        setSelectedCategory(cat);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu kategoriyani o'chirmoqchimisiz?")) {
            const result = await deleteCategory(id);
            if (result.success) {
                showToast("Kategoriya muvaffaqiyatli o'chirildi", "success");
                router.refresh();
            } else {
                showToast("Xato: " + result.error, "error");
            }
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Kategoriyalar Boshqaruvi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Mahsulotlarni guruhlash va saralash mezonlarini tartibga soling.</p>
                </div>
                <button
                    onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }}
                    className="btn"
                >
                    + Yangi Kategoriya
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Nomi</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Tavsif</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialCategories.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Hali kategoriyalar yo'q.
                                </td>
                            </tr>
                        ) : (
                            initialCategories.map((cat: any) => (
                                <tr key={cat.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{cat.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{cat.description || "—"}</td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(cat)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Tahrirlash</button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            style={{
                                                padding: '0.5rem 1rem', fontSize: '0.875rem',
                                                background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                            }}
                                        >
                                            O'chirish
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
            />
        </div>
    );
}

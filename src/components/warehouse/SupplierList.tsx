'use client';

import { useState } from 'react';
import SupplierModal from '@/components/warehouse/SupplierModal';
import { deleteSupplier } from '@/app/actions/supplierActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function SupplierList({ suppliers }: { suppliers: any[] }) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const router = useRouter();

    const handleEdit = (sup: any) => {
        setSelectedSupplier(sup);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu ta'minotchini o'chirmoqchimisiz?")) {
            const res = await deleteSupplier(id);
            if (res.success) {
                showToast("Yetkazib beruvchi muvaffaqiyatli o'chirildi", "success");
                router.refresh();
            } else {
                showToast("Xato: " + res.error, "error");
            }
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Ta'minotchilar</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Hamkorlar va yetkazib beruvchilar bazasini boshqarish.</p>
                </div>
                <button
                    onClick={() => { setSelectedSupplier(null); setIsModalOpen(true); }}
                    className="btn"
                >
                    + Yangi Ta'minotchi
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Kompaniya</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Mas'ul Shaxs</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Kontakt</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Hali ta'minotchilar yo'q.
                                </td>
                            </tr>
                        ) : (
                            suppliers.map((sup: any) => (
                                <tr key={sup.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{sup.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sup.address || "Manzil ko'rsatilmagan"}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{sup.contactPerson || "—"}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem' }}>{sup.phone || "—"}</div>
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(sup)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Tahrirlash</button>
                                        <button onClick={() => handleDelete(sup.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>O'chirish</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <SupplierModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                supplier={selectedSupplier}
            />
        </div>
    );
}

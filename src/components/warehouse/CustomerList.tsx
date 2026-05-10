'use client';

import { useState } from 'react';
import CustomerModal from '@/components/warehouse/CustomerModal';
import { deleteCustomer } from '@/app/actions/customerActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerList({ initialCustomers }: { initialCustomers: any[] }) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const router = useRouter();

    const handleEdit = (cust: any) => {
        setSelectedCustomer(cust);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu mijozni o'chirmoqchimisiz?")) {
            const result = await deleteCustomer(id);
            if (result.success) {
                showToast("Mijoz muvaffaqiyatli o'chirildi", "success");
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
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Mijozlar Katalogi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Mijozlar bilan aloqani va sodiqlik dasturini boshqaring.</p>
                </div>
                <button
                    onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
                    className="btn"
                >
                    + Yangi Mijoz
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Mijoz Nomi</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Kontakt</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Sodiqlik Ballari</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Hali mijozlar yo'q.
                                </td>
                            </tr>
                        ) : (
                            initialCustomers.map((cust: any) => (
                                <tr key={cust.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{cust.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {cust.id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem' }}>{cust.phone || "—"}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.email || ""}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary)',
                                            borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700
                                        }}>
                                            ⭐ {cust.points} ball
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link href={`/warehouse/customers?id=${cust.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Tarix</Link>
                                        <button onClick={() => handleEdit(cust)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Tahrir</button>
                                        <button
                                            onClick={() => handleDelete(cust.id)}
                                            style={{
                                                padding: '0.5rem 1rem', fontSize: '0.875rem',
                                                background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                            }}
                                        >
                                            O'chir
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customer={selectedCustomer}
            />
        </div>
    );
}

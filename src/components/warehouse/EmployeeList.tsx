'use client';

import { useState } from 'react';
import { createEmployee, updateEmployee, deleteEmployee } from '@/app/actions/employeeActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function EmployeeList({ initialEmployees, branches }: { initialEmployees: any[], branches: any[] }) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
    const router = useRouter();

    const handleEdit = (emp: any) => {
        setSelectedEmployee(emp);
        setFormData({ 
            name: emp.name, 
            email: emp.email, 
            password: '', 
            role: emp.role, 
            branchId: emp.branchId || '' 
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu xodimni o'chirmoqchimisiz?")) {
            const res = await deleteEmployee(id);
            if (res.success) {
                showToast("Xodim o'chirildi", "success");
                router.refresh();
            } else {
                showToast("Xato: " + res.error, "error");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = selectedEmployee 
            ? await updateEmployee(selectedEmployee.id, { 
                name: formData.name, 
                email: formData.email, 
                role: formData.role as any, 
                branchId: formData.branchId || undefined 
            })
            : await createEmployee({ 
                ...formData, 
                role: formData.role as any, 
                branchId: formData.branchId || undefined 
            });
        
        setLoading(false);
        if (res.success) {
            showToast(selectedEmployee ? "Xodim yangilandi" : "Xodim qo'shildi", "success");
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
            router.refresh();
        } else {
            showToast("Xato: " + res.error, "error");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Xodimlar</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Xodimlar bazasini boshqarish va filiallarga biriktirish.</p>
                </div>
                <button
                    onClick={() => { setSelectedEmployee(null); setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' }); setIsModalOpen(true); }}
                    className="btn"
                >
                    + Yangi Xodim
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Ism-sharif</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Email / Login</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Lavozim</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Filial</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Xodimlar topilmadi.
                                </td>
                            </tr>
                        ) : (
                            initialEmployees.map((emp: any) => (
                                <tr key={emp.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{emp.name}</td>
                                    <td style={{ padding: '1rem' }}>{emp.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontWeight: 600 }}>
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{emp.branch?.name || "—"}</td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(emp)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Tahrirlash</button>
                                        <button onClick={() => handleDelete(emp.id)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>O'chirish</button>
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
                        <h2 style={{ marginBottom: '1.5rem' }}>{selectedEmployee ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ism-sharif</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email / Login</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    required
                                />
                            </div>
                            {!selectedEmployee && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Parol</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                        required={!selectedEmployee}
                                    />
                                </div>
                            )}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Lavozim</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="CASHIER">Kassir</option>
                                    <option value="STORE_MANAGER">Do'kon Menejeri</option>
                                    <option value="WAREHOUSE_MANAGER">Ombor Menejeri</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Filialga Biriktirish</label>
                                <select
                                    value={formData.branchId}
                                    onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Tanlanmagan</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
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

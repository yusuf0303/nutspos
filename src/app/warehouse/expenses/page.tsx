import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';

export default async function ExpensesPage() {
    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' }
    });

    const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Xarajatlar Nazorati</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Ijara, oylik va boshqa operatsion xarajatlarni boshqaring.</p>
                </div>
                <AddExpenseModal />
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Jami Xarajatlar</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{totalExpenses.toLocaleString()} so'm</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Tavsif</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Kategoriya</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Sana</th>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Summa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Hali xarajatlar qayd etilmagan.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((exp: any) => (
                                <tr key={exp.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{exp.description}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                                            borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{exp.date.toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{exp.amount.toLocaleString()} so'm</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { openShift, closeShift, getCurrentShift, getShiftStats } from '@/app/actions/shiftActions';
import Link from 'next/link';

export default function ShiftDashboard({ user }: { user: any }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [currentShift, setCurrentShift] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Modals
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [cashValue, setCashValue] = useState('');

    useEffect(() => {
        fetchShiftData();
    }, []);

    const fetchShiftData = async () => {
        setLoading(true);
        const res = await getCurrentShift(user.id);
        if (res.success && res.shift) {
            setCurrentShift(res.shift);
            const statsRes = await getShiftStats(res.shift.id);
            if (statsRes.success) {
                setStats(statsRes.stats);
            }
        } else {
            setCurrentShift(null);
            setStats(null);
        }
        setLoading(false);
    };

    const handleOpenShift = async () => {
        if (!cashValue || isProcessing) return;
        if (!user.branchId) {
            showToast("Xato: Siz hech qanday filialga biriktirilmagansiz!", "error");
            return;
        }
        setIsProcessing(true);
        const res = await openShift({
            userId: user.id,
            branchId: user.branchId,
            startingCash: parseFloat(cashValue) || 0
        });
        setIsProcessing(false);
        if (res.success) {
            showToast("Smena ochildi", "success");
            setShowOpenModal(false);
            setCashValue('');
            fetchShiftData();
        } else {
            showToast(res.error, "error");
        }
    };

    const handleCloseShift = async () => {
        if (!cashValue || isProcessing) return;
        setIsProcessing(true);
        const res = await closeShift(currentShift.id, {
            endingCash: parseFloat(cashValue) || 0
        });
        setIsProcessing(false);
        if (res.success) {
            showToast("Smena yopildi", "success");
            setShowCloseModal(false);
            setCashValue('');
            fetchShiftData();
        } else {
            showToast(res.error, "error");
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Xush kelibsiz, {user.name}</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {user.branch?.name || 'Filial biriktirilmagan'} • {new Date().toLocaleDateString('uz-UZ')}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    
                    {/* Main Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {!currentShift ? (
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                                <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏪</div>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Smena ochilmagan</h2>
                                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                                    Savdo qilishni boshlash uchun avval kassada mavjud naqd pulni kiritib smenani oching.
                                </p>
                                <button 
                                    onClick={() => setShowOpenModal(true)}
                                    style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', fontWeight: 700, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--shadow-glow)' }}
                                >
                                    Smenani Ochish
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Active Shift Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>💵 Naqd savdo</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{(stats?.cashAmount || 0).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>so'm</span></div>
                                    </div>
                                    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>💳 Karta / Click</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{((stats?.cardAmount || 0) + (stats?.clickAmount || 0)).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>so'm</span></div>
                                    </div>
                                    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🧾 Cheklar soni</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.orderCount || 0} ta</div>
                                    </div>
                                </div>

                                {/* Shift Summary Card */}
                                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderLeft: '5px solid var(--success)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Ochiq Smena: #{currentShift.id.slice(-6)}</h3>
                                            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Boshlangan vaqt: {new Date(currentShift.startTime).toLocaleTimeString()}</p>
                                        </div>
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>FAOL</div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Boshlang'ich pul:</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{currentShift.startingCash.toLocaleString()} so'm</div>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jami savdo summasi:</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{(stats?.totalAmount || 0).toLocaleString()} so'm</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <Link href="/pos/terminal" style={{ flex: 1, padding: '1rem', background: 'var(--accent-primary)', color: '#fff', textDecoration: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'center', boxShadow: 'var(--shadow-glow)' }}>
                                            🚀 Sotuvga Kirish
                                        </Link>
                                        <button 
                                            onClick={() => setShowCloseModal(true)}
                                            style={{ flex: 1, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            🏁 Smenani Yopish
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sidebar / Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                            <h4 style={{ margin: '0 0 1rem' }}>Smena Ma'lumotlari</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Xodim:</span>
                                    <span>{user.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Lavozim:</span>
                                    <span>{user.role}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Filial:</span>
                                    <span>{user.branch?.name}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px dashed var(--border-color)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                                💡 Smenani yopishdan oldin barcha cheklar urilganini va kassa yopilayotgandagi naqd pulni aniq kiritishingizni so'raymiz.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showOpenModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Smenani Ochish</h2>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Kassadagi boshlang'ich naqd pulni kiriting.</p>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Naqd pul miqdori (so'm)</label>
                            <input 
                                type="number" 
                                value={cashValue}
                                onChange={e => setCashValue(e.target.value)}
                                autoFocus
                                style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                placeholder="0"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={handleOpenShift}
                                disabled={!cashValue || isProcessing}
                                style={{ flex: 2, padding: '1rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {isProcessing ? "Ochilmoqda..." : "Tasdiqlash"}
                            </button>
                            <button 
                                onClick={() => setShowOpenModal(false)}
                                style={{ flex: 1, padding: '1rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCloseModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px', padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Smenani Yakunlash</h2>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Kunlik savdo yakunini tasdiqlang.</p>
                        
                        <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Boshlang'ich pul:</span>
                                <span style={{ fontWeight: 600 }}>{currentShift.startingCash.toLocaleString()} so'm</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Jami naqd savdo:</span>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{(stats?.cashAmount || 0).toLocaleString()} so'm</span>
                            </div>
                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700 }}>Kutilyotgan naqd pul:</span>
                                <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{(currentShift.startingCash + (stats?.cashAmount || 0)).toLocaleString()} so'm</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Haqiqiy mavjud naqd pul (so'm)</label>
                            <input 
                                type="number" 
                                value={cashValue}
                                onChange={e => setCashValue(e.target.value)}
                                autoFocus
                                style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                placeholder="0"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={handleCloseShift}
                                disabled={!cashValue || isProcessing}
                                style={{ flex: 2, padding: '1rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {isProcessing ? "Yopilmoqda..." : "Smenani Yopish"}
                            </button>
                            <button 
                                onClick={() => setShowCloseModal(false)}
                                style={{ flex: 1, padding: '1rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { getSetting, updateSetting } from '@/app/actions/settingActions';
import { useToast } from '@/context/ToastContext';

export default function SettingsPage() {
    const { showToast } = useToast();
    const [cashbackPercent, setCashbackPercent] = useState('1');
    const [maxDiscountPercent, setMaxDiscountPercent] = useState('30');
    const [allowNegativeInventory, setAllowNegativeInventory] = useState('false');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            const cp = await getSetting('CASHBACK_PERCENT', '1');
            const mdp = await getSetting('MAX_DISCOUNT_PERCENT', '30');
            const ani = await getSetting('ALLOW_NEGATIVE_INVENTORY', 'false');
            setCashbackPercent(cp);
            setMaxDiscountPercent(mdp);
            setAllowNegativeInventory(ani);
            setLoading(false);
        }
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await updateSetting('CASHBACK_PERCENT', cashbackPercent);
        await updateSetting('MAX_DISCOUNT_PERCENT', maxDiscountPercent);
        const res = await updateSetting('ALLOW_NEGATIVE_INVENTORY', allowNegativeInventory);
        if (res.success) {
            showToast("Sozlamalar muvaffaqiyatli saqlandi!", "success");
            // Broadcast the change to other tabs (like POS Terminal)
            const bc = new BroadcastChannel('pos_settings_sync');
            bc.postMessage('REFRESH_SETTINGS');
            bc.close();
        } else {
            showToast("Xatolik yuz berdi: " + (res.error || ""), "error");
        }
        setSaving(false);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Yuklanmoqda...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>⚙️ Tizim Sozlamalari</h1>

            <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
                <form onSubmit={handleSave}>
                    {/* Inventory Settings */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📦 Ombor Sozlamalari
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Qoldiqsiz sotishga ruxsat berish
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <select 
                                    value={allowNegativeInventory}
                                    onChange={(e) => setAllowNegativeInventory(e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        width: '200px'
                                    }}
                                >
                                    <option value="true">✅ Ha, ruxsat berish</option>
                                    <option value="false">❌ Yo'q, taqiqlash</option>
                                </select>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Agar ruxsat berilsa, mahsulot qoldig'i 0 bo'lsa ham sotuv amalga oshirilaveradi (ombor minusga kiradi).
                            </p>
                        </div>
                    </div>

                    {/* Cashback Settings */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            💰 Keshbek Sozlamalari
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Har bir xariddan beriladigan keshbek foizi (%)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={cashbackPercent}
                                    onChange={(e) => setCashbackPercent(e.target.value)}
                                    style={{
                                        width: '120px',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1.1rem',
                                        fontWeight: 700
                                    }}
                                />
                                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>%</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Masalan: 1.5 yozsangiz, mijoz 100 000 so'm xarid qilsa 1 500 so'm keshbek yig'iladi.
                            </p>
                        </div>
                    </div>

                    {/* Price Discount Settings */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📉 Narxni tushirish chegarasi
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Maksimal ruxsat berilgan chegirma foizi (%)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={maxDiscountPercent}
                                    onChange={(e) => setMaxDiscountPercent(e.target.value)}
                                    style={{
                                        width: '120px',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1.1rem',
                                        fontWeight: 700
                                    }}
                                />
                                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>%</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Masalan: 40 yozsangiz, kassir mahsulot narxini o'zidan o'zi 40% dan ko'proqqa arzonlashtira olmaydi.
                            </p>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 2rem', fontWeight: 700 }}
                        >
                            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

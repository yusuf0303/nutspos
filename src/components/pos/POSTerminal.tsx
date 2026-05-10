'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createOrder } from '@/app/actions/orderActions';
import { createCustomer } from '@/app/actions/customerActions';
import { getSetting } from '@/app/actions/settingActions';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { openShift, closeShift, getCurrentShift } from '@/app/actions/shiftActions';
import { useRouter } from 'next/navigation';

type CartItem = { product: any; quantity: number | string; customPrice?: number; discount: number; discountType: 'PERCENT' | 'FIXED' };
type HeldOrder = {
    id: string;
    timestamp: Date;
    cart: CartItem[];
    globalDiscount: number;
    globalDiscountType: 'PERCENT' | 'FIXED';
};

const fractionalUnits = ['kg', 'litr', 'm', 'metr', 'gramm', 'tonna'];
const isDiscreteUnit = (unit: string | undefined | null) => !fractionalUnits.includes((unit || '').toLowerCase());

export default function POSTerminal({
    initialProducts,
    initialCustomers,
    initialCategories,
    user,
}: {
    initialProducts: any[];
    initialCustomers: any[];
    initialCategories: any[];
    user: any;
}) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerId, setCustomerId] = useState<string>('');
    const [localCustomers, setLocalCustomers] = useState(initialCustomers);
    const [customerQuery, setCustomerQuery] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const router = useRouter();
    const [currentShift, setCurrentShift] = useState<any>(null);
    const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
    const [startingCash, setStartingCash] = useState<string>('');
    const [isClosingShift, setIsClosingShift] = useState(false);
    const [endingCash, setEndingCash] = useState<string>('');
    const [showPaymentTypes, setShowPaymentTypes] = useState(true);
    const [paymentType, setPaymentType] = useState<'CASH' | 'CARD' | 'CLICK' | 'SPLIT' | null>(null);
    const [splitCash, setSplitCash] = useState<string>('');
    const [splitCard, setSplitCard] = useState<string>('');
    const [splitClick, setSplitClick] = useState<string>('');
    const [activeSplitInput, setActiveSplitInput] = useState<'CASH' | 'CARD' | 'CLICK' | null>(null);
    const [spentCashback, setSpentCashback] = useState<number>(0);
    const [isEditingCashback, setIsEditingCashback] = useState(false);
    const [tempCashback, setTempCashback] = useState('');
    const [globalDiscount, setGlobalDiscount] = useState<number>(0);
    const [globalDiscountType, setGlobalDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
    const [showHeldOrders, setShowHeldOrders] = useState(false);
    const [selectedHeldOrderId, setSelectedHeldOrderId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [editMode, setEditMode] = useState<'QUANTITY' | 'PRICE'>('QUANTITY');
    const [tempQuantity, setTempQuantity] = useState<string>('');
    const [tempPrice, setTempPrice] = useState<string>('');

    // Get current shift on load to have its ID for orders
    useEffect(() => {
        const checkShift = async () => {
            if (user?.id) {
                const res = await getCurrentShift(user.id);
                if (res.success && res.shift) {
                    setCurrentShift(res.shift);
                } else {
                    // If no shift, the page itself should redirect, but this is a fallback
                    router.push('/pos');
                }
            }
        };
        checkShift();
    }, [user?.id]);
    const [isNewInput, setIsNewInput] = useState<boolean>(true);
    const [maxDiscountLimit, setMaxDiscountLimit] = useState(30);
    const [isCreating, setIsCreating] = useState(false);
    const { showToast } = useToast();

    const searchRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const splitCashRef = useRef<HTMLInputElement>(null);
    const splitCardRef = useRef<HTMLInputElement>(null);
    const splitClickRef = useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        let pool = initialProducts;
        if (activeCategoryId !== 'all') {
            pool = pool.filter((p) => p.categoryId === activeCategoryId);
        }
        if (search) {
            const q = search.toLowerCase();
            pool = pool.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q)
            );
        }
        return pool;
    }, [initialProducts, search, activeCategoryId]);

    const getStock = (product: any): number => {
        if (!product.inventory || product.inventory.length === 0) return 0;
        return product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
    };

    const addToCart = (product: any) => {
        const stock = getStock(product);
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                const currentQ = Number(existing.quantity) || 0;
                if (currentQ >= stock && stock > 0) return prev;
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: currentQ + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1, discount: 0, discountType: 'PERCENT' }];
        });
    };

    const removeFromCart = (productId: string) =>
        setCart((prev) => prev.filter((item) => item.product.id !== productId));

    const adjustQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev.flatMap((item) => {
                if (item.product.id !== productId) return [item];
                const newQ = (Number(item.quantity) || 0) + delta;
                if (newQ <= 0) return [];
                const stock = getStock(item.product);
                if (delta > 0 && newQ > stock && stock > 0) return [item];
                return [{ ...item, quantity: newQ }];
            })
        );
    };

    const setItemQuantity = (productId: string, val: string | number) => {
        const strVal = val.toString();
        if (strVal.includes('.') && strVal.split('.')[1].length > 3) return;

        setCart((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                if (val === '') return { ...item, quantity: '' };
                
                if (strVal.includes('.') && isDiscreteUnit(item.product.unit)) return item;

                const num = Number(val);
                if (isNaN(num) || num < 0) return item;
                const stock = getStock(item.product);
                if (num > stock && stock > 0) return { ...item, quantity: stock };
                return { ...item, quantity: val };
            })
        );
    };

    const setItemDiscount = (productId: string, discount: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                let val = discount;
                if (item.discountType === 'PERCENT') val = Math.min(100, Math.max(0, val));
                else val = Math.max(0, val);
                return { ...item, discount: val };
            })
        );
    };

    const setItemDiscountType = (productId: string, type: 'PERCENT' | 'FIXED') => {
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId
                    ? { ...item, discountType: type, discount: 0 }
                    : item
            )
        );
    };

    const subtotal = cart.reduce((sum, item) => {
        const q = Number(item.quantity) || 0;
        const lineTotal = (item.customPrice ?? item.product.price) * q;
        const discountAmount = item.discountType === 'PERCENT' ? lineTotal * (item.discount / 100) : item.discount;
        return sum + Math.max(0, lineTotal - discountAmount);
    }, 0);
    const globalDiscountAmount = globalDiscountType === 'PERCENT' ? subtotal * (globalDiscount / 100) : globalDiscount;
    const discountedSubtotal = Math.max(0, subtotal - globalDiscountAmount);
    const total = Math.max(0, discountedSubtotal - spentCashback);

    const handleCheckout = useCallback(async () => {
        if (cart.length === 0 || isProcessing) return;

        if (!paymentType) {
            showToast("Iltimos, to'lov turini tanlang!", "error");
            return;
        }

        let cashAmount = 0;
        let cardAmount = 0;
        let clickAmount = 0;

        if (paymentType === 'SPLIT') {
            cashAmount = Number(splitCash) || 0;
            cardAmount = Number(splitCard) || 0;
            clickAmount = Number(splitClick) || 0;
            const splitTotal = cashAmount + cardAmount + clickAmount;
            
            if (Math.abs(splitTotal - total) > 1) {
                showToast("Xato: Aralash to'lov yig'indisi umumiy to'lovga teng emas!", "error");
                return;
            }
        } else if (paymentType === 'CASH') {
            cashAmount = total;
        } else if (paymentType === 'CARD') {
            cardAmount = total;
        } else if (paymentType === 'CLICK') {
            clickAmount = total;
        }

        setIsProcessing(true);
        const result = await createOrder({
            items: cart.filter(item => (Number(item.quantity) || 0) > 0).map((item) => {
                const q = Number(item.quantity) || 0;
                const unitP = item.customPrice ?? item.product.price;
                const lineTotal = unitP * q;
                const discountAmt = item.discountType === 'PERCENT' ? lineTotal * (item.discount / 100) : item.discount;
                return {
                    productId: item.product.id,
                    quantity: q,
                    price: unitP,
                    cost: item.product.cost || 0,
                    discount: discountAmt
                };
            }),
            totalAmount: total,
            paymentType: paymentType,
            cashAmount: cashAmount,
            cardAmount: cardAmount,
            clickAmount: clickAmount,
            customerId: customerId,
            userId: user.id,
            branchId: user.branchId,
            shiftId: currentShift.id,
            cashbackUsed: spentCashback,
            discount: globalDiscountAmount
        });
        setIsProcessing(false);
        if (result.success) {
            setLastOrder({ cart: [...cart], total, customerId, paymentType, cashAmount, cardAmount, clickAmount, globalDiscount, globalDiscountType, globalDiscountAmount, cashbackUsed: spentCashback });
            setShowReceipt(true);
            showToast("Savdo muvaffaqiyatli yakunlandi!", "success");

            // Update local customer points
            if (customerId && result.newPoints !== undefined) {
                setLocalCustomers(prev => prev.map(c =>
                    c.id === customerId ? { ...c, points: result.newPoints } : c
                ));
            }
        } else {
            showToast(`Xato: ${result.error}`, "error");
        }
    }, [cart, isProcessing, total, paymentType, splitCash, splitCard, splitClick, customerId, spentCashback, globalDiscount, globalDiscountAmount, globalDiscountType, showToast, user.id, currentShift]);

    const completeSale = () => {
        setCart([]);
        setGlobalDiscount(0);
        setGlobalDiscountType('PERCENT');
        setCustomerId('');
        setCustomerQuery('');
        setSpentCashback(0);
        setSplitCash('');
        setSplitCard('');
        setSplitClick('');
        setPaymentType(null);
        setShowReceipt(false);
        setLastOrder(null);
        searchRef.current?.focus();
    };

    const holdCurrentOrder = () => {
        if (cart.length === 0) return;
        const newHeld: HeldOrder = {
            id: Date.now().toString(),
            timestamp: new Date(),
            cart: [...cart],
            globalDiscount,
            globalDiscountType,
        };
        setHeldOrders(prev => [...prev, newHeld]);
        setCart([]);
        setGlobalDiscount(0);
        setGlobalDiscountType('PERCENT');
        setCustomerId('');
        setCustomerQuery('');
        searchRef.current?.focus();
    };

    const restoreOrder = (order: HeldOrder) => {
        if (cart.length > 0) holdCurrentOrder();
        setCart(order.cart);
        setGlobalDiscount(order.globalDiscount);
        setGlobalDiscountType(order.globalDiscountType);
        setHeldOrders(prev => prev.filter(o => o.id !== order.id));
        setShowHeldOrders(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                handleCheckout();
            } else if (e.key === 'F4') {
                e.preventDefault();
                setCart([]);
            } else if (e.key === 'Escape' && showReceipt) {
                completeSale();
            } else if (e.key === 'F6') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCheckout, showReceipt]);

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
        };
    }, []);

    useEffect(() => {
        const loadSettings = async () => {
            const mdp = await getSetting('MAX_DISCOUNT_PERCENT', '30');
            setMaxDiscountLimit(parseFloat(mdp));
        };
        loadSettings();
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.warn(e));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const selectedCustomer = initialCustomers.find((c) => c.id === customerId);

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .no-spinners::-webkit-outer-spin-button,
                .no-spinners::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .no-spinners {
                    -moz-appearance: textfield;
                }
                @keyframes slideInTop {
                    from { transform: translate(-50%, -20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}} />
            {/* =========================  CASHBACK MODAL  ========================= */}
            {isEditingCashback && selectedCustomer && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(3px)' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', width: '350px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>💰 Keshbek ishlatish</h3>
                            <button onClick={() => setIsEditingCashback(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Xarid summasi</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{discountedSubtotal.toLocaleString()} so'm</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mavjud keshbek: {selectedCustomer.points.toLocaleString()} so'm</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--accent-primary)' }}>
                                    {tempCashback || '0'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map((n) => (
                                    <button key={n} onClick={() => {
                                        if (n === 'C') setTempCashback('');
                                        else if (n === '.') { if (!tempCashback.includes('.')) setTempCashback(prev => prev + n); }
                                        else setTempCashback(prev => prev + n);
                                    }} style={{ padding: '1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer' }}>{n}</button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => { setSpentCashback(0); setIsEditingCashback(false); }} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Tozalash</button>
                                <button onClick={() => {
                                    const val = parseFloat(tempCashback) || 0;
                                    if (val > (selectedCustomer?.points || 0)) {
                                        showToast("Keshbek yetarli emas!", "warning");
                                        return;
                                    }
                                    if (val > discountedSubtotal) {
                                        showToast("Keshbek xarid summasidan oshib ketishi mumkin emas!", "warning");
                                        return;
                                    }
                                    setSpentCashback(val);
                                    setIsEditingCashback(false);
                                }} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Tasdiqlash</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================  ADD CUSTOMER MODAL  ========================= */}
            {showAddCustomerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(3px)' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', width: '400px', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>Yangi Mijoz Qo'shish</h3>
                            <button onClick={() => setShowAddCustomerModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Ismi f-ya (Majburiy)</label>
                                <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Misol: Ahror yoki Javohir aka" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} autoFocus />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Telefon raqami</label>
                                <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.75rem', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>+998</div>
                                    <input type="tel" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))} placeholder="901234567" style={{ width: '100%', padding: '0.75rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }} />
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ushbu raqam bilan mijoz bazaga qo'shiladi va tanlanadi.</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={() => setShowAddCustomerModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}>Bekor qilish</button>
                                <button onClick={async () => {
                                    if (!newCustomerName) return showToast("Ism kiritish majburiy!", "warning");
                                    setIsCreating(true);
                                    const fullPhone = newCustomerPhone ? '+998' + newCustomerPhone : '';
                                    const res = await createCustomer({ name: newCustomerName, phone: fullPhone });
                                    setIsCreating(false);
                                    if (res.success && res.customer) {
                                        setLocalCustomers(prev => [...prev, res.customer]);
                                        setCustomerId(res.customer.id);
                                        setCustomerQuery(res.customer.name + (res.customer.phone ? ` (${res.customer.phone})` : ''));
                                        setShowAddCustomerModal(false);
                                        showToast("Yangi mijoz qo'shildi", "success");
                                    } else {
                                        showToast("Xatolik ro'y berdi: " + (res.error || ""), "error");
                                    }
                                }} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', fontWeight: 700 }} disabled={isCreating}>
                                    {isCreating ? 'Saqlanmoqda...' : 'Saqlash'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================  RECEIPT MODAL  ========================= */}
            {showReceipt && lastOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
                    <div className="card" style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s', background: 'var(--bg-secondary)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                            <h2 style={{ margin: 0, color: 'var(--success)' }}>To'lov Muvaffaqiyatli!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {lastOrder.paymentType === 'CASH' ? '💵 Naqd pul' : lastOrder.paymentType === 'CARD' ? '💳 Karta orqali' : lastOrder.paymentType === 'CLICK' ? '📱 Click orqali' : '🔀 Aralash usulda'} to'landi
                            </p>
                        </div>

                        <div id="print-receipt" style={{ background: '#fff', color: '#111', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px dashed #ccc', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                                <h3 style={{ margin: '0 0 0.25rem' }}>NEXUS POS</h3>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Savdo Cheki</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{new Date().toLocaleString('uz-UZ')}</div>
                            </div>
                            {selectedCustomer && (
                                <div style={{ fontSize: '0.75rem', borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '0.5rem 0', margin: '0.5rem 0', color: '#444' }}>
                                    Mijoz: {selectedCustomer.name}
                                </div>
                            )}
                            <div style={{ borderTop: '1px dashed #ccc', margin: '0.5rem 0' }} />
                            {lastOrder.cart.map((item: CartItem) => {
                                const q = Number(item.quantity) || 0;
                                const unitP = item.customPrice ?? item.product.price;
                                const originalLineTotal = unitP * q;
                                const discountAmt = item.discountType === 'PERCENT' ? originalLineTotal * (item.discount / 100) : item.discount;
                                return (
                                    <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span>{item.product.name} x{q}{item.discount > 0 ? ` (-${item.discount}${item.discountType === 'PERCENT' ? '%' : " so'm"})` : ''}</span>
                                        <span>{Math.max(0, originalLineTotal - discountAmt).toLocaleString()}</span>
                                    </div>
                                );
                            })}
                            {lastOrder.cashbackUsed > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3182ce', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                    <span>Ishlatilgan keshbek</span>
                                    <span>- {lastOrder.cashbackUsed.toLocaleString()}</span>
                                </div>
                            )}
                            {lastOrder.globalDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53e3e', marginTop: '0.5rem' }}>
                                    <span>Umumiy chegirma ({lastOrder.globalDiscount}{lastOrder.globalDiscountType === 'PERCENT' ? '%' : " so'm"})</span>
                                    <span>- {lastOrder.globalDiscountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', borderTop: '1px dashed #ccc', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                <span>JAMI</span>
                                <span>{lastOrder.total.toLocaleString()} so'm</span>
                            </div>
                            {lastOrder.paymentType === 'SPLIT' && (
                                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#555', borderTop: '1px dashed #eee', paddingTop: '0.5rem' }}>
                                    {lastOrder.cashAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Naqd:</span><span>{lastOrder.cashAmount.toLocaleString()}</span></div>}
                                    {lastOrder.cardAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Karta:</span><span>{lastOrder.cardAmount.toLocaleString()}</span></div>}
                                    {lastOrder.clickAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Click:</span><span>{lastOrder.clickAmount.toLocaleString()}</span></div>}
                                </div>
                            )}
                            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#888' }}>
                                Xaridingiz uchun rahmat! 🙏
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Chop Etish</button>
                            <button className="btn" style={{ flex: 2, background: 'var(--success)' }} onClick={completeSale}>Yangi Savdo (Esc)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================  EDIT ITEM MODAL (NUMPAD)  ========================= */}
            {editingItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', width: '380px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{editingItem.product.name}</h3>
                            <button onClick={() => setEditingItem(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div onClick={() => { setEditMode('QUANTITY'); setIsNewInput(true); quantityInputRef.current?.focus(); }}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: editMode === 'QUANTITY' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: editMode === 'QUANTITY' ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'text', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Miqdor ({editingItem.product.unit})</div>
                                <input 
                                    ref={quantityInputRef}
                                    value={tempQuantity} 
                                    onChange={e => { 
                                        const val = e.target.value;
                                        if (isDiscreteUnit(editingItem?.product.unit) && val.includes('.')) return;
                                        setTempQuantity(val); setIsNewInput(false); 
                                    }}
                                    onFocus={() => { setEditMode('QUANTITY'); setIsNewInput(false); }}
                                    style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', outline: 'none', width: '100%' }}
                                />
                            </div>
                            <div onClick={() => { setEditMode('PRICE'); setIsNewInput(true); priceInputRef.current?.focus(); }}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: editMode === 'PRICE' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: editMode === 'PRICE' ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'text', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Sotish Narxi</div>
                                <input 
                                    ref={priceInputRef}
                                    value={tempPrice} 
                                    onChange={e => { setTempPrice(e.target.value); setIsNewInput(false); }}
                                    onFocus={() => { setEditMode('PRICE'); setIsNewInput(false); }}
                                    style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', outline: 'none', width: '100%' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.'].map(key => (
                                <button key={key} onMouseDown={e => e.preventDefault()} onClick={() => {
                                    if (editMode === 'PRICE' && key === '.') return;
                                    if (editMode === 'QUANTITY' && key === '.' && editingItem && isDiscreteUnit(editingItem.product.unit)) return;
                                    
                                    const ref = editMode === 'QUANTITY' ? quantityInputRef : priceInputRef;
                                    const input = ref.current;
                                    const setter = editMode === 'QUANTITY' ? setTempQuantity : setTempPrice;
                                    
                                    setter(prev => {
                                        let nextVal = prev;
                                        let insertAt = prev.length;
                                        
                                        if (input && input.selectionStart !== null) {
                                            insertAt = input.selectionStart;
                                        }

                                        if (isNewInput) {
                                            setIsNewInput(false);
                                            if (key === '.') nextVal = '0.';
                                            else if (key === '00' || key === '0') nextVal = '0';
                                            else nextVal = key;
                                            
                                            setTimeout(() => {
                                                input?.focus();
                                                input?.setSelectionRange(nextVal.length, nextVal.length);
                                            }, 0);
                                        } else {
                                            if (key === '.' && prev.includes('.')) return prev;
                                            if (prev === '0' && key !== '.') {
                                                nextVal = key;
                                                insertAt = 0;
                                            } else {
                                                nextVal = prev.slice(0, insertAt) + key + prev.slice(input?.selectionEnd || insertAt);
                                            }
                                            
                                            const newCursorPos = insertAt + key.length;
                                            setTimeout(() => {
                                                input?.focus();
                                                input?.setSelectionRange(newCursorPos, newCursorPos);
                                            }, 0);
                                        }

                                        if (editMode === 'QUANTITY' && nextVal.includes('.')) {
                                            const parts = nextVal.split('.');
                                            if (parts.length > 1 && parts[1].length > 3) return prev;
                                        }

                                        return nextVal;
                                    });
                                }} style={{ padding: '1rem', fontSize: '1.25rem', fontWeight: 600, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', opacity: (editMode === 'PRICE' && key === '.') ? 0.3 : 1 }}>{key}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button onMouseDown={e => e.preventDefault()} onClick={() => {
                                setIsNewInput(false);
                                const ref = editMode === 'QUANTITY' ? quantityInputRef : priceInputRef;
                                const input = ref.current;
                                const setter = editMode === 'QUANTITY' ? setTempQuantity : setTempPrice;
                                
                                setter(prev => {
                                    if (!prev) return prev;
                                    let nextVal = prev;
                                    let newCursorPos = prev.length;
                                    
                                    if (input && input.selectionStart !== null && input.selectionStart > 0) {
                                        const start = input.selectionStart;
                                        const end = input.selectionEnd || start;
                                        
                                        if (start === end) {
                                            nextVal = prev.slice(0, start - 1) + prev.slice(end);
                                            newCursorPos = start - 1;
                                        } else {
                                            nextVal = prev.slice(0, start) + prev.slice(end);
                                            newCursorPos = start;
                                        }
                                    } else if (!input || input.selectionStart === null || input.selectionStart === prev.length) {
                                        nextVal = prev.slice(0, -1);
                                        newCursorPos = nextVal.length;
                                    }
                                    
                                    setTimeout(() => {
                                        input?.focus();
                                        input?.setSelectionRange(newCursorPos, newCursorPos);
                                    }, 0);
                                    
                                    return nextVal;
                                });
                            }} style={{ flex: 1, padding: '1rem', fontSize: '1rem', fontWeight: 600, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', cursor: 'pointer' }}>⌫ O'chirish</button>
                            <button onClick={() => {
                                const pNum = Number(tempPrice) || editingItem.product.price;

                                if (editMode === 'PRICE') {
                                    const originalPrice = editingItem.product.price;
                                    if (pNum < originalPrice) {
                                        const discountPct = ((originalPrice - pNum) / originalPrice) * 100;
                                        if (discountPct > maxDiscountLimit) {
                                            showToast(`Xato: Narxni ${maxDiscountLimit}% dan ortiq tushirish mumkin emas! (Siz: ${discountPct.toFixed(1)}% tushirmoqchisiz)`, "error");
                                            return;
                                        }
                                    }
                                }

                                setCart(prev => prev.map(item => {
                                    if (item.product.id !== editingItem.product.id) return item;
                                    let qNum = Number(tempQuantity) || '';
                                    if (typeof qNum === 'number') {
                                        const stock = getStock(item.product);
                                        if (qNum > stock && stock > 0) qNum = stock;
                                    }
                                    return { ...item, quantity: qNum, customPrice: pNum };
                                }));
                                setEditingItem(null);
                            }} style={{ flex: 2, padding: '1rem', fontSize: '1rem', fontWeight: 700, background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer' }}>Tasdiqlash</button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================  HELD ORDERS MODAL  ========================= */}
            {showHeldOrders && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', width: '900px', height: '650px', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                ⏸ Kutayotgan Cheklar
                                <span style={{ background: 'var(--accent-primary)', color: '#fff', fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{heldOrders.length}</span>
                            </h3>
                            <button onClick={() => setShowHeldOrders(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            {/* LEFT COLUMN: Carts List */}
                            <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--bg-primary)' }}>
                                {heldOrders.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>Savatlar yo'q</div>
                                ) : (
                                    heldOrders.map((ho, index) => {
                                        const isSelected = (selectedHeldOrderId || heldOrders[0]?.id) === ho.id;
                                        return (
                                            <div key={ho.id}
                                                onClick={() => setSelectedHeldOrderId(ho.id)}
                                                style={{
                                                    padding: '1rem 1.25rem',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                                                    borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.1s ease',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.25rem'
                                                }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Chek {index + 1}
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 'auto' }}>
                                                        {ho.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ho.cart.reduce((s, i) => s + (i.customPrice ?? i.product.price) * (Number(i.quantity) || 0), 0).toLocaleString()} so'm</span> • {ho.cart.length} xil
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* RIGHT COLUMN: Products Detail */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                                {(() => {
                                    const activeHo = heldOrders.find(o => o.id === (selectedHeldOrderId || heldOrders[0]?.id));
                                    if (!activeHo) return <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>Mijoz cheki tanlanmagan</div>;

                                    return (
                                        <>
                                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Savat tarkibi</div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => setHeldOrders(prev => prev.filter(o => o.id !== activeHo.id))} style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>🗑 O'chirish</button>
                                                    <button onClick={() => restoreOrder(activeHo)} style={{ padding: '0.5rem 1.5rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>🛒 Savatga yuklash</button>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {activeHo.cart.map((item, idx) => (
                                                    <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                                    </div>
                                                ))}
                                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '2px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Jami summa:</span>
                                                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                                                        {activeHo.cart.reduce((s, i) => s + (i.customPrice ?? i.product.price) * (Number(i.quantity) || 0), 0).toLocaleString()} so'm
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================  LEFT PANEL – Products  ========================= */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top Bar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Shtrix kod yoki nom bo'yicha qidirish... (F2)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1, padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
                        />
                    </div>
                    {heldOrders.length > 0 && (
                        <button onClick={() => setShowHeldOrders(true)} style={{ padding: '0.6rem 1rem', background: 'var(--warning)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap' }}>
                            <span>⏸ Kutishdagi</span>
                            <span style={{ background: '#fff', color: 'var(--warning)', padding: '0.1rem 0.4rem', borderRadius: '99px', fontSize: '0.75rem' }}>{heldOrders.length}</span>
                        </button>
                    )}
                    <button onClick={toggleFullscreen} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="To'liq ekran">
                        {isFullscreen ? '⛕' : '⛶'}
                    </button>
                    <Link href="/pos" className="btn btn-secondary" style={{ padding: '0.65rem 1rem', fontSize: '0.875rem', flexShrink: 0 }}>📊 Dashboard</Link>
                </div>

                {/* Category Tabs */}
                <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', overflowX: 'auto', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                    {[{ id: 'all', name: 'Barcha' }, ...initialCategories].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategoryId(cat.id)}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: 'var(--radius-xl)',
                                border: activeCategoryId === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                background: activeCategoryId === cat.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                                color: activeCategoryId === cat.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', fontWeight: activeCategoryId === cat.id ? 700 : 400,
                                fontSize: '0.8rem', whiteSpace: 'nowrap', transition: 'all 0.2s'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {filteredProducts.map((product) => {
                            const stock = getStock(product);
                            const inCart = cart.find((i) => i.product.id === product.id);
                            const outOfStock = stock === 0 && product.inventory?.length > 0;
                            return (
                                <div
                                    key={product.id}
                                    onClick={() => !outOfStock && addToCart(product)}
                                    style={{
                                        background: inCart ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)',
                                        border: inCart ? '1px solid rgba(59,130,246,0.5)' : '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-lg)', padding: '1rem',
                                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                                        opacity: outOfStock ? 0.5 : 1,
                                        transition: 'all 0.18s ease', display: 'flex',
                                        flexDirection: 'column', gap: '0.6rem',
                                        boxShadow: inCart ? '0 0 0 2px rgba(59,130,246,0.3)' : 'var(--shadow-sm)',
                                        position: 'relative'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!outOfStock) {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = inCart ? '0 0 0 2px rgba(59,130,246,0.3)' : 'var(--shadow-sm)';
                                    }}
                                >
                                    {inCart && (
                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--accent-primary)', color: '#fff', borderRadius: '999px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                            {inCart.quantity}
                                        </div>
                                    )}
                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{product.name}</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0', fontFamily: 'monospace' }}>{product.sku}</p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>{product.price.toLocaleString()} so'm/{product.unit || 'dona'}</span>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                            background: outOfStock ? 'rgba(239,68,68,0.1)' : stock <= 5 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: outOfStock ? 'var(--danger)' : stock <= 5 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            {outOfStock ? 'Tugagan' : stock <= 5 ? `⚠ ${stock} ${product.unit || 'dona'}` : `✓ ${stock} ${product.unit || 'dona'}`}
                                        </span>
                                    </div>
                                    {product.category && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                                            📂 {product.category.name}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
                                <div>"{search || activeCategoryId}" bo'yicha mahsulot topilmadi</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* =========================  RIGHT PANEL – Cart  ========================= */}
            <div style={{ width: '420px', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', flexShrink: 0 }}>
                {/* Cart Top / Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Savat</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-primary)', padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid var(--border-color)' }}>
                            {cart.length} xil mahsulot
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {cart.length > 0 && (
                            <button onClick={holdCurrentOrder} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                                ⏸ Kutish
                            </button>
                        )}
                        <button onClick={() => { setCart([]); setGlobalDiscount(0); setGlobalDiscountType('PERCENT'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6L17.6 20.8A2 2 0 0 1 15.6 22H8.4a2 2 0 0 1-2-1.2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            F4 Tozala
                        </button>
                    </div>
                </div>

                {/* Customer + Payment */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>👤 Mijoz (Tel yoki Ism)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="🔍 Qidiruv (ism yoki oxirgi raqamlar)"
                                value={customerQuery}
                                onChange={(e) => {
                                    setCustomerQuery(e.target.value);
                                    setShowCustomerDropdown(true);
                                    if (!e.target.value) setCustomerId('');
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                style={{ width: '100%', padding: '0.6rem 2rem 0.6rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                            />
                            {customerQuery && (
                                <button
                                    type="button"
                                    onClick={() => { setCustomerId(''); setCustomerQuery(''); }}
                                    style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                >
                                    ✕
                                </button>
                            )}
                            {showCustomerDropdown && customerQuery.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto', zIndex: 50, marginTop: '0.2rem', boxShadow: 'var(--shadow-lg)' }}>
                                    {(() => {
                                        const cleanQuery = customerQuery.replace(/\s+/g, '').toLowerCase();
                                        const filtered = localCustomers.filter(c => {
                                            const cleanPhone = (c.phone || '').replace(/\s+/g, '').toLowerCase();
                                            return cleanPhone.includes(cleanQuery) || c.name.toLowerCase().includes(customerQuery.toLowerCase());
                                        });
                                        if (filtered.length === 0) {
                                            return (
                                                <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Sistemada bunday mijoz topilmadi</div>
                                                    <button type="button" onClick={() => {
                                                        const digits = customerQuery.replace(/[^0-9]/g, '');
                                                        let initialPhone = digits;
                                                        if (digits.startsWith('998')) initialPhone = digits.slice(3);
                                                        setNewCustomerPhone(initialPhone.slice(0, 9));
                                                        setShowAddCustomerModal(true);
                                                        setShowCustomerDropdown(false);
                                                        setNewCustomerName('');
                                                    }} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', width: '100%', fontWeight: 600 }}>➕ Yangi mijoz qo'shish</button>
                                                </div>
                                            );
                                        }
                                        return filtered.map(c => (
                                            <div key={c.id} onClick={() => { setCustomerId(c.id); setCustomerQuery(c.name + (c.phone ? ` (${c.phone})` : '')); setShowCustomerDropdown(false); }} style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <span style={{ fontWeight: customerId === c.id ? 700 : 500, color: customerId === c.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{c.name}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{c.phone || ''} {c.points ? ` | 💰Keshbek: ${c.points.toLocaleString()}` : ''}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedCustomer && selectedCustomer.points > 0 && (
                        <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>💰 Mavjud Keshbek</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{selectedCustomer.points.toLocaleString()} so'm</div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsEditingCashback(true);
                                    setTempCashback(spentCashback > 0 ? spentCashback.toString() : '');
                                }}
                                style={{ padding: '0.5rem 0.75rem', background: spentCashback > 0 ? 'var(--accent-primary)' : 'var(--bg-primary)', color: spentCashback > 0 ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {spentCashback > 0 ? `Ishlatilmoqda: ${spentCashback.toLocaleString()}` : '⚡ Ishlatish'}
                            </button>
                        </div>
                    )}
                    <div>
                        <div 
                            onClick={() => setShowPaymentTypes(!showPaymentTypes)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.4rem', padding: '0.2rem 0' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', margin: 0 }}>💳 To'lov turi ({paymentType === 'CASH' ? 'Naqd' : paymentType === 'CARD' ? 'Karta' : paymentType === 'CLICK' ? 'Click' : paymentType === 'SPLIT' ? 'Split' : 'Tanlanmagan'})</label>
                                {!paymentType && (
                                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--danger)', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>Tanlanmagan!</span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{showPaymentTypes ? '▲' : '▼'}</span>
                        </div>
                        
                        {showPaymentTypes && (
                            <>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {(['CASH', 'CARD', 'CLICK', 'SPLIT'] as const).map((pt) => (
                                        <button
                                            key={pt}
                                            onClick={() => setPaymentType(pt)}
                                            style={{
                                                flex: '1 1 calc(50% - 0.25rem)', padding: '0.6rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                                                background: paymentType === pt ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                border: paymentType === pt ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                                color: paymentType === pt ? '#fff' : 'var(--text-muted)'
                                            }}
                                        >
                                            {pt === 'CASH' ? '💵 Naqd' : pt === 'CARD' ? '💳 Karta' : pt === 'CLICK' ? '📱 Click' : '🔀 Split'}
                                        </button>
                                    ))}
                                </div>
                                {paymentType === 'SPLIT' && (
                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', width: '60px' }}>💵 Naqd:</span>
                                            <input ref={splitCashRef} type="text" inputMode="numeric" placeholder="0" className="no-spinners" value={splitCash} onFocus={() => setActiveSplitInput('CASH')} onBlur={() => setActiveSplitInput(null)} onChange={e => setSplitCash(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: activeSplitInput === 'CASH' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', width: '60px' }}>💳 Karta:</span>
                                            <input ref={splitCardRef} type="text" inputMode="numeric" placeholder="0" className="no-spinners" value={splitCard} onFocus={() => setActiveSplitInput('CARD')} onBlur={() => setActiveSplitInput(null)} onChange={e => setSplitCard(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: activeSplitInput === 'CARD' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', width: '60px' }}>📱 Click:</span>
                                            <input ref={splitClickRef} type="text" inputMode="numeric" placeholder="0" className="no-spinners" value={splitClick} onFocus={() => setActiveSplitInput('CLICK')} onBlur={() => setActiveSplitInput(null)} onChange={e => setSplitClick(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: activeSplitInput === 'CLICK' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
                                        </div>

                                {activeSplitInput && (
                                    <div style={{ marginTop: '0.25rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Numpad ({activeSplitInput === 'CASH' ? 'Naqd' : activeSplitInput === 'CARD' ? 'Karta' : 'Click'})</span>
                                            <button onClick={() => setActiveSplitInput(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Yopish</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0, '⌫'].map((n) => (
                                                <button key={n} onMouseDown={(e) => {
                                                    e.preventDefault(); // Prevents input from losing focus
                                                    const setter = activeSplitInput === 'CASH' ? setSplitCash : activeSplitInput === 'CARD' ? setSplitCard : setSplitClick;
                                                    const ref = activeSplitInput === 'CASH' ? splitCashRef : activeSplitInput === 'CARD' ? splitCardRef : splitClickRef;
                                                    
                                                    const currentEl = ref.current;
                                                    if (currentEl) {
                                                        const start = currentEl.selectionStart || 0;
                                                        const end = currentEl.selectionEnd || 0;
                                                        const currentVal = currentEl.value;

                                                        let newValue = currentVal;
                                                        let newCursorPos = start;

                                                        if (n === '⌫') {
                                                            if (start === end) {
                                                                if (start > 0) {
                                                                    newValue = currentVal.slice(0, start - 1) + currentVal.slice(end);
                                                                    newCursorPos = start - 1;
                                                                }
                                                            } else {
                                                                newValue = currentVal.slice(0, start) + currentVal.slice(end);
                                                                newCursorPos = start;
                                                            }
                                                        } else {
                                                            newValue = currentVal.slice(0, start) + n.toString() + currentVal.slice(end);
                                                            newCursorPos = start + n.toString().length;
                                                        }

                                                        setter(newValue);
                                                        setTimeout(() => {
                                                            if (ref.current) {
                                                                ref.current.setSelectionRange(newCursorPos, newCursorPos);
                                                            }
                                                        }, 0);
                                                    }
                                                }} style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: (Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitClick) || 0) === total ? 'var(--success)' : 'var(--danger)', marginTop: '0.2rem' }}>
                                    <span>Kiritilgan jami:</span>
                                    <span>{((Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitClick) || 0)).toLocaleString()} so'm</span>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                    </div>
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>🛒</div>
                            <div>Savat bo'sh.</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Mahsulot kartasiga bosing</div>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product.id} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => {
                                            setEditingItem(item);
                                            setTempQuantity(item.quantity.toString());
                                            setTempPrice((item.customPrice ?? item.product.price).toString());
                                            setEditMode('QUANTITY');
                                            setIsNewInput(true);
                                        }}>
                                            {item.product.name}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600, marginTop: '0.1rem', cursor: 'pointer' }} onClick={() => {
                                            setEditingItem(item);
                                            setTempQuantity(item.quantity.toString());
                                            setTempPrice((item.customPrice ?? item.product.price).toString());
                                            setEditMode('PRICE');
                                            setIsNewInput(true);
                                        }}>
                                            {(item.customPrice ?? item.product.price).toLocaleString()} so'm/{item.product.unit || 'dona'}
                                            {item.discount > 0 && <span style={{ color: 'var(--warning)', marginLeft: '0.4rem', fontSize: '0.7rem' }}>Chegirma: -{item.discount}{item.discountType === 'PERCENT' ? '%' : " so'm"}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <button onClick={() => adjustQuantity(item.product.id, -1)} style={{ width: '28px', height: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <input
                                                type="number"
                                                min={0}
                                                step="any"
                                                value={item.quantity === '' ? '' : item.quantity}
                                                onChange={(e) => setItemQuantity(item.product.id, e.target.value)}
                                                className="no-spinners"
                                                style={{ width: '50px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', padding: '0.2rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                                            />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, paddingRight: '0.4rem', color: 'var(--text-muted)' }}>{item.product.unit || 'dona'}</span>
                                        </div>
                                        <button onClick={() => adjustQuantity(item.product.id, 1)} style={{ width: '28px', height: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7, padding: '0.25rem' }}>✕</button>
                                </div>
                                {/* Per-item discount */}
                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Chegirma:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        <input
                                            type="number"
                                            min={0} max={item.discountType === 'PERCENT' ? 100 : undefined}
                                            value={item.discount || ''}
                                            onChange={(e) => setItemDiscount(item.product.id, Number(e.target.value))}
                                            className="no-spinners"
                                            style={{ width: item.discountType === 'PERCENT' ? '50px' : '80px', padding: '0.2rem 0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                                        />
                                        <button
                                            onClick={() => setItemDiscountType(item.product.id, item.discountType === 'PERCENT' ? 'FIXED' : 'PERCENT')}
                                            style={{ padding: '0.2rem 0.4rem', border: 'none', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, minWidth: '32px' }}
                                        >
                                            {item.discountType === 'PERCENT' ? '%' : "so'm"}
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        = {(() => {
                                            const q = Number(item.quantity) || 0;
                                            const lineTotal = (item.customPrice ?? item.product.price) * q;
                                            const discountAmt = item.discountType === 'PERCENT' ? lineTotal * (item.discount / 100) : item.discount;
                                            return Math.max(0, lineTotal - discountAmt).toLocaleString();
                                        })()} so'm
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary & Checkout */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <span>Oraliq jami</span>
                        <span>{subtotal.toLocaleString()} so'm</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Umumiy chegirma:</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <input
                                type="number"
                                min={0} max={globalDiscountType === 'PERCENT' ? 100 : undefined}
                                value={globalDiscount || ''}
                                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                                className="no-spinners"
                                style={{ width: globalDiscountType === 'PERCENT' ? '50px' : '80px', padding: '0.35rem 0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                            />
                            <button
                                onClick={() => {
                                    setGlobalDiscount(0);
                                    setGlobalDiscountType(prev => prev === 'PERCENT' ? 'FIXED' : 'PERCENT');
                                }}
                                style={{ padding: '0.35rem 0.5rem', border: 'none', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, minWidth: '40px' }}
                            >
                                {globalDiscountType === 'PERCENT' ? '%' : "so'm"}
                            </button>
                        </div>
                        {globalDiscountAmount > 0 && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginLeft: 'auto' }}>
                                -{globalDiscountAmount.toLocaleString()} so'm
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginBottom: '1rem' }}>
                        <span>Jami</span>
                        <span>{total.toLocaleString()} so'm</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isProcessing}
                        style={{
                            width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 700,
                            borderRadius: 'var(--radius-md)', border: 'none', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                            background: cart.length === 0 ? 'var(--bg-primary)' : paymentType === 'CASH' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: cart.length === 0 ? 'var(--text-muted)' : '#fff',
                            boxShadow: cart.length > 0 ? '0 4px 20px rgba(16,185,129,0.4)' : 'none',
                            transition: 'all 0.2s',
                            opacity: isProcessing ? 0.7 : 1
                        }}
                    >
                        {isProcessing ? '⏳ Amalga oshirilmoqda...' : `${paymentType === 'CASH' ? '💵' : '💳'} To'lovni Yakunlash (F2)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

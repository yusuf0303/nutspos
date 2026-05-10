'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none'
            }}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            background: 'rgba(30, 41, 59, 0.95)',
                            color: '#fff',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#f59e0b'}`,
                            animation: 'slideInTop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            maxWidth: '90vw',
                            minWidth: '300px',
                            pointerEvents: 'auto'
                        }}
                    >
                        <style>{`
                            @keyframes slideInTop {
                                from { transform: translateY(-20px); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                        `}</style>
                        <span style={{ fontSize: '1.25rem' }}>
                            {toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : '⚠️'}
                        </span>
                        <span style={{ fontWeight: 600 }}>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

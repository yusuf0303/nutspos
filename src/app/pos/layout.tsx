export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pos-light-theme" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    );
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Nexus POS & Ombor
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Tezlik va ishonchlilik uchun yaratilgan zamonaviy savdo nuqtasi va inventar boshqaruv tizimi.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>📦 Ombor Boshqaruvi</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Mahsulot variantlarini kuzatib boring, yetkazib beruvchilarni boshqaring va inventarni real vaqtda yangilang.
          </p>
          <Link href="/warehouse" className="btn">
            Omborni Ochish
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>🛒 Savdo Nuqtasi (POS)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Shtrix-kod skaneri, bo'lingan to'lovlar va chek yaratish imkoniyatiga ega tezkor savdo interfeysi.
          </p>
          <Link href="/pos" className="btn btn-secondary">
            POS Terminalni Ishga Tushirish
          </Link>
        </div>
      </div>
    </div>
  );
}

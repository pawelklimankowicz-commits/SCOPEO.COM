import Link from 'next/link';
import { BrandLogoLockup } from '@/components/BrandLogo';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a1020',
        color: '#eef3ff',
        textAlign: 'center',
        padding: '2rem',
        gap: '2rem',
      }}
    >
      <BrandLogoLockup size={32} wordmarkSurface="dark" showTagline={false} />

      <div>
        <p
          style={{
            fontSize: '7rem',
            fontWeight: 800,
            lineHeight: 1,
            background: 'linear-gradient(90deg, #5ecf9a, #0d6b61)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0.75rem 0 0' }}>
          Strona nie została znaleziona
        </h1>
        <p style={{ color: '#a7b5db', marginTop: '0.5rem', maxWidth: 420 }}>
          Adres, którego szukasz, nie istnieje lub został przeniesiony.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link href="/" className="btn btn-primary">
          Strona główna
        </Link>
        <Link href="/dashboard" className="btn btn-secondary">
          Dashboard
        </Link>
      </div>
    </main>
  );
}

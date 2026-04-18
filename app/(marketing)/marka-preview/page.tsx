import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BrandLogoLockup, BrandLogoMark } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Podgląd marki',
  description: 'Wewnętrzny podgląd logotypu Scopeo na jasnym i ciemnym tle oraz w różnych rozmiarach.',
  robots: { index: false, follow: false },
};

export default function MarkaPreviewPage() {
  return (
    <div className="mkt-inner" style={{ padding: '48px 0 80px', maxWidth: 920 }}>
      <p style={{ marginBottom: 8 }}>
        <Link href="/" style={{ color: 'var(--mkt-muted)', fontSize: 14 }}>
          ← Strona główna
        </Link>
      </p>
      <h1 className="mkt-hero-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: 12 }}>
        Podgląd marki
      </h1>
      <p className="mkt-hero-sub" style={{ marginBottom: 40, maxWidth: 640 }}>
        Lockup (znak + „Scopeo” + ESG INTELLIGENCE), sam znak oraz symulacja nagłówka marketingowego i
        paska dashboardu — żeby ocenić, jak marka czyta się w kontekście produktu.
      </p>

      <section style={{ marginBottom: 48 }}>
        <h2 className="mkt-section-title" style={{ marginBottom: 16 }}>
          Lockup — jasne tło
        </h2>
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--mkt-border, #e2e8f0)',
            padding: 32,
            background: '#ffffff',
          }}
        >
          <Image
            src="/brand/scopeo-logo-lockup.svg"
            alt="Scopeo"
            width={232}
            height={56}
            unoptimized
            style={{ height: 56, width: 'auto' }}
          />
          <p className="mkt-footer-note" style={{ marginTop: 16, marginBottom: 0 }}>
            Pełny plik wektorowy: <code>/brand/scopeo-logo-lockup.svg</code>
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="mkt-section-title" style={{ marginBottom: 16 }}>
          Lockup — rozmiary
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: 28,
            padding: 28,
            borderRadius: 16,
            border: '1px solid var(--mkt-border, #e2e8f0)',
            background: '#f8fafc',
          }}
        >
          {[22, 28, 34, 42].map((h) => (
            <div key={h} style={{ textAlign: 'center' }}>
              <Image
                src="/brand/scopeo-logo-lockup.svg"
                alt=""
                width={232}
                height={56}
                unoptimized
                style={{ height: h, width: 'auto', display: 'block', margin: '0 auto 8px' }}
              />
              <span className="mkt-footer-note" style={{ fontSize: 12 }}>
                {h}px wys.
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="mkt-section-title" style={{ marginBottom: 16 }}>
          Lockup — ciemne tło (jak dashboard)
        </h2>
        <div
          style={{
            borderRadius: 16,
            padding: 28,
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}
        >
          <BrandLogoLockup
            size={22}
            withWordmark
            wordmarkColor="#86efac"
            taglineColor="#94a3b8"
          />
          <p style={{ marginTop: 16, marginBottom: 0, fontSize: 13, color: '#94a3b8' }}>
            Na ciemnym tle używamy komponentu React (HTML + znak) — tak jak w dashboardzie.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="mkt-section-title" style={{ marginBottom: 16 }}>
          Symulacja nagłówka marketingowego
        </h2>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderRadius: 12,
            background: 'var(--mkt-elevated, #f1f5f9)',
            border: '1px solid var(--mkt-border, #e2e8f0)',
          }}
        >
          <BrandLogoLockup
            size={19}
            withWordmark
            wordmarkColor="var(--mkt-headline)"
            taglineColor="#475569"
          />
          <span style={{ fontSize: 13, color: 'var(--mkt-muted)' }}>… nawigacja …</span>
        </header>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="mkt-section-title" style={{ marginBottom: 16 }}>
          Tylko znak (favicon / tight UI)
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 24,
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--mkt-border, #e2e8f0)',
            background: '#fff',
          }}
        >
          {[32, 40, 48].map((s) => (
            <div key={s} style={{ textAlign: 'center' }}>
              <BrandLogoMark size={s} />
              <div className="mkt-footer-note" style={{ marginTop: 8, fontSize: 12 }}>
                {s}px
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mkt-section-title" style={{ marginBottom: 16 }}>
          Komponent React (lockup)
        </h2>
        <div style={{ padding: 20, background: '#ecfdf5', borderRadius: 12, display: 'inline-block' }}>
          <BrandLogoLockup
            size={20}
            withWordmark
            wordmarkColor="var(--mkt-headline)"
            taglineColor="#64748b"
          />
        </div>
      </section>
    </div>
  );
}

import type { CSSProperties } from 'react';
import Image from 'next/image';

type LockupProps = {
  size?: number;
  withWordmark?: boolean;
  /** Kolor słowa „Scopeo” (np. `var(--mkt-headline)` lub `#86efac` na ciemnym tle). */
  wordmarkColor?: string;
  /** Kolor podtytułu „ESG INTELLIGENCE”. */
  taglineColor?: string;
  /** Czy pokazywać podtytuł (domyślnie tak). */
  showTagline?: boolean;
  style?: CSSProperties;
};

export function BrandLogoMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/brand/scopeo-mark.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden
      unoptimized
      style={{ display: 'block', flexShrink: 0 }}
    />
  );
}

/**
 * Lockup w HTML + znaku SVG — **zawsze widoczny** w przeglądarkach (w przeciwieństwie do
 * `<img src="…svg">` z elementem `<text>` i gradientem, który często znika).
 */
export function BrandLogoLockup({
  size = 26,
  withWordmark = true,
  wordmarkColor = '#0f172a',
  taglineColor = '#64748b',
  showTagline = true,
  style,
}: LockupProps) {
  if (!withWordmark) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
        <BrandLogoMark size={size} />
      </span>
    );
  }

  const markSize = Math.max(28, Math.round(size * 1.95));
  const titleSize = Math.max(16, Math.round(size * 1.22));
  const tagSize = Math.max(7, Math.round(size * 0.4));

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(10, Math.round(size * 0.5)),
        ...style,
      }}
    >
      <BrandLogoMark size={markSize} />
      <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)',
            fontWeight: 800,
            fontSize: titleSize,
            letterSpacing: '-0.045em',
            color: wordmarkColor,
          }}
        >
          Scopeo
        </span>
        {showTagline ? (
          <span
            style={{
              fontFamily: 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)',
              fontSize: tagSize,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: taglineColor,
              marginTop: 3,
            }}
          >
            ESG INTELLIGENCE
          </span>
        ) : null}
      </span>
    </span>
  );
}

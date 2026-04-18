import type { CSSProperties } from 'react';
import Image from 'next/image';

/** „Scopeo”: ciemno przy S, jaśniej w stronę „o” — na jasnym tle marketingu. */
const SCOPEO_WORDMARK_GRADIENT_LIGHT =
  'linear-gradient(90deg, #020617 0%, #042f2e 18%, #064e3b 38%, #0f766e 62%, #0d9488 82%, #2dd4bf 100%)';

/** Wariant na ciemnym tle (dashboard itd.). */
const SCOPEO_WORDMARK_GRADIENT_DARK =
  'linear-gradient(90deg, #f1f5f9 0%, #d1fae5 35%, #86efac 70%, #34d399 100%)';

type LockupProps = {
  size?: number;
  withWordmark?: boolean;
  /** Płaski kolor słowa „Scopeo” — tylko gdy `wordmarkFlat`. */
  wordmarkColor?: string;
  taglineColor?: string;
  showTagline?: boolean;
  style?: CSSProperties;
  /** Gradient słowa: jasne tło vs ciemny pasek aplikacji. Domyślnie `light`. */
  wordmarkSurface?: 'light' | 'dark';
  /** Jednolity kolor zamiast gradientu (np. eksport PDF). Domyślnie false. */
  wordmarkFlat?: boolean;
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
 * Lockup: znak SVG + „Scopeo” + podtytuł w HTML.
 * Znak w trybie lockup jest **2×** większy niż wcześniej (powiększenie o 100%);
 * rozmiar pisma „Scopeo” / podtytułu bez zmian względem prop `size`.
 */
export function BrandLogoLockup({
  size = 26,
  withWordmark = true,
  wordmarkColor = '#0f172a',
  taglineColor = '#64748b',
  showTagline = true,
  style,
  wordmarkSurface = 'light',
  wordmarkFlat = false,
}: LockupProps) {
  if (!withWordmark) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
        <BrandLogoMark size={size} />
      </span>
    );
  }

  const baseMark = Math.max(28, Math.round(size * 1.95));
  const markSize = baseMark * 2;
  const titleSize = Math.max(16, Math.round(size * 1.22));
  const tagSize = Math.max(7, Math.round(size * 0.4));

  const gradient =
    wordmarkSurface === 'dark' ? SCOPEO_WORDMARK_GRADIENT_DARK : SCOPEO_WORDMARK_GRADIENT_LIGHT;

  const wordmarkStyle: CSSProperties = wordmarkFlat
    ? {
        fontFamily: 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)',
        fontWeight: 800,
        fontSize: titleSize,
        letterSpacing: '-0.045em',
        color: wordmarkColor,
      }
    : {
        fontFamily: 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)',
        fontWeight: 800,
        fontSize: titleSize,
        letterSpacing: '-0.045em',
        display: 'inline-block',
        width: 'fit-content',
        backgroundImage: gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
      };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(12, Math.round(size * 0.55)),
        ...style,
      }}
    >
      <BrandLogoMark size={markSize} />
      <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.05 }}>
        <span style={wordmarkStyle}>Scopeo</span>
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

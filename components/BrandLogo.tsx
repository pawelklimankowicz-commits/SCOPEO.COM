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
  /** Tylko znak (SVG) — 1 = jak dotychczas; np. 0.7 = −30% samej ikony, napis „Scopeo” bez zmian. */
  markScale?: number;
  /**
   * Sposób liczenia wysokości znaku: `column` = cały blok (Scopeo + ESG) — pełna współliniowość;
   * `title` = tylko wiersz „Scopeo” — mniejsza ikona, lepsze dopasowanie wizualne w pasku nawigacji.
   */
  markSizeBasis?: 'column' | 'title';
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
 * Wysokość znaku = wysokość bloku tekstu (oba wiersze + odstęp), żeby górne i dolne krawędzie były współliniowe z napisami.
 */
export function BrandLogoLockup({
  size = 26,
  markScale = 1,
  markSizeBasis = 'column',
  withWordmark = true,
  wordmarkColor = '#0f172a',
  taglineColor = '#64748b',
  showTagline = true,
  style,
  wordmarkSurface = 'light',
  wordmarkFlat = false,
}: LockupProps) {
  if (!withWordmark) {
    const onlyMark = Math.max(8, Math.round(size * markScale));
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
        <BrandLogoMark size={onlyMark} />
      </span>
    );
  }

  const titleSize = Math.max(16, Math.round(size * 1.22));
  const tagSize = Math.max(7, Math.round(size * 0.4));
  /** Współliniowość z kolumną tekstu: line-height ≈ wysokość linii + margin między wierszami. */
  const lineBox = 1.08;
  const titleBlockHeight = titleSize * lineBox;
  const textColumnHeight =
    titleBlockHeight + (showTagline ? 3 + tagSize * lineBox : 0);
  const markBasis =
    markSizeBasis === 'title' ? titleBlockHeight : textColumnHeight;
  const markSize = Math.max(20, Math.round(markBasis));
  const markDisplaySize = Math.max(12, Math.round(markSize * markScale));

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
      <BrandLogoMark size={markDisplaySize} />
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          lineHeight: lineBox,
        }}
      >
        <span style={{ ...wordmarkStyle, lineHeight: lineBox }}>Scopeo</span>
        {showTagline ? (
          <span
            style={{
              fontFamily: 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)',
              fontSize: tagSize,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: taglineColor,
              marginTop: 3,
              lineHeight: lineBox,
            }}
          >
            ESG INTELLIGENCE
          </span>
        ) : null}
      </span>
    </span>
  );
}

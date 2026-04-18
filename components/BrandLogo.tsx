import type { CSSProperties } from 'react';

type LockupProps = {
  size?: number;
  withWordmark?: boolean;
  wordmarkColor?: string;
  style?: CSSProperties;
};

export function BrandLogoMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/brand/scopeo-mark.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    />
  );
}

export function BrandLogoLockup({
  size = 26,
  withWordmark = true,
  wordmarkColor = '#22c55e',
  style,
}: LockupProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
      <BrandLogoMark size={size} />
      {withWordmark ? (
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: wordmarkColor,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Scopeo
        </span>
      ) : null}
    </span>
  );
}

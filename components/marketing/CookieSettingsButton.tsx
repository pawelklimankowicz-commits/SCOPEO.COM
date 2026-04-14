'use client';

const OPEN_SETTINGS_EVENT = 'scopeo:open-cookie-settings';

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}
      style={{
        background: 'transparent',
        border: 0,
        color: '#334155',
        textDecoration: 'underline',
        cursor: 'pointer',
        padding: 0,
        font: 'inherit',
      }}
    >
      Ustawienia cookies
    </button>
  );
}

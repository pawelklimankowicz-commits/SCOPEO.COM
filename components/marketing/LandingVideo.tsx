import Link from 'next/link';

/**
 * Sekcja „film” na landing page.
 * Domyślnie: 15-sekundowa pętla animacji (CSS) — KSeF, ślad węglowy, klimat, SaaS UE, marka Scopeo.
 * Opcjonalnie: ustaw NEXT_PUBLIC_LANDING_VIDEO_URL na URL MP4 (np. Vercel Blob), aby pokazać klasyczne wideo.
 */
export default function LandingVideo() {
  const mp4Url = process.env.NEXT_PUBLIC_LANDING_VIDEO_URL?.trim();

  if (mp4Url) {
    return (
      <section className="mkt-section mkt-section--surface" aria-labelledby="landing-video-heading">
        <div className="mkt-inner">
          <p className="mkt-kicker">Film</p>
          <h2 id="landing-video-heading" className="mkt-section-title">
            Zobacz Scopeo w akcji
          </h2>
          <p className="mkt-section-lead">
            Krótki materiał o produkcie — włącz polskie napisy w odtwarzaczu (ikona CC), jeśli są dostępne.
          </p>
          <div className="mkt-video-wrap">
            <video className="mkt-video" controls playsInline preload="metadata" poster="/marketing/hero-scopeo-mint.png">
              <source src={mp4Url} type="video/mp4" />
              <track kind="subtitles" srcLang="pl" label="Polski" src="/marketing/scopeo-landing.pl.vtt" default />
            </video>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mkt-section mkt-section--surface" aria-labelledby="landing-video-heading">
      <div className="mkt-inner">
        <p className="mkt-kicker">Spot</p>
        <h2 id="landing-video-heading" className="mkt-section-title">
          Scopeo w telegraficznym skrócie
        </h2>
        <p className="mkt-section-lead">
          Animowany przegląd produktu — ślad węglowy z KSeF, ochrona klimatu przez lepsze dane, SaaS w UE.
          Sekwencja powtarza się co 15 sekund.
        </p>

        <div className="mkt-spot-static" aria-live="polite">
          <p className="mkt-spot-static-lead">
            Scopeo importuje faktury z KSeF, liczy emisje Scope 1–3 i prowadzi workflow akceptacji — bez
            chaosu Excela. Hosting w UE.
          </p>
          <div className="mkt-spot-static-cta">
            <Link href="/register" className="mkt-btn mkt-btn--primary mkt-btn--sm">
              Zacznij trial
            </Link>
            <Link href="/jak-dziala" className="mkt-btn mkt-btn--secondary mkt-btn--sm">
              Jak działa
            </Link>
          </div>
        </div>

        <div
          className="mkt-spot-motion"
          role="img"
          aria-label="Animacja: KSeF i automatyczny import, ślad węglowy Scope 1 do 3, mniejszy ślad środowiskowy dzięki lepszym danym, oprogramowanie SaaS w Unii Europejskiej, marka Scopeo i zaproszenie do trialu. Powtarza się co piętnaście sekund."
        >
          <div className="mkt-spot-frame">
            <div className="mkt-spot-progress" aria-hidden />
            <div className="mkt-spot-inner">
              <div className="mkt-spot-scene mkt-spot-scene--0">
                <svg className="mkt-spot-icon" viewBox="0 0 48 48" fill="none" aria-hidden>
                  <rect x="7" y="5" width="34" height="38" rx="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M13 15h22M13 21h16M13 27h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="mkt-spot-k">KSeF</p>
                <p className="mkt-spot-t">Faktury w jednym strumieniu danych</p>
                <p className="mkt-spot-s">Automatyczny import — bez przepisywania do Excela</p>
              </div>
              <div className="mkt-spot-scene mkt-spot-scene--1">
                <div className="mkt-spot-bars" aria-hidden>
                  <span className="mkt-spot-bar" />
                  <span className="mkt-spot-bar" />
                  <span className="mkt-spot-bar" />
                </div>
                <p className="mkt-spot-k">Ślad węglowy</p>
                <p className="mkt-spot-t">Scope 1 · 2 · 3 z transakcji</p>
                <p className="mkt-spot-s">Mapowanie i współczynniki — pod kontrolą zespołu</p>
              </div>
              <div className="mkt-spot-scene mkt-spot-scene--2">
                <svg className="mkt-spot-icon" viewBox="0 0 48 48" fill="none" aria-hidden>
                  <path
                    d="M24 42c8-6 14-14 14-22a14 14 0 1 0-28 0c0 8 6 16 14 22z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 38c-4-5-8-11-8-18a8 8 0 0 1 16 0c0 7-4 13-8 18z"
                    fill="currentColor"
                    opacity="0.25"
                  />
                </svg>
                <p className="mkt-spot-k">Ochrona środowiska</p>
                <p className="mkt-spot-t">Mniej szacunków — więcej faktów</p>
                <p className="mkt-spot-s">Lepsze dane pomagają realnie ograniczać emisje</p>
              </div>
              <div className="mkt-spot-scene mkt-spot-scene--3">
                <svg className="mkt-spot-icon" viewBox="0 0 48 48" fill="none" aria-hidden>
                  <path
                    d="M12 32c0-8 6-14 14-18 8 4 14 10 14 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect x="10" y="14" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M24 22v4M21 26h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="mkt-spot-k">SaaS</p>
                <p className="mkt-spot-t">W chmurze, infrastruktura w UE</p>
                <p className="mkt-spot-s">Subskrypcja, role, bezpieczeństwo — jak w poważnym B2B</p>
              </div>
              <div className="mkt-spot-scene mkt-spot-scene--4">
                <div className="mkt-spot-brand">
                  <span className="mkt-spot-logo-mark" aria-hidden />
                  <span className="mkt-spot-logo-text">Scopeo</span>
                </div>
                <p className="mkt-spot-t">Ślad węglowy firmy z KSeF</p>
                <p className="mkt-spot-s">7 dni trialu</p>
              </div>
            </div>
          </div>
          <p className="mkt-spot-hint">
            <Link href="/register" className="mkt-link">
              Zacznij bezpłatny trial →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

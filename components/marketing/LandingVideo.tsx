import Link from 'next/link';

/**
 * Domyślnie: 30-sekundowa pętla animacji (CSS) — film marketingowy w sekundzie, bez pliku MP4.
 * Dla klasycznego wideo: NEXT_PUBLIC_LANDING_VIDEO_URL = URL MP4 (np. Vercel Blob).
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
        <p className="mkt-kicker">Spot — 30 sekund</p>
        <h2 id="landing-video-heading" className="mkt-section-title">
          Scopeo w telegraficznym skrócie
        </h2>

        <div className="mkt-spot-static" aria-live="polite">
          <p className="mkt-spot-static-lead">
            Scopeo importuje faktury z KSeF, liczy emisje Scope 1–3 i prowadzi workflow akceptacji — bez
            chaosu Excela. Hosting w UE.
          </p>
          <div className="mkt-spot-static-cta">
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary mkt-btn--sm">
              Zacznij trial
            </Link>
            <Link href="/jak-dziala" className="mkt-btn mkt-btn--secondary mkt-btn--sm">
              Jak działa
            </Link>
          </div>
        </div>

        <div
          className="mkt-cine mkt-spot-motion"
          role="img"
          aria-label="Trzydziestosekundowa animacja: obietnica danych, problem rozproszenia, KSeF, macierz emisji Scope 1-3, ślad audytowy w UE, marka Scopeo. Powtarza się w pętli co trzydzieści sekund."
        >
          <div className="mkt-cine-frame">
            <div className="mkt-cine-shutter" aria-hidden />
            <div className="mkt-cine-mesh" aria-hidden />
            <div className="mkt-cine-vignette" aria-hidden />
            <div className="mkt-cine-progress" aria-hidden />

            <div className="mkt-cine-inner">
              <div className="mkt-cine-scene mkt-cine-scene--0">
                <p className="mkt-cine-eyebrow">Ślad węglowy z faktur</p>
                <p className="mkt-cine-hero">Dane, które możesz obronić</p>
                <p className="mkt-cine-sub">Jeden produkt. Pełna macierz. Gotowość do rozmów z rynkiem i audytu.</p>
              </div>

              <div className="mkt-cine-scene mkt-cine-scene--1">
                <div className="mkt-cine-chaos" aria-hidden>
                  <span className="mkt-cine-sheet" />
                  <span className="mkt-cine-sheet" />
                  <span className="mkt-cine-sheet" />
                </div>
                <p className="mkt-cine-eyebrow mkt-cine-eyebrow--warn">Czy Twój Excel jest dziś strategią jutra?</p>
                <p className="mkt-cine-t">Rozjechane wersje, ręczne błędy, brak jednej osi do audytu</p>
                <p className="mkt-cine-s">Faktury w piętnastu miejscach nie zbudują zaufania inwestora</p>
              </div>

              <div className="mkt-cine-scene mkt-cine-scene--2">
                <div className="mkt-cine-pipe" aria-hidden>
                  <div className="mkt-cine-pipe-glow" />
                  <div className="mkt-cine-floating-docs">
                    <span className="mkt-cine-pill">FV</span>
                    <span className="mkt-cine-pill">KSeF</span>
                    <span className="mkt-cine-pill mkt-cine-pill--sync">import</span>
                  </div>
                </div>
                <p className="mkt-cine-eyebrow">Połącz. Zapomnij o kopiowaniu.</p>
                <p className="mkt-cine-t">Jeden strumień faktur z KSeF</p>
                <p className="mkt-cine-s">Dane wpadają do modelu, nie do kolejnej zakładki</p>
              </div>

              <div className="mkt-cine-scene mkt-cine-scene--3">
                <div className="mkt-cine-orbit" aria-hidden>
                  <svg className="mkt-cine-orbit-svg" viewBox="0 0 200 200" fill="none" aria-hidden>
                    <defs>
                      <radialGradient id="mktCineOrbitCore" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#6ee7b7" />
                        <stop offset="100%" stopColor="#047857" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="100" r="78" className="mkt-cine-orbit-ring" />
                    <circle cx="100" cy="100" r="50" className="mkt-cine-orbit-ring mkt-cine-orbit-ring--inner" />
                    <circle cx="100" cy="100" r="24" fill="url(#mktCineOrbitCore)" className="mkt-cine-orbit-core" />
                    <text x="100" y="32" className="mkt-cine-orbit-lbl" textAnchor="middle">
                      S1
                    </text>
                    <text x="168" y="120" className="mkt-cine-orbit-lbl" textAnchor="middle">
                      S2
                    </text>
                    <text x="38" y="150" className="mkt-cine-orbit-lbl" textAnchor="middle">
                      S3
                    </text>
                  </svg>
                </div>
                <p className="mkt-cine-eyebrow">Scope 1 · 2 · 3 w jednej perspektywie</p>
                <p className="mkt-cine-t">Z transakcji, nie z „tablicy marzeń”</p>
                <p className="mkt-cine-s">Ślad, który składa się do raportu — PDF, eksporty, Twoje granice</p>
              </div>

              <div className="mkt-cine-scene mkt-cine-scene--4">
                <div className="mkt-cine-trust" aria-hidden>
                  <svg className="mkt-cine-trust-icon" viewBox="0 0 48 48" fill="none" aria-hidden>
                    <path
                      d="M12 20l7 5 16-10v18a4 4 0 0 1-2 3.5L24 40l-9-3.5A4 4 0 0 1 12 32V8l10 4 10-4v5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mkt-cine-trust-badges">
                    <span>evidence</span>
                    <span>UE</span>
                    <span>review</span>
                  </div>
                </div>
                <p className="mkt-cine-eyebrow">Audit-ready, nie powerpoint-ready</p>
                <p className="mkt-cine-t">Dowody przy każdej liczbie</p>
                <p className="mkt-cine-s">Faktura → linia → czynnik. Hosting i logika w modelu, który respektujesz w due diligence</p>
              </div>

              <div className="mkt-cine-scene mkt-cine-scene--5">
                <div className="mkt-cine-brand">
                  <span className="mkt-cine-logo-glow" aria-hidden />
                  <div className="mkt-cine-logo-row">
                    <span className="mkt-cine-logo-mark" aria-hidden />
                    <span className="mkt-cine-logo-text">Scopeo</span>
                  </div>
                </div>
                <p className="mkt-cine-hero mkt-cine-hero--finale">Zobacz emisje na własnych fakturach</p>
                <p className="mkt-cine-cta">7 dni bezpłatnie · onboarding w minuty</p>
              </div>
            </div>
          </div>
          <p className="mkt-spot-hint mkt-cine-hint">
            <Link href="/kontakt#demo" className="mkt-link">
              Zacznij bezpłatny trial
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

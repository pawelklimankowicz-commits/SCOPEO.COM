export default function LandingVideo() {
  return (
    <section className="mkt-section mkt-section--surface" aria-labelledby="landing-video-heading">
      <div className="mkt-inner">
        <p className="mkt-kicker">Film</p>
        <h2 id="landing-video-heading" className="mkt-section-title">
          Zobacz Scopeo w akcji
        </h2>
        <p className="mkt-section-lead">
          Krótki materiał o produkcie — włącz polskie napisy w odtwarzaczu (ikona CC), jeśli nie są
          widoczne domyślnie.
        </p>
        <div className="mkt-video-wrap">
          <video
            className="mkt-video"
            controls
            playsInline
            preload="metadata"
            poster="/marketing/hero-scopeo-mint.png"
          >
            <source src="/marketing/scopeo-landing.mp4" type="video/mp4" />
            <track
              kind="subtitles"
              srcLang="pl"
              label="Polski"
              src="/marketing/scopeo-landing.pl.vtt"
              default
            />
          </video>
        </div>
      </div>
    </section>
  );
}

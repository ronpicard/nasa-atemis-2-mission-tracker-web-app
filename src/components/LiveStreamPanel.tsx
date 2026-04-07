/** Official NASA YouTube channel IDs (live_stream embed shows current live or last event). */
const YT_NASA_MAIN = 'UCtxD0x6Hs_9Q9lq1Wwzj16Q'
const YT_NASA_KENNEDY = 'UC1quGPEPIWU0Eqw79xjyrXg'

function StreamEmbed({ title, channelId }: { title: string; channelId: string }) {
  const src = `https://www.youtube.com/embed/live_stream?channel=${channelId}`
  return (
    <div className="stream-embed-card">
      <h3 className="stream-embed-title">{title}</h3>
      <div className="stream-embed-aspect">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}

export function LiveStreamPanel() {
  return (
    <section className="panel mcc-panel stream-panel mcc-interactive-panel">
      <div className="panel-title-row stream-title">
        <span className="mcc-deco" aria-hidden />
        <h2>NASA live (YouTube)</h2>
      </div>
      <p className="stream-note">
        Embedded players use NASA’s official YouTube channels. If a stream is offline you may see a placeholder
        or the channel’s latest video — open{' '}
        <a href="https://www.youtube.com/@NASA/streams" target="_blank" rel="noreferrer">
          @NASA streams
        </a>{' '}
        in a new tab for the full YouTube UI.
      </p>

      <div className="stream-embed-grid">
        <StreamEmbed title="NASA · Live" channelId={YT_NASA_MAIN} />
        <StreamEmbed title="NASA Kennedy Space Center · Live" channelId={YT_NASA_KENNEDY} />
      </div>

      <ul className="stream-link-grid stream-link-grid-below">
        <li>
          <a
            className="stream-external-card"
            href="https://www.nasa.gov/nasalive/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="stream-external-title">NASA Live hub</span>
            <span className="stream-external-sub muted">Schedules and streams</span>
          </a>
        </li>
        <li>
          <a
            className="stream-external-card"
            href="https://plus.nasa.gov/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="stream-external-title">NASA+</span>
            <span className="stream-external-sub muted">Programs and replays</span>
          </a>
        </li>
        <li>
          <a
            className="stream-external-card"
            href="https://www.youtube.com/@NASA/streams"
            target="_blank"
            rel="noreferrer"
          >
            <span className="stream-external-title">YouTube · NASA</span>
            <span className="stream-external-sub muted">@NASA streams</span>
          </a>
        </li>
        <li>
          <a
            className="stream-external-card"
            href="https://www.nasa.gov/live/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="stream-external-title">nasa.gov/live</span>
            <span className="stream-external-sub muted">Event pages</span>
          </a>
        </li>
      </ul>

      <div className="archive-block">
        <h3 className="archive-heading">Archives &amp; libraries</h3>
        <p className="archive-intro muted small">
          Rewatch briefings, launches, and mission events from official NASA channels.
        </p>
        <ul className="archive-links">
          <li>
            <a href="https://images.nasa.gov/" target="_blank" rel="noreferrer">
              NASA Image and Video Library
            </a>{' '}
            — mission replays and b-roll.
          </li>
          <li>
            <a href="https://www.youtube.com/@NASA/videos" target="_blank" rel="noreferrer">
              NASA YouTube · videos
            </a>{' '}
            — uploaded broadcasts and highlights.
          </li>
          <li>
            <a href="https://svs.gsfc.nasa.gov/gallery/live-shots-gallery/" target="_blank" rel="noreferrer">
              NASA SVS · Live Shots
            </a>{' '}
            — produced media packages.
          </li>
        </ul>
      </div>
    </section>
  )
}

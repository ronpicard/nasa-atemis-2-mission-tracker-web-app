export function LiveStreamPanel() {
  return (
    <section className="panel mcc-panel stream-panel mcc-interactive-panel">
      <div className="panel-title-row stream-title">
        <span className="mcc-deco" aria-hidden />
        <h2>Official NASA coverage (open in browser)</h2>
      </div>
      <p className="stream-note">
        Embedded video and in-page NASA TV streams are often blocked by browser or network policy.
        Use these official links instead — they open in a new tab.
      </p>
      <ul className="stream-link-grid">
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

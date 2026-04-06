import { useCallback, useRef } from 'react'
import { useInfiniteArtemisFeed } from '../hooks/useInfiniteArtemisFeed'

export function MissionTranscript() {
  const { lines, error, loadingInitial, loadingMore, exhausted, loadOlder } = useInfiniteArtemisFeed()
  const listRef = useRef<HTMLUListElement>(null)

  const onScroll = useCallback(() => {
    const el = listRef.current
    if (!el || loadingMore || exhausted || loadingInitial) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140
    if (nearBottom) void loadOlder()
  }, [loadOlder, loadingMore, exhausted, loadingInitial])

  return (
    <section className="panel mcc-panel transcript-panel mcc-interactive-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="mcc-deco" aria-hidden />
          <h2>Mission wire · NASA RSS</h2>
        </div>
        <span className="source-pill sim">FILTERED</span>
      </div>
      <p className="transcript-note">
        Newest items at the top. Scroll <strong>down</strong> to load older pages from{' '}
        <a href="https://www.nasa.gov/feed/" target="_blank" rel="noreferrer">
          nasa.gov/feed
        </a>{' '}
        (<code className="mono">?paged=n</code>) — filtered for Artemis / Orion / SLS. Not a literal
        mission voice loop.
      </p>
      {loadingInitial ? <p className="muted mcc-blink">ACQUIRING DOWNLINK…</p> : null}
      {error ? <p className="panel-error">{error}</p> : null}
      <ul
        ref={listRef}
        className="transcript-list mcc-scroll"
        aria-live="polite"
        onScroll={onScroll}
      >
        {lines.map((line) => (
          <li key={line.id} className="transcript-item">
            <div className="transcript-meta mono">
              <time dateTime={new Date(line.pubTs).toISOString()}>{line.zulu}</time>
            </div>
            <a className="transcript-title" href={line.link} target="_blank" rel="noreferrer">
              {line.title}
            </a>
            <p className="transcript-body">{line.body}</p>
          </li>
        ))}
      </ul>
      {loadingMore ? <p className="transcript-loading mono">LOADING ARCHIVE PAGE…</p> : null}
      {exhausted && !loadingInitial ? (
        <p className="transcript-end mono">END OF RSS ARCHIVE · NO FURTHER PAGES</p>
      ) : null}
    </section>
  )
}

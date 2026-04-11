import { DEFAULT_MISSION_HOURS } from '../lib/missionTimeline'
import { formatMET } from '../lib/telemetrySource'

type Props = {
  displayMet: number
  metNow: number
  followLive: boolean
  scrubHours: number
  setScrub: (h: number) => void
  jumpToLive: () => void
  /** When true, renders inside the trajectory card (no outer panel shell). */
  embedded?: boolean
}

export function MissionReplayControls({
  displayMet,
  metNow,
  followLive,
  scrubHours,
  setScrub,
  jumpToLive,
  embedded = false,
}: Props) {
  // Live mode follows wrapped MET (0…duration); replay scrub can extend past nominal end for inspection.
  const maxScrub = Math.max(DEFAULT_MISSION_HOURS, Math.ceil(Math.max(metNow, scrubHours) / 24) * 24)
  const sliderValue = followLive ? displayMet : Math.min(maxScrub, scrubHours)

  const body = (
    <>
      <div className="panel-header trajectory-replay-header">
        <div className="panel-title-row">
          {!embedded ? <span className="mcc-deco" aria-hidden /> : null}
          <h2 className={embedded ? 'trajectory-replay-title' : undefined}>
            Timeline replay · modeled state
          </h2>
        </div>
        <span className={`source-pill ${followLive ? 'live' : 'sim'}`}>
          {followLive ? 'LIVE CLOCK' : 'REPLAY'}
        </span>
      </div>
      <p className="replay-help">
        Replay auto-plays the modeled timeline (loops); scrub the slider to jump. Values are the app’s
        reference profile (not official ephemeris). “Jump to live clock” follows wall time from T0 (then
        loops every {DEFAULT_MISSION_HOURS}h MET).
      </p>
      <div className="replay-row">
        <label className="replay-label mono" htmlFor="met-scrub">
          MET {formatMET(displayMet)}
        </label>
        <input
          id="met-scrub"
          type="range"
          min={0}
          max={followLive ? DEFAULT_MISSION_HOURS : maxScrub}
          step={0.25}
          value={sliderValue}
          onChange={(e) => setScrub(Number(e.target.value))}
          className="replay-slider"
        />
        <div className="replay-meta mono">
          <span>T+ {formatMET(displayMet)}</span>
          <span className="replay-meta-sub">
            {followLive
              ? `WALL ${formatMET(metNow)}`
              : `SCRUB ${formatMET(Math.min(maxScrub, scrubHours))}`}
          </span>
        </div>
      </div>
      <div className="replay-actions">
        <button type="button" className="mcc-btn" onClick={jumpToLive} disabled={followLive}>
          Jump to live clock
        </button>
      </div>
    </>
  )

  if (embedded) {
    return <div className="trajectory-replay-embedded">{body}</div>
  }

  return (
    <section className="panel mcc-panel replay-panel mcc-interactive-panel">
      {body}
    </section>
  )
}

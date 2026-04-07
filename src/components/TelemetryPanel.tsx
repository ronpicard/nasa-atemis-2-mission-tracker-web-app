import { useEffect, useMemo, useState } from 'react'
import { formatMET, missionScenarioZulu, type TelemetrySnapshot } from '../lib/telemetrySource'
import { DEFAULT_MISSION_HOURS, getMissionT0 } from '../lib/missionTimeline'

type Props = {
  data: TelemetrySnapshot | null
  error: string | null
  isReplay: boolean
  /** Shown when following live clock but the AROW poll failed (modeled fallback still shown). */
  fetchError?: string | null
  /** Compact shell for the trajectory card sidebar. */
  embedded?: boolean
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="metric metric-tile">
      <span className="metric-label">{label}</span>
      <span className="metric-value mono">
        {value}
        {unit ? <span className="metric-unit">{unit}</span> : null}
      </span>
    </div>
  )
}

export function TelemetryPanel({ data, error, isReplay, fetchError, embedded = false }: Props) {
  const t0 = getMissionT0()
  const shellClass = embedded
    ? 'telemetry-embedded mcc-interactive-panel'
    : 'panel mcc-panel telemetry-panel mcc-interactive-panel'

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [])

  const metHoursLive = useMemo(() => {
    if (!data) return 0
    // Replay already has an exact MET; in live mode, interpolate between telemetry polls.
    if (isReplay) return data.metHours
    const base = data.metHours
    const updatedAtMs = Date.parse(data.updatedAt)
    if (!Number.isFinite(updatedAtMs)) return base
    const deltaHours = Math.max(0, nowMs - updatedAtMs) / 3_600_000
    return base + deltaHours
  }, [data, isReplay, nowMs])

  if (error && !data) {
    return (
      <section className={shellClass}>
        <div className="panel-title-row">
          {!embedded ? <span className="mcc-deco" aria-hidden /> : null}
          <h2>Telemetry</h2>
        </div>
        <p className="panel-error">{error}</p>
      </section>
    )
  }
  if (!data) {
    return (
      <section className={shellClass}>
        <div className="panel-title-row">
          {!embedded ? <span className="mcc-deco" aria-hidden /> : null}
          <h2>Telemetry</h2>
        </div>
        <p className="muted mcc-blink">ACQUIRING SIGNAL…</p>
      </section>
    )
  }

  const metLabel = formatMET(metHoursLive)
  const scenarioZulu = missionScenarioZulu(metHoursLive)
  const pct = Math.min(100, Math.round((metHoursLive / DEFAULT_MISSION_HOURS) * 100))

  return (
    <section className={shellClass}>
      <div className="panel-header">
        <div className="panel-title-row">
          {!embedded ? <span className="mcc-deco" aria-hidden /> : null}
          <h2>{embedded ? 'Telemetry' : 'Telemetry & status'}</h2>
        </div>
        <div className="pill-row">
          {isReplay ? <span className="source-pill replay">REPLAY</span> : null}
          <span
            className={`source-pill ${isReplay ? 'sim' : 'live'}`}
            title={
              isReplay
                ? 'Scrubbed timeline using the app’s reference trajectory (not official ephemeris).'
                : data.source === 'arow'
                  ? 'Pulled from a public NASA AROW API mirror.'
                  : 'Real-time mission clock with reference trajectory — AROW mirror unreachable; values are modeled from the same timeline as replay.'
            }
          >
            {isReplay ? 'Timeline model' : data.source === 'arow' ? 'Real' : 'Real-time'}
          </span>
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="Mission elapsed time" value={metLabel} />
        <Metric label="Mission date &amp; time (Zulu)" value={scenarioZulu} />
        <Metric label="Phase" value={data.phase} />
        <Metric
          label="Distance from Earth"
          value={data.distEarthMi.toLocaleString()}
          unit=" mi"
        />
        <Metric label="Distance from Moon" value={data.distMoonMi.toLocaleString()} unit=" mi" />
        <Metric label="Speed (approx.)" value={data.speedMph.toLocaleString()} unit=" mph" />
        {data.attitudeDeg ? (
          <Metric
            label="Attitude (deg)"
            value={`R ${data.attitudeDeg.roll}  P ${data.attitudeDeg.pitch}  Y ${data.attitudeDeg.yaw}`}
          />
        ) : null}
        {data.solarArrayPct != null ? (
          <Metric label="Solar arrays (est.)" value={`${data.solarArrayPct}`} unit=" %" />
        ) : null}
        {data.signal ? <Metric label="RF / DSN" value={data.signal} /> : null}
      </div>

      <div className="met-bar-wrap">
        <div className="met-bar-label mono">
          Mission timeline ~{DEFAULT_MISSION_HOURS}h · T0 {t0.toISOString().slice(0, 16)}Z
        </div>
        <div
          className="met-bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="met-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="fine-print mono">Last update (Zulu): {data.updatedAt.replace('T', ' ').slice(0, 19)}</p>
      {!isReplay && fetchError ? (
        <p className="fine-print upstream-warn mono">Live poll: {fetchError}</p>
      ) : null}
    </section>
  )
}

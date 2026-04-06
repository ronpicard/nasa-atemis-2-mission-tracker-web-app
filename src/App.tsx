import './App.css'
import { ClockBar } from './components/ClockBar'
import { LiveStreamPanel } from './components/LiveStreamPanel'
import { MissionBriefing } from './components/MissionBriefing'
import { MissionReplayControls } from './components/MissionReplayControls'
import { MissionTranscript } from './components/MissionTranscript'
import { TelemetryPanel } from './components/TelemetryPanel'
import { TrajectoryView } from './components/TrajectoryView'
import { useClock } from './hooks/useClock'
import { useMissionReplay } from './hooks/useMissionReplay'
import { useTelemetry } from './hooks/useTelemetry'
import { DEFAULT_MISSION_HOURS } from './lib/missionTimeline'
import { telemetryAtMetHours } from './lib/telemetrySource'

function App() {
  const clocks = useClock()
  const { data, error } = useTelemetry(4000)
  const replay = useMissionReplay()

  const progress = Math.min(1, replay.displayMet / DEFAULT_MISSION_HOURS)
  const telemetry =
    !replay.followLive
      ? telemetryAtMetHours(replay.displayMet)
      : (data ?? telemetryAtMetHours(replay.displayMet))

  return (
    <div className="mcc-root">
      <div className="mcc-grid-bg" aria-hidden />
      <div className="mcc-scanlines" aria-hidden />
      <div className="app mcc-deck">
        <header className="hero mcc-hero">
          <div className="hero-top">
            <p className="eyebrow mono">MCC CONSOLE · ARTEMIS II</p>
            <div className="hero-status-block">
              <span
                className="hero-status mcc-blink"
                title="This page loaded and local timers and data hooks are running. It is not a statement about NASA mission communications or the Deep Space Network."
              >
                CONSOLE READY
              </span>
              <p className="hero-status-caption">
                Local dashboard — not spacecraft or DSN status. Hover the badge for detail.
              </p>
            </div>
          </div>
          <h1 className="hero-title">Artemis II Mission Tracker</h1>
          <p className="lede">
            Interactive 3D trajectory, clocks (Zulu + local), telemetry, timeline replay, NASA news wire,
            and links to official coverage. Tracking:{' '}
            <a href="https://www.nasa.gov/trackartemis" target="_blank" rel="noreferrer">
              nasa.gov/trackartemis
            </a>
            .
          </p>
          <ClockBar clocks={clocks} />
        </header>

        <MissionBriefing />

        <main className="main-grid">
          <div className="col-primary">
            <TrajectoryView progress={progress} replayMode={!replay.followLive} />
            <MissionReplayControls
              displayMet={replay.displayMet}
              metNow={replay.metNow}
              followLive={replay.followLive}
              scrubHours={replay.scrubHours}
              setScrub={replay.setScrub}
              jumpToLive={replay.jumpToLive}
            />
            <TelemetryPanel
              data={telemetry}
              error={error}
              isReplay={!replay.followLive}
              fetchError={replay.followLive ? error : null}
            />
          </div>
          <div className="col-secondary">
            <MissionTranscript />
          </div>
        </main>

        <LiveStreamPanel />

        <footer className="footer">
          <p>
            Not affiliated with NASA. If an AROW mirror is unreachable, live clock mode still shows
            real-time values from this app’s reference timeline (see telemetry tooltip). Configure{' '}
            <code className="mono">VITE_ARTEMIS_API_BASE</code> or{' '}
            <code className="mono">VITE_MISSION_T0</code> in <code className="mono">.env</code> as
            needed.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App

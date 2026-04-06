import type { ClockStrings } from '../hooks/useClock'

type Props = { clocks: ClockStrings }

export function ClockBar({ clocks }: Props) {
  return (
    <div className="clock-bar" role="status">
      <div className="clock-block">
        <span className="clock-label">Zulu (UTC)</span>
        <span className="clock-value mono">{clocks.zulu}</span>
      </div>
      <div className="clock-block">
        <span className="clock-label">Local ({clocks.localZone})</span>
        <span className="clock-value mono">{clocks.local}</span>
      </div>
    </div>
  )
}

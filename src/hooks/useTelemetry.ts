import { useEffect, useState } from 'react'
import { type TelemetrySnapshot, fetchTelemetry } from '../lib/telemetrySource'

export function useTelemetry(pollMs = 5000) {
  const [data, setData] = useState<TelemetrySnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const snap = await fetchTelemetry(new Date())
        if (alive) {
          setData(snap)
          setError(null)
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Telemetry error')
      }
    }
    tick()
    const id = window.setInterval(tick, pollMs)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [pollMs])

  return { data, error }
}

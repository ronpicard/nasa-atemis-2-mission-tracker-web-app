import { useCallback, useEffect, useState } from 'react'
import { getMissionElapsedHours } from '../lib/missionTimeline'

export function useMissionReplay() {
  const [now, setNow] = useState(() => new Date())
  const [followLive, setFollowLive] = useState(true)
  const [scrubHours, setScrubHours] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const metNow = getMissionElapsedHours(now)

  // After the modeled profile ends, keep the clock running but clamp the 3D path at the end.
  const displayMet = followLive ? metNow : scrubHours

  const setScrub = useCallback((h: number) => {
    setFollowLive(false)
    setScrubHours(Math.max(0, h))
  }, [])

  const jumpToLive = useCallback(() => {
    setFollowLive(true)
  }, [])

  return {
    now,
    metNow,
    displayMet,
    followLive,
    scrubHours,
    setScrub,
    jumpToLive,
  }
}

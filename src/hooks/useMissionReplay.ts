import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_MISSION_HOURS, getMissionElapsedHours } from '../lib/missionTimeline'

export function useMissionReplay() {
  const [now, setNow] = useState(() => new Date())
  // Always open at MET 0 (replay). A ~10-day flight stays under 240h wall MET for most of the window,
  // so gating on “mission over” never switched users off live clock — they saw mid-mission instead of launch.
  const [followLive, setFollowLive] = useState(false)
  const [scrubHours, setScrubHours] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const metNow = getMissionElapsedHours(now)

  // Live clock: wrap MET into [0, duration) after nominal mission end so 3D + telemetry keep working.
  const displayMet = followLive ? metNow % DEFAULT_MISSION_HOURS : scrubHours

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

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_MISSION_HOURS, getMissionElapsedHours } from '../lib/missionTimeline'

export function useMissionReplay() {
  const [now, setNow] = useState(() => new Date())
  const [followLive, setFollowLive] = useState(true)
  const [scrubHours, setScrubHours] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const metNow = getMissionElapsedHours(now)

  const displayMet = followLive ? Math.min(DEFAULT_MISSION_HOURS, metNow) : scrubHours

  const setScrub = useCallback((h: number) => {
    setFollowLive(false)
    setScrubHours(Math.max(0, Math.min(DEFAULT_MISSION_HOURS, h)))
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

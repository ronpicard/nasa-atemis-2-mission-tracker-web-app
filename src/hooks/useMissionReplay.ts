import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_MISSION_HOURS, getMissionElapsedHours } from '../lib/missionTimeline'

/** Wall-clock seconds for one full pass through the modeled ~240h profile (replay mode). */
const REPLAY_FULL_MISSION_WALL_SEC = 4 * 60

const REPLAY_TICK_MS = 100
const MET_STEP_PER_TICK =
  (DEFAULT_MISSION_HOURS / (REPLAY_FULL_MISSION_WALL_SEC * 1000)) * REPLAY_TICK_MS

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

  // Auto-advance MET in replay so the trajectory and telemetry play without “Jump to live”.
  useEffect(() => {
    if (followLive) return
    const id = window.setInterval(() => {
      setScrubHours((h) => {
        const next = h + MET_STEP_PER_TICK
        if (next >= DEFAULT_MISSION_HOURS) return next % DEFAULT_MISSION_HOURS
        return next
      })
    }, REPLAY_TICK_MS)
    return () => window.clearInterval(id)
  }, [followLive])

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

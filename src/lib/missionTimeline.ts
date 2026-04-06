/** Mission design-time reference: ~10-day lunar free-return profile (illustrative keyframes). */
export const DEFAULT_T0_ISO = '2026-04-01T17:00:00.000Z'
export const DEFAULT_MISSION_HOURS = 240

export type MissionPhase =
  | 'Pre-launch'
  | 'Ascent'
  | 'Earth orbit'
  | 'Translunar injection'
  | 'Outbound coast'
  | 'Lunar vicinity'
  | 'Return coast'
  | 'Entry & splashdown'
  | 'Mission complete'

type Keyframe = {
  h: number
  distEarthMi: number
  distMoonMi: number
  speedMph: number
  phase: MissionPhase
}

const KEYFRAMES: Keyframe[] = [
  { h: 0, distEarthMi: 0, distMoonMi: 238_900, speedMph: 0, phase: 'Ascent' },
  { h: 2, distEarthMi: 120, distMoonMi: 238_780, speedMph: 17_200, phase: 'Ascent' },
  { h: 6, distEarthMi: 4_200, distMoonMi: 234_700, speedMph: 17_150, phase: 'Earth orbit' },
  { h: 30, distEarthMi: 4_200, distMoonMi: 234_700, speedMph: 17_100, phase: 'Earth orbit' },
  { h: 42, distEarthMi: 8_000, distMoonMi: 230_900, speedMph: 22_800, phase: 'Translunar injection' },
  { h: 72, distEarthMi: 120_000, distMoonMi: 118_900, speedMph: 3_200, phase: 'Outbound coast' },
  { h: 144, distEarthMi: 248_655, distMoonMi: 62_000, speedMph: 2_800, phase: 'Lunar vicinity' },
  { h: 168, distEarthMi: 252_760, distMoonMi: 58_000, speedMph: 2_750, phase: 'Lunar vicinity' },
  { h: 200, distEarthMi: 180_000, distMoonMi: 58_900, speedMph: 3_100, phase: 'Return coast' },
  { h: 228, distEarthMi: 45_000, distMoonMi: 193_900, speedMph: 8_500, phase: 'Return coast' },
  { h: 236, distEarthMi: 2_000, distMoonMi: 236_900, speedMph: 24_000, phase: 'Entry & splashdown' },
  { h: 240, distEarthMi: 0, distMoonMi: 238_900, speedMph: 0, phase: 'Mission complete' },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function getMissionT0(): Date {
  const env = import.meta.env.VITE_MISSION_T0 as string | undefined
  const d = env ? new Date(env) : new Date(DEFAULT_T0_ISO)
  return Number.isNaN(d.getTime()) ? new Date(DEFAULT_T0_ISO) : d
}

export function getMissionElapsedHours(now: Date): number {
  const t0 = getMissionT0()
  return Math.max(0, (now.getTime() - t0.getTime()) / 3_600_000)
}

export function interpolateMissionState(metHours: number) {
  const capped = Math.min(metHours, KEYFRAMES[KEYFRAMES.length - 1]!.h)
  if (metHours < 0) {
    return {
      distEarthMi: 0,
      distMoonMi: 238_900,
      speedMph: 0,
      phase: 'Pre-launch' as MissionPhase,
      progress: 0,
    }
  }
  let i = 0
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1]!.h < capped) i++
  const a = KEYFRAMES[i]!
  const b = KEYFRAMES[i + 1]!
  const span = b.h - a.h || 1
  const t = (capped - a.h) / span
  const distEarthMi = Math.round(lerp(a.distEarthMi, b.distEarthMi, t))
  const distMoonMi = Math.round(lerp(a.distMoonMi, b.distMoonMi, t))
  const speedMph = Math.round(lerp(a.speedMph, b.speedMph, t))
  const phase: MissionPhase = t < 0.5 ? a.phase : b.phase
  const progress = Math.min(1, metHours / DEFAULT_MISSION_HOURS)
  return { distEarthMi, distMoonMi, speedMph, phase, progress }
}

/**
 * Stylized free-return in SVG space (viewBox 0 0 100 56): Earth left, Moon right,
 * Orion swings over the lunar far side on a circular arc (reads as “looping” the Moon).
 */
const EARTH = { x: 12, y: 30 }
const MOON_C = { x: 88, y: 24 }
const ARC_R = 7
/** Progress slices: outbound | lunar flyby | return (not equal arc-length; flyby is shorter in time). */
const P_OUT = 0.38
const P_MOON = 0.54

function quadBez(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

/** Must match `trajectoryPoint` geometry (for dashed track). */
export const TRAJECTORY_PATH_D = `M ${EARTH.x} ${EARTH.y} Q 38 14 ${MOON_C.x - ARC_R} ${MOON_C.y} A ${ARC_R} ${ARC_R} 0 0 1 ${MOON_C.x + ARC_R} ${MOON_C.y} Q 52 42 ${EARTH.x} ${EARTH.y}`

const LUNAR_ARC_START = { x: MOON_C.x - ARC_R, y: MOON_C.y }
const LUNAR_ARC_END = { x: MOON_C.x + ARC_R, y: MOON_C.y }

/** Map mission progress (0–1) to {x,y} along the free-return path. */
export function trajectoryPoint(progress: number): { x: number; y: number } {
  const p = Math.min(1, Math.max(0, progress))
  const { x: cx, y: cy } = MOON_C

  if (p < P_OUT) {
    const t = p / P_OUT
    return quadBez(t, EARTH, { x: 38, y: 14 }, LUNAR_ARC_START)
  }
  if (p < P_MOON) {
    const t = (p - P_OUT) / (P_MOON - P_OUT)
    const theta = Math.PI * (1 - t)
    return {
      x: cx + ARC_R * Math.cos(theta),
      y: cy - ARC_R * Math.sin(theta),
    }
  }
  const t = (p - P_MOON) / (1 - P_MOON)
  return quadBez(t, LUNAR_ARC_END, { x: 52, y: 42 }, EARTH)
}

const WORLD_SCALE = 0.14

/** Same geometry as the 2D plot, lifted into cislunar 3D space for WebGL. */
export function trajectoryPoint3D(progress: number): [number, number, number] {
  const { x: sx, y: sy } = trajectoryPoint(progress)
  const p = Math.min(1, Math.max(0, progress))
  const x = (sx - 50) * WORLD_SCALE
  const y = (28 - sy) * WORLD_SCALE
  const z = Math.sin(p * Math.PI) * 1.55 - 0.15 * Math.cos(p * Math.PI * 2)
  return [x, y, z]
}

export function earthMoonWorldPositions(): {
  earth: [number, number, number]
  moon: [number, number, number]
} {
  return {
    earth: trajectoryPoint3D(0),
    moon: (() => {
      const scale = WORLD_SCALE
      const x = (MOON_C.x - 50) * scale
      const y = (28 - MOON_C.y) * scale
      return [x, y, 0.35] as [number, number, number]
    })(),
  }
}

/** Samples for a tube/line along the free-return track. */
export function trajectoryWorldPoints(segments = 160): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    out.push(trajectoryPoint3D(i / segments))
  }
  return out
}

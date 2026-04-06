import {
  DEFAULT_MISSION_HOURS,
  getMissionElapsedHours,
  interpolateMissionState,
} from './missionTimeline'

export type TelemetrySnapshot = {
  /** `arow` = data from AROW API mirror; `modeled` = timeline keyframes (replay or live-clock fallback). */
  source: 'arow' | 'modeled'
  metHours: number
  metFormatted: string
  distEarthMi: number
  distMoonMi: number
  speedMph: number
  phase: string
  attitudeDeg?: { roll: number; pitch: number; yaw: number }
  solarArrayPct?: number
  signal?: string
  updatedAt: string
}

const ARTEMIS_API =
  (import.meta.env.VITE_ARTEMIS_API_BASE as string | undefined)?.replace(/\/$/, '') ??
  'https://artemis.cdnspace.ca'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function formatMET(hours: number): string {
  const totalSec = Math.floor(hours * 3600)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

type ArowApiShape = {
  mission_elapsed_time?: string
  distance_from_earth_km?: number
  distance_from_moon_km?: number
  velocity_kmh?: number
  phase?: string
  mode?: string
}

function kmToMi(km: number) {
  return Math.round(km * 0.621371)
}

function kmhToMph(kmh: number) {
  return Math.round(kmh * 0.621371)
}

/** Deterministic faux attitude from MET for replay polish. */
function attitudeForMet(h: number) {
  const r = Math.round(Math.sin(h * 0.31) * 4 - 2)
  const p = Math.round(Math.cos(h * 0.17) * 6 + 5)
  const y = Math.round((h * 41 + 120) % 360)
  return { roll: r, pitch: p, yaw: y }
}

/** Snapshot from the app’s reference timeline at arbitrary MET (replay scrub or live-clock fallback). */
export function telemetryAtMetHours(metHours: number, updatedAt = new Date().toISOString()): TelemetrySnapshot {
  const h = Math.max(0, metHours)
  const sim = interpolateMissionState(h)
  const complete = h >= DEFAULT_MISSION_HOURS
  const att = attitudeForMet(h)
  return {
    source: 'modeled',
    metHours: h,
    metFormatted: formatMET(h),
    distEarthMi: sim.distEarthMi,
    distMoonMi: sim.distMoonMi,
    speedMph: sim.speedMph,
    phase: complete ? 'Mission complete' : sim.phase,
    attitudeDeg: att,
    solarArrayPct: Math.max(72, Math.min(100, Math.round(88 + Math.sin(h * 0.2) * 8))),
    signal: 'S-band / DSN',
    updatedAt,
  }
}

async function fetchArow(): Promise<TelemetrySnapshot | null> {
  const url = `${ARTEMIS_API}/api/arow`
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const data = (await res.json()) as ArowApiShape
    const now = new Date()
    const metHours = getMissionElapsedHours(now)
    return {
      source: 'arow',
      metHours,
      metFormatted: data.mission_elapsed_time ?? formatMET(metHours),
      distEarthMi:
        data.distance_from_earth_km != null
          ? kmToMi(data.distance_from_earth_km)
          : interpolateMissionState(metHours).distEarthMi,
      distMoonMi:
        data.distance_from_moon_km != null
          ? kmToMi(data.distance_from_moon_km)
          : interpolateMissionState(metHours).distMoonMi,
      speedMph:
        data.velocity_kmh != null
          ? kmhToMph(data.velocity_kmh)
          : interpolateMissionState(metHours).speedMph,
      phase: data.phase ?? data.mode ?? interpolateMissionState(metHours).phase,
      updatedAt: now.toISOString(),
    }
  } catch {
    return null
  } finally {
    clearTimeout(id)
  }
}

export async function fetchTelemetry(now: Date): Promise<TelemetrySnapshot> {
  const live = await fetchArow()
  if (live) return live

  const metHours = getMissionElapsedHours(now)
  return telemetryAtMetHours(metHours, now.toISOString())
}

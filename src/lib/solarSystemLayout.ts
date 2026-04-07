import * as THREE from 'three'
import { sunDirectionFromEarth } from './sunDirection'
import { SCENE_EARTH_RADIUS, sceneRadiusForBody } from './planetScale'

/**
 * Bodies placed on the Earth→Sun line through Earth (coplanar “eclipse season”
 * schematic). `along` is scene units along that line from Earth: positive =
 * toward the Sun (Venus, Mercury, Sun); negative = opposition side (Mars → Neptune).
 * Earth is the textured globe in-scene, not duplicated here.
 *
 * `radius` values are **astronomical ratios** vs in-scene Earth (1.08 units = Earth).
 */
export type EclipticBodySpec = {
  name: string
  along: number
  radius: number
  color: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
  ring?: { inner: number; outer: number; opacity: number }
}

const R = sceneRadiusForBody

/** Minimum gap between sphere / ring envelopes along the Earth→Sun line (scene units). */
const ECLIPTIC_GAP = 17

/**
 * Extra space between Mercury and the Sun so the Sun sits farther away and reads smaller on screen
 * (still non-overlapping; this is on top of radii + ECLIPTIC_GAP).
 */
const SUN_DISTANCE_BOOST = 115

const SATURN_RING_OUTER = 2.25

/**
 * `along` offsets from Earth so scaled bodies do not overlap (uses ring outer extent for Saturn).
 */
function computeEclipticAlongs(): Record<
  'Sun' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune',
  number
> {
  const Re = SCENE_EARTH_RADIUS
  const rSun = R('Sun')
  const rMe = R('Mercury')
  const rVe = R('Venus')
  const rMa = R('Mars')
  const rJu = R('Jupiter')
  const rSa = R('Saturn')
  const saturnExtent = rSa * SATURN_RING_OUTER
  const rUr = R('Uranus')
  const rNe = R('Neptune')

  let p = Re + rVe + ECLIPTIC_GAP
  const alongVenus = p
  p += rVe + rMe + ECLIPTIC_GAP
  const alongMercury = p
  p += rMe + rSun + ECLIPTIC_GAP + SUN_DISTANCE_BOOST
  const alongSun = p

  let n = -(Re + rMa + ECLIPTIC_GAP)
  const alongMars = n
  n -= rMa + rJu + ECLIPTIC_GAP
  const alongJupiter = n
  n -= rJu + saturnExtent + ECLIPTIC_GAP
  const alongSaturn = n
  n -= saturnExtent + rUr + ECLIPTIC_GAP
  const alongUranus = n
  n -= rUr + rNe + ECLIPTIC_GAP
  const alongNeptune = n

  return {
    Sun: alongSun,
    Mercury: alongMercury,
    Venus: alongVenus,
    Mars: alongMars,
    Jupiter: alongJupiter,
    Saturn: alongSaturn,
    Uranus: alongUranus,
    Neptune: alongNeptune,
  }
}

const A = computeEclipticAlongs()

/** Heliocentric order (Earth is the in-scene globe, not listed). */
export const ECLIPTIC_BODIES: EclipticBodySpec[] = [
  {
    name: 'Sun',
    along: A.Sun,
    radius: R('Sun'),
    color: '#ffd9a3',
    emissive: '#ffcc66',
    emissiveIntensity: 1.35,
    roughness: 0.9,
    metalness: 0,
  },
  { name: 'Mercury', along: A.Mercury, radius: R('Mercury'), color: '#b5b0a8', roughness: 0.88, metalness: 0.05 },
  { name: 'Venus', along: A.Venus, radius: R('Venus'), color: '#d4c4a8', emissive: '#332211', emissiveIntensity: 0.08, roughness: 0.78, metalness: 0.02 },
  { name: 'Mars', along: A.Mars, radius: R('Mars'), color: '#c86f4b', roughness: 0.92, metalness: 0.02 },
  { name: 'Jupiter', along: A.Jupiter, radius: R('Jupiter'), color: '#c4b08f', emissive: '#221a10', emissiveIntensity: 0.06, roughness: 0.85, metalness: 0.02 },
  {
    name: 'Saturn',
    along: A.Saturn,
    radius: R('Saturn'),
    color: '#d9cfa5',
    emissive: '#2a2418',
    emissiveIntensity: 0.05,
    roughness: 0.82,
    metalness: 0.02,
    ring: { inner: 1.2, outer: SATURN_RING_OUTER, opacity: 0.42 },
  },
  { name: 'Uranus', along: A.Uranus, radius: R('Uranus'), color: '#9fd4e6', emissive: '#0a2830', emissiveIntensity: 0.12, roughness: 0.55, metalness: 0.08 },
  { name: 'Neptune', along: A.Neptune, radius: R('Neptune'), color: '#5b7bd4', emissive: '#0a1430', emissiveIntensity: 0.1, roughness: 0.55, metalness: 0.1 },
]

/**
 * Camera on the anti-sun side of Earth–Moon, offset sideways along the ecliptic
 * so both the Sunward inner planets and opposition-side outers stay in the frustum.
 */
export function initialOrbitCamera(
  earth: [number, number, number],
  moon: [number, number, number],
): { position: [number, number, number]; target: [number, number, number] } {
  const u = sunDirectionFromEarth(new Date())
  const ev = new THREE.Vector3(...earth)
  const mv = new THREE.Vector3(...moon)
  const mid = ev.clone().lerp(mv, 0.5)
  const worldUp = new THREE.Vector3(0, 1, 0)
  const east = new THREE.Vector3().crossVectors(u, worldUp)
  if (east.lengthSq() < 1e-6) east.set(1, 0, 0)
  else east.normalize()
  const cam = mid
    .clone()
    .add(u.clone().multiplyScalar(-58))
    .add(east.multiplyScalar(22))
    .add(new THREE.Vector3(0, 12, 0))
  return {
    position: [cam.x, cam.y, cam.z],
    target: [mid.x, mid.y, mid.z],
  }
}

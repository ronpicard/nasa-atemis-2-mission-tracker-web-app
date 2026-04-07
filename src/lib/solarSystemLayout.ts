import * as THREE from 'three'
import { sunDirectionFromEarth } from './sunDirection'

/**
 * Bodies placed on the Earth→Sun line through Earth (coplanar “eclipse season”
 * schematic). `along` is scene units along that line from Earth: positive =
 * toward the Sun (Venus, Mercury, Sun); negative = opposition side (Mars → Neptune).
 * Earth is the textured globe in-scene, not duplicated here.
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

export const ECLIPTIC_BODIES: EclipticBodySpec[] = [
  { name: 'Neptune', along: -84, radius: 0.36, color: '#5b7bd4', emissive: '#0a1430', emissiveIntensity: 0.1, roughness: 0.55, metalness: 0.1 },
  { name: 'Uranus', along: -70, radius: 0.38, color: '#9fd4e6', emissive: '#0a2830', emissiveIntensity: 0.12, roughness: 0.55, metalness: 0.08 },
  {
    name: 'Saturn',
    along: -56,
    radius: 0.8,
    color: '#d9cfa5',
    emissive: '#2a2418',
    emissiveIntensity: 0.05,
    roughness: 0.82,
    metalness: 0.02,
    ring: { inner: 1.05, outer: 1.65, opacity: 0.42 },
  },
  { name: 'Jupiter', along: -42, radius: 0.95, color: '#c4b08f', emissive: '#221a10', emissiveIntensity: 0.06, roughness: 0.85, metalness: 0.02 },
  { name: 'Mars', along: -28, radius: 0.16, color: '#c86f4b', roughness: 0.92, metalness: 0.02 },
  { name: 'Venus', along: 20, radius: 0.22, color: '#d4c4a8', emissive: '#332211', emissiveIntensity: 0.08, roughness: 0.78, metalness: 0.02 },
  { name: 'Mercury', along: 36, radius: 0.14, color: '#b5b0a8', roughness: 0.88, metalness: 0.05 },
  {
    name: 'Sun',
    along: 94,
    radius: 3.2,
    color: '#ffd9a3',
    emissive: '#ffcc66',
    emissiveIntensity: 1.35,
    roughness: 0.9,
    metalness: 0,
  },
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
    .add(u.clone().multiplyScalar(-34))
    .add(east.multiplyScalar(16))
    .add(new THREE.Vector3(0, 10, 0))
  return {
    position: [cam.x, cam.y, cam.z],
    target: [mid.x, mid.y, mid.z],
  }
}

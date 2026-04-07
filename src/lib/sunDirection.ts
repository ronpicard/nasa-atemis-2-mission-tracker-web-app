import * as THREE from 'three'

/**
 * Approximate unit vector from Earth toward the Sun (Y-up, +X at equator lon 0°, +Y north).
 */
export function sunDirectionFromEarth(date: Date): THREE.Vector3 {
  const jd =
    date.getTime() / 86_400_000 -
    10957.5 +
    (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24
  const n = jd - 2451545.0
  const L = ((280.46 + 0.9856474 * n) % 360) * (Math.PI / 180)
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180)
  const lambda = L + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180)
  const epsilon = (23.439 - 0.0000004 * n) * (Math.PI / 180)
  const x = Math.cos(lambda)
  const y = Math.sin(lambda) * Math.sin(epsilon)
  const z = Math.sin(lambda) * Math.cos(epsilon)
  return new THREE.Vector3(x, y, z).normalize()
}

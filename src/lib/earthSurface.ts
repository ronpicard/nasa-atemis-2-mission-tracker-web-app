import * as THREE from 'three'

/** Unit direction on unit sphere (+Y north, +X at lon 0°, lat 0°). */
export function latLonToUnitYUp(latDeg: number, lonDeg: number): THREE.Vector3 {
  const φ = (latDeg * Math.PI) / 180
  const λ = (lonDeg * Math.PI) / 180
  const cosφ = Math.cos(φ)
  return new THREE.Vector3(cosφ * Math.cos(λ), Math.sin(φ), cosφ * Math.sin(λ))
}

/** KSC Launch Complex 39B (approximate). */
export const KSC_39B = { lat: 28.627_222, lon: -80.620_833, label: 'Launch · LC-39B' }

/** Illustrative Pacific splashdown (nominal recovery zone). */
export const PACIFIC_SPLASHDOWN_NOMINAL = {
  lat: 29.5,
  lon: -120.0,
  label: 'Splashdown · Pacific (nominal)',
}

/**
 * Align markers with typical equirectangular Earth textures on Three.js spheres
 * (prime meridian / Americas).
 */
const TEXTURE_YAW_OFFSET = -Math.PI * 0.5

export function markerDirectionOnEarth(latDeg: number, lonDeg: number): THREE.Vector3 {
  return latLonToUnitYUp(latDeg, lonDeg).applyAxisAngle(new THREE.Vector3(0, 1, 0), TEXTURE_YAW_OFFSET)
}

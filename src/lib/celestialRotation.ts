/** Sidereal day: Earth vs stars (~23h 56m 4.09s), seconds. */
export const EARTH_SIDEREAL_DAY_SEC = 86_164.0905

/**
 * Moon rotation period ≈ sidereal month (tidally locked), days → seconds.
 * IAU mean sidereal month: 27.321661 days.
 */
export const MOON_SIDEREAL_ROTATION_SEC = 27.321_661 * 86_400

/** Radians per second for prograde rotation about +Y. */
export function siderealOmegaRadPerSec(periodSec: number): number {
  return (2 * Math.PI) / periodSec
}

export const EARTH_OMEGA_RAD_S = siderealOmegaRadPerSec(EARTH_SIDEREAL_DAY_SEC)
export const MOON_OMEGA_RAD_S = siderealOmegaRadPerSec(MOON_SIDEREAL_ROTATION_SEC)

/** When prefers-reduced-motion, slow spin so motion is still visible but not distracting. */
export const REDUCED_MOTION_SPIN_SCALE = 0.2

/**
 * Mean / reference radii (km). Ratios match NASA fact sheet values closely.
 * Scene units: Earth globe in TrajectoryView uses `SCENE_EARTH_RADIUS`.
 */
export const SCENE_EARTH_RADIUS = 1.08

const R_EARTH_KM = 6371

const RADII_KM = {
  Sun: 696_340,
  Mercury: 2439.7,
  Venus: 6051.8,
  Earth: R_EARTH_KM,
  Moon: 1737.4,
  Mars: 3389.5,
  Jupiter: 69_911,
  Saturn: 58_232,
  Uranus: 25_362,
  Neptune: 24_622,
} as const

/** Sphere radius in scene units for a body, given its radius in km. */
export function sceneRadiusKm(km: number): number {
  return SCENE_EARTH_RADIUS * (km / R_EARTH_KM)
}

export function sceneRadiusForBody(name: keyof typeof RADII_KM): number {
  return sceneRadiusKm(RADII_KM[name])
}

export const SCENE_MOON_RADIUS = sceneRadiusKm(RADII_KM.Moon)

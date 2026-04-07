import { useMemo } from 'react'
import * as THREE from 'three'

type Props = {
  /** Outer radius of the star shell (scene units). */
  radius: number
  /** Thickness of the shell (stars sampled between radius - depth and radius). */
  depth: number
  count: number
  reducedMotion: boolean
}

/**
 * Visible star backdrop: drei's `Stars` shrinks points as ~1/depth, so a large shell
 * makes almost all stars sub-pixel. This uses `PointsMaterial` with attenuation off so
 * stars stay readable at any distance.
 */
export function MissionStarfield({ radius, depth, count, reducedMotion }: Props) {
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color()
    const rMin = Math.max(radius - depth, 1)
    const rMax = radius

    for (let i = 0; i < count; i++) {
      const r = rMin + Math.random() * (rMax - rMin)
      const u = Math.random()
      const v = Math.random()
      const theta = Math.acos(2 * u - 1)
      const phi = 2 * Math.PI * v
      const st = Math.sin(theta)
      positions[i * 3] = r * st * Math.cos(phi)
      positions[i * 3 + 1] = r * st * Math.sin(phi)
      positions[i * 3 + 2] = r * Math.cos(theta)

      c.setHSL((i / Math.max(1, count - 1)) % 1, 0.32 + Math.random() * 0.18, 0.58 + Math.random() * 0.14)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    return { positions, colors }
  }, [count, depth, radius])

  const baseSize = reducedMotion ? 1.35 : 2.05

  return (
    <points frustumCulled={false} renderOrder={-20}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={baseSize}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.48}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

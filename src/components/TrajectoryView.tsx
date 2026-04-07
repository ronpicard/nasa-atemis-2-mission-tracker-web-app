import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, Stars, useTexture } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Line2, LineMaterial } from 'three-stdlib'
import { MissionReplayControls } from './MissionReplayControls'
import {
  earthMoonWorldPositions,
  trajectoryPoint3D,
  trajectoryWorldPoints,
} from '../lib/missionTimeline'
import { sunDirectionFromEarth } from '../lib/sunDirection'
import {
  KSC_39B,
  PACIFIC_SPLASHDOWN_NOMINAL,
  markerDirectionOnEarth,
} from '../lib/earthSurface'
import { ECLIPTIC_BODIES, type EclipticBodySpec } from '../lib/solarSystemLayout'
import {
  EARTH_OMEGA_RAD_S,
  MOON_OMEGA_RAD_S,
  REDUCED_MOTION_SPIN_SCALE,
} from '../lib/celestialRotation'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { TelemetrySnapshot } from '../lib/telemetrySource'
import { TelemetryPanel } from './TelemetryPanel'
import { SunRealistic } from './SunRealistic'
import { SCENE_EARTH_RADIUS, SCENE_MOON_RADIUS } from '../lib/planetScale'

const EARTH_MAP =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_atmos_2048.jpg'
const EARTH_NIGHT_MAP =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_lights_2048.png'
const MOON_MAP =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/moon_1024.jpg'

function initialRouteCamera(): { position: [number, number, number]; target: [number, number, number] } {
  const points = trajectoryWorldPoints(260).map((p) => new THREE.Vector3(...p))
  const box = new THREE.Box3().setFromPoints(points)
  const sphere = new THREE.Sphere()
  box.getBoundingSphere(sphere)

  // 3/4 view: makes the Earth–Moon arc and return leg easier to read.
  const viewDir = new THREE.Vector3(0.9, 0.55, 1.25).normalize()
  const dist = Math.max(10.5, sphere.radius * 2.85)
  const pos = sphere.center.clone().add(viewDir.multiplyScalar(dist))

  return {
    position: [pos.x, pos.y, pos.z],
    target: [sphere.center.x, sphere.center.y, sphere.center.z],
  }
}

function EarthNightLights({ radius }: { radius: number }) {
  const tex = useTexture(EARTH_NIGHT_MAP, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  })
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => {
    return {
      uTex: { value: tex },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uIntensity: { value: 1.25 },
    }
  }, [tex])

  useFrame(() => {
    const m = matRef.current
    if (!m) return
    uniforms.uSunDir.value.copy(sunDirectionFromEarth(new Date())).normalize()
  })

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.003, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vNormalW;
          void main() {
            vUv = uv;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D uTex;
          uniform vec3 uSunDir;
          uniform float uIntensity;
          varying vec2 vUv;
          varying vec3 vNormalW;
          void main() {
            float ndl = dot(normalize(vNormalW), normalize(uSunDir));
            float night = smoothstep(0.15, -0.25, ndl);
            vec3 lights = texture2D(uTex, vUv).rgb;
            vec3 col = lights * (night * uIntensity);
            float a = clamp(max(max(col.r, col.g), col.b) * 1.2, 0.0, 0.85);
            gl_FragColor = vec4(col, a);
          }
        `}
      />
    </mesh>
  )
}

function SunLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const sunDir = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const L = lightRef.current
    if (!L) return
    sunDir.copy(sunDirectionFromEarth(new Date()))
    L.position.copy(sunDir.multiplyScalar(200))
    L.target.position.set(0, 0, 0)
    L.target.updateMatrixWorld()
  })

  return (
    <directionalLight
      ref={lightRef}
      intensity={3.15}
      color="#fff8ec"
      castShadow={false}
    />
  )
}

function TexturedMoon({
  position,
  radius,
  reducedMotion,
}: {
  position: [number, number, number]
  radius: number
  reducedMotion: boolean
}) {
  const map = useTexture(MOON_MAP, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  })
  const ref = useRef<THREE.Mesh>(null)
  const omega = useMemo(
    () => MOON_OMEGA_RAD_S * (reducedMotion ? REDUCED_MOTION_SPIN_SCALE : 1),
    [reducedMotion],
  )

  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    m.rotation.y += delta * omega
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={map}
        roughness={0.92}
        metalness={0.02}
        emissive="#1e1e28"
        emissiveIntensity={0.14}
      />
    </mesh>
  )
}

function EarthWithMarkers({
  worldPosition,
  radius,
  reducedMotion,
}: {
  worldPosition: [number, number, number]
  radius: number
  reducedMotion: boolean
}) {
  const map = useTexture(EARTH_MAP, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  })
  const spinRef = useRef<THREE.Group>(null)

  const launchDir = useMemo(() => markerDirectionOnEarth(KSC_39B.lat, KSC_39B.lon).normalize(), [])
  const landDir = useMemo(
    () => markerDirectionOnEarth(PACIFIC_SPLASHDOWN_NOMINAL.lat, PACIFIC_SPLASHDOWN_NOMINAL.lon).normalize(),
    [],
  )

  const pinQuat = useMemo(() => new THREE.Quaternion(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const pinLen = 0.22
  const pinTipOffset = pinLen * 0.62

  const labelUp = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const labelSide = useMemo(() => new THREE.Vector3(1, 0, 0), [])

  const launchLabelPos = useMemo(() => {
    // Float the label away from the surface along the normal + a small lateral nudge.
    return launchDir
      .clone()
      .multiplyScalar(radius * 1.5)
      .add(labelSide.clone().multiplyScalar(0.34))
      .add(labelUp.clone().multiplyScalar(0.34))
  }, [labelSide, labelUp, launchDir, radius])

  const landLabelPos = useMemo(() => {
    return landDir
      .clone()
      .multiplyScalar(radius * 1.5)
      .add(labelSide.clone().multiplyScalar(-0.36))
      .add(labelUp.clone().multiplyScalar(0.32))
  }, [labelSide, labelUp, landDir, radius])

  const omega = useMemo(
    () => EARTH_OMEGA_RAD_S * (reducedMotion ? REDUCED_MOTION_SPIN_SCALE : 1),
    [reducedMotion],
  )

  useFrame((_, delta) => {
    const g = spinRef.current
    if (!g) return
    g.rotation.y += delta * omega
  })

  return (
    <group position={worldPosition}>
      <group ref={spinRef}>
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            map={map}
            roughness={0.78}
            metalness={0.06}
            emissive="#061018"
            emissiveIntensity={0.095}
          />
        </mesh>
        <EarthNightLights radius={radius} />

        {/* White pins sticking out of Earth for launch/landing */}
        <mesh
          position={launchDir.clone().multiplyScalar(radius * 1.02 + pinLen / 2).toArray() as [number, number, number]}
          quaternion={pinQuat.setFromUnitVectors(up, launchDir)}
        >
          <cylinderGeometry args={[0.012, 0.012, pinLen, 10]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.65} />
        </mesh>
        <mesh
          position={landDir.clone().multiplyScalar(radius * 1.02 + pinLen / 2).toArray() as [number, number, number]}
          quaternion={pinQuat.setFromUnitVectors(up, landDir)}
        >
          <cylinderGeometry args={[0.012, 0.012, pinLen, 10]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.65} />
        </mesh>

        {/* Leader lines from pins → floating labels (keeps text off the globe). */}
        <Line
          points={[
            launchDir.clone().multiplyScalar(radius * 1.02 + pinTipOffset).toArray() as [number, number, number],
            [launchLabelPos.x, launchLabelPos.y, launchLabelPos.z],
          ]}
          color="#ffffff"
          lineWidth={1}
          transparent
          opacity={0.75}
        />
        <Line
          points={[
            landDir.clone().multiplyScalar(radius * 1.02 + pinTipOffset).toArray() as [number, number, number],
            [landLabelPos.x, landLabelPos.y, landLabelPos.z],
          ]}
          color="#ffffff"
          lineWidth={1}
          transparent
          opacity={0.75}
        />

        <Html
          position={[launchLabelPos.x, launchLabelPos.y, launchLabelPos.z]}
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div className="traj-globe-label">{KSC_39B.label}</div>
        </Html>
        <Html
          position={[landLabelPos.x, landLabelPos.y, landLabelPos.z]}
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div className="traj-globe-label">{PACIFIC_SPLASHDOWN_NOMINAL.label}</div>
        </Html>
      </group>
    </group>
  )
}

function EclipticPlanet({
  earth,
  spec,
}: {
  earth: [number, number, number]
  spec: EclipticBodySpec
}) {
  const groupRef = useRef<THREE.Group>(null)
  const ev = useMemo(() => new THREE.Vector3(...earth), [earth])
  const isSun = spec.name === 'Sun'
  const labelLift = spec.radius + Math.max(0.75, Math.min(spec.radius * 0.15, 5))

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const u = sunDirectionFromEarth(new Date())
    g.position.copy(ev).add(u.clone().multiplyScalar(spec.along))
  })

  return (
    <group ref={groupRef}>
      {isSun ? (
        <SunRealistic radius={spec.radius} />
      ) : (
        <mesh>
          <sphereGeometry args={[spec.radius, 32, 32]} />
          <meshStandardMaterial
            color={spec.color}
            roughness={spec.roughness ?? 0.85}
            metalness={spec.metalness ?? 0.04}
            emissive={spec.emissive ?? '#000000'}
            emissiveIntensity={spec.emissiveIntensity ?? 0}
          />
        </mesh>
      )}
      {spec.ring ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spec.radius * spec.ring.inner, spec.radius * spec.ring.outer, 64]} />
          <meshBasicMaterial
            color="#d8cfb0"
            transparent
            opacity={spec.ring.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      <Line
        points={[
          [0, spec.radius * 1.02, 0],
          [0, labelLift, 0],
        ]}
        color="#ffffff"
        lineWidth={1}
        transparent
        opacity={0.65}
      />
      <Html position={[0, labelLift + 0.15, 0]} center distanceFactor={26} style={{ pointerEvents: 'none' }}>
        <div className="traj-planet-label">{spec.name}</div>
      </Html>
    </group>
  )
}

function SolarSystemBackdrop({ earth }: { earth: [number, number, number] }) {
  return (
    <>
      {ECLIPTIC_BODIES.map((s) => (
        <EclipticPlanet key={s.name} earth={earth} spec={s} />
      ))}
    </>
  )
}

/** Extra rotation (rad) of ship HUD around local +Y — swings label clockwise in typical views. */
const SHIP_HUD_LABEL_YAW_RAD = -0.72

function Spacecraft({
  progress,
  distEarthMi,
  speedMph,
}: {
  progress: number
  distEarthMi: number
  speedMph: number
}) {
  const group = useRef<THREE.Group>(null)
  const rocketScale = 0.45
  const labelRef = useRef<THREE.Group>(null)
  const leaderRef = useRef<THREE.Mesh>(null)
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const tmpShip = useMemo(() => new THREE.Vector3(), [])
  const tmpEarth = useMemo(() => new THREE.Vector3(), [])
  const tmpLabel = useMemo(() => new THREE.Vector3(), [])
  const tmpDir = useMemo(() => new THREE.Vector3(), [])
  const tmpMid = useMemo(() => new THREE.Vector3(), [])
  const tmpQuat = useMemo(() => new THREE.Quaternion(), [])

  useFrame(() => {
    const g = group.current
    if (!g) return
    const [x, y, z] = trajectoryPoint3D(progress)
    g.position.set(x, y, z)
    const ahead = progress >= 0.99 ? Math.max(0, progress - 0.04) : Math.min(1, progress + 0.04)
    const [tx, ty, tz] = trajectoryPoint3D(ahead)
    g.lookAt(tx, ty, tz)

    // Push the HUD away from Earth toward the Moon side (away-from-Earth direction).
    // NOTE: The ship `group` is already at (x,y,z) in world space, so all HUD geometry must be set
    // in *local* space (relative to the ship).
    const { earth } = earthMoonWorldPositions()
    tmpShip.set(x, y, z)
    tmpEarth.set(...earth)
    tmpDir.copy(tmpShip).sub(tmpEarth)
    if (tmpDir.lengthSq() < 1e-6) tmpDir.set(1, 0, 0)
    tmpDir.normalize()

    // Local-space label: world "away from Earth" → ship local, then lift and yaw so the HUD
    // sits farther around the flank (clears the nose / top-left overlap from most views).
    tmpQuat.copy(g.quaternion).invert()
    tmpLabel.copy(tmpDir).applyQuaternion(tmpQuat).normalize().multiplyScalar(2.6)
    tmpLabel.y += 1.9
    tmpLabel.applyAxisAngle(yAxis, SHIP_HUD_LABEL_YAW_RAD)

    const lbl = labelRef.current
    if (lbl) lbl.position.copy(tmpLabel)

    const lead = leaderRef.current
    if (lead) {
      const len = tmpLabel.length()
      if (len > 1e-6) {
        tmpMid.copy(tmpLabel).multiplyScalar(0.5)
        lead.position.copy(tmpMid)
        tmpQuat.setFromUnitVectors(yAxis, tmpDir.copy(tmpLabel).normalize())
        lead.quaternion.copy(tmpQuat)
        lead.scale.set(1, len, 1)
        lead.visible = true
      } else {
        lead.visible = false
      }
    }
  })

  // Geometry lengths (z-axis in this model). Positions are chosen so adjacent pieces slightly overlap
  // to avoid visible seams when zoomed in.
  const NOSE_L = 0.2
  const CREW_L = 0.32
  const SERVICE_L = 0.22
  const SKIRT_L = 0.15
  const ENGINE_L = 0.1
  const SEAM = 0.008

  const crewZ = 0
  const noseZ = crewZ + CREW_L / 2 + NOSE_L / 2 - SEAM
  const serviceZ = crewZ - CREW_L / 2 - SERVICE_L / 2 + SEAM
  const skirtZ = serviceZ - SERVICE_L / 2 - SKIRT_L / 2 + SEAM
  // Flush: engine +Z face meets skirt −Z (no SEAM gap); plumes use engine aft as anchor.
  const engineZ = skirtZ - SKIRT_L / 2 - ENGINE_L / 2
  const engineAftZ = engineZ - ENGINE_L / 2
  const PLUME1_H = 0.32
  const PLUME2_H = 0.46
  // Cone apex is toward +Z after π/2 X rot; center so apex sits on engine bell (−Z end of engine).
  const plume1Z = engineAftZ - PLUME1_H / 2
  const plume2Z = engineAftZ - PLUME2_H / 2

  return (
    <group ref={group}>
      <group scale={rocketScale}>
        <mesh position={[0, 0, noseZ]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.065, 0.2, 20]} />
          <meshStandardMaterial
            color="#a8aeb8"
            roughness={0.38}
            metalness={0.28}
            emissive="#6d737d"
            emissiveIntensity={0.22}
          />
        </mesh>
        <mesh position={[0, 0, crewZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.095, 0.32, 20]} />
          <meshStandardMaterial
            color="#8f96a1"
            roughness={0.44}
            metalness={0.24}
            emissive="#585e68"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[0, 0.092, crewZ + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.052, 0.016, 0.026]} />
          <meshStandardMaterial
            color="#3a3f47"
            roughness={0.55}
            metalness={0.18}
            emissive="#25292f"
            emissiveIntensity={0.14}
          />
        </mesh>
        <mesh position={[0, 0, serviceZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.098, 0.11, 0.22, 20]} />
          <meshStandardMaterial
            color="#7a818c"
            roughness={0.4}
            metalness={0.26}
            emissive="#4e545e"
            emissiveIntensity={0.21}
          />
        </mesh>
        <mesh position={[0, 0, skirtZ]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.125, 0.15, 0.16, 20]} />
          <meshStandardMaterial
            color="#686f7a"
            roughness={0.46}
            metalness={0.22}
            emissive="#424850"
            emissiveIntensity={0.19}
          />
        </mesh>
        <mesh position={[0, 0, engineZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.07, 0.1, 12]} />
          <meshStandardMaterial
            color="#4f565f"
            roughness={0.48}
            metalness={0.32}
            emissive="#323840"
            emissiveIntensity={0.17}
          />
        </mesh>
        {/* Exhaust: apex at engine bell, base toward −Z (ConeGeometry apex at +Y → +Z) */}
        <mesh position={[0, 0, plume1Z]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.11, PLUME1_H, 18]} />
          <meshBasicMaterial color="#ff7a2f" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, plume2Z]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.18, PLUME2_H, 18]} />
          <meshBasicMaterial color="#ffb24a" toneMapped={false} transparent opacity={0.35} />
        </mesh>

        <pointLight distance={12} intensity={3.0} color="#ffffff" decay={2} />
        <pointLight distance={6} intensity={2.0} color="#ff8a3d" decay={2} />
      </group>

      {/* Leader + label (kept unscaled so it stays readable) */}
      <mesh ref={leaderRef}>
        <cylinderGeometry args={[0.012, 0.012, 1, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <group ref={labelRef}>
        <Html center distanceFactor={13} style={{ pointerEvents: 'none' }}>
          <div className="traj-ship-hud">
            <div>Earth {distEarthMi.toLocaleString()} mi</div>
            <div>{speedMph.toLocaleString()} mph</div>
          </div>
        </Html>
      </group>
    </group>
  )
}

const C_TRAIL_A = new THREE.Color('#41ffb3')
const C_TRAIL_B = new THREE.Color('#ff6bcb')
const C_TRAIL_C = new THREE.Color('#ffc14d')
const C_TRAIL_D = new THREE.Color('#6bb5ff')

function AnimatedTrail({
  path,
  reducedMotion,
}: {
  path: THREE.Vector3[]
  reducedMotion: boolean
}) {
  const lineRef = useRef<Line2>(null)
  const lineRef2 = useRef<Line2>(null)
  const lineRef3 = useRef<Line2>(null)

  const vertexColors = useMemo(() => {
    return path.map((_, i) => {
      const cycle = [C_TRAIL_A, C_TRAIL_B, C_TRAIL_C, C_TRAIL_D]
      return cycle[i % cycle.length]!.clone()
    })
  }, [path])

  useFrame((_, delta) => {
    if (reducedMotion) return
    // Slower “flow” so it feels like drifting telemetry, not a fast scanner.
    const speeds = [0.55, 0.42, 0.68]
    const refs = [lineRef, lineRef2, lineRef3]
    refs.forEach((r, i) => {
      const line = r.current
      if (!line?.material) return
      const mat = line.material as LineMaterial
      if (!mat.dashed) return
      mat.dashOffset -= delta * speeds[i]!
    })
  })

  return (
    <group>
      <Line
        ref={lineRef}
        points={path}
        color="#ffffff"
        vertexColors={vertexColors}
        lineWidth={2.8}
        dashed
        dashSize={0.22}
        gapSize={0.14}
        dashScale={2.2}
        transparent
        opacity={0.92}
      />
      <Line
        ref={lineRef2}
        points={path}
        color="#ff9cf0"
        lineWidth={1.4}
        dashed
        dashSize={0.14}
        gapSize={0.22}
        dashScale={2.8}
        transparent
        opacity={0.55}
      />
      <Line
        ref={lineRef3}
        points={path}
        color="#7aefff"
        lineWidth={1.1}
        dashed
        dashSize={0.1}
        gapSize={0.28}
        dashScale={3.2}
        transparent
        opacity={0.45}
      />
    </group>
  )
}

function TrajectoryArrows({ reducedMotion }: { reducedMotion: boolean }) {
  const COUNT = 14
  const flowRef = useRef(0)
  const groupRefs = useRef<(THREE.Group | null)[]>([])

  const fromAxis = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const p0 = useMemo(() => new THREE.Vector3(), [])
  const p1 = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    if (reducedMotion) return
    // Drift speed in "progress per second". Tuned to feel similar to the dashed flow.
    flowRef.current = (flowRef.current + delta * 0.04) % 1

    for (let i = 0; i < COUNT; i++) {
      const g = groupRefs.current[i]
      if (!g) continue

      const t = (i / COUNT + flowRef.current) % 1
      const [x0, y0, z0] = trajectoryPoint3D(t)
      const tAhead = (t + 0.008) % 1
      const [x1, y1, z1] = trajectoryPoint3D(tAhead)

      p0.set(x0, y0, z0)
      p1.set(x1, y1, z1)
      const dir = p1.sub(p0).normalize()
      q.setFromUnitVectors(fromAxis, dir)

      g.position.set(x0, y0, z0)
      g.quaternion.copy(q)
    }
  })

  return (
    <group>
      {Array.from({ length: COUNT }).map((_, i) => (
        <group key={i} ref={(el) => { groupRefs.current[i] = el }}>
          <mesh position={[0, 0.09, 0]}>
            <coneGeometry args={[0.06, 0.18, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#9fffe2"
              emissiveIntensity={0.6}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Bodies({ reducedMotion }: { reducedMotion: boolean }) {
  const { earth, moon } = earthMoonWorldPositions()
  return (
    <>
      <Suspense fallback={null}>
        <EarthWithMarkers worldPosition={earth} radius={SCENE_EARTH_RADIUS} reducedMotion={reducedMotion} />
      </Suspense>
      <Suspense fallback={null}>
        <TexturedMoon position={moon} radius={SCENE_MOON_RADIUS} reducedMotion={reducedMotion} />
      </Suspense>
    </>
  )
}

function RegisterViewReset({
  apiRef,
  controlsRef,
  initialPosition,
  initialTarget,
}: {
  apiRef: React.MutableRefObject<{ reset: () => void }>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  initialPosition: [number, number, number]
  initialTarget: [number, number, number]
}) {
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const c = controlsRef.current
      if (c) {
        c.target.set(...initialTarget)
        c.update()
      }
    })
    return () => cancelAnimationFrame(id)
  }, [controlsRef, initialTarget])

  useEffect(() => {
    apiRef.current.reset = () => {
      camera.position.set(...initialPosition)
      const c = controlsRef.current
      if (c) {
        c.target.set(...initialTarget)
        c.update()
      }
    }
  }, [apiRef, camera, controlsRef, initialPosition, initialTarget])

  return null
}

function TrajectoryScene({
  progress,
  reducedMotion,
  apiRef,
  distEarthMi,
  speedMph,
  initialPosition,
  initialTarget,
}: {
  progress: number
  reducedMotion: boolean
  apiRef: React.MutableRefObject<{ reset: () => void }>
  distEarthMi: number
  speedMph: number
  initialPosition: [number, number, number]
  initialTarget: [number, number, number]
}) {
  const path = useMemo(
    () => trajectoryWorldPoints(200).map((p) => new THREE.Vector3(...p)),
    [],
  )
  const { earth } = earthMoonWorldPositions()
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.2} />
      <hemisphereLight args={['#c4d4f0', '#06090e', 0.32]} />
      <SunLighting />
      <pointLight position={[0, 0, 0]} intensity={0.26} color="#b8cff5" distance={95} decay={2} />
      <Stars
        radius={920}
        depth={320}
        count={reducedMotion ? 5000 : 16_000}
        factor={7.5}
        saturation={0.5}
        fade={false}
        speed={reducedMotion ? 0 : 0.35}
      />
      <SolarSystemBackdrop earth={earth} />
      <AnimatedTrail path={path} reducedMotion={reducedMotion} />
      <TrajectoryArrows reducedMotion={reducedMotion} />
      <Bodies reducedMotion={reducedMotion} />
      <Spacecraft progress={progress} distEarthMi={distEarthMi} speedMph={speedMph} />
      <RegisterViewReset
        apiRef={apiRef}
        controlsRef={controlsRef}
        initialPosition={initialPosition}
        initialTarget={initialTarget}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        zoomSpeed={1.12}
        minDistance={3.8}
        maxDistance={940}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI - 0.1}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.35}
        makeDefault
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </>
  )
}

type ReplayProps = {
  displayMet: number
  metNow: number
  followLive: boolean
  scrubHours: number
  setScrub: (h: number) => void
  jumpToLive: () => void
}

type Props = {
  progress: number
  replay: ReplayProps
  telemetry: TelemetrySnapshot | null
  telemetryError: string | null
  isReplay: boolean
  telemetryFetchError: string | null
}

export function TrajectoryView({
  progress,
  replay,
  telemetry,
  telemetryError,
  isReplay,
  telemetryFetchError,
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const viewApiRef = useRef<{ reset: () => void }>({ reset: () => {} })

  const initialView = useMemo(() => {
    return initialRouteCamera()
  }, [])

  const shipDist = telemetry?.distEarthMi ?? 0
  const shipSpeed = telemetry?.speedMph ?? 0

  return (
    <div className="trajectory-card mcc-panel mcc-trajectory trajectory-viz-card">
      <div className="trajectory-head">
        <div className="panel-title-row">
          <span className="mcc-deco" aria-hidden />
          <h2>Mission view · Earth–Moon (3D)</h2>
        </div>
        <p className="trajectory-caption">
          Illustrative free-return path. Sun and planets sit on today’s Earth→Sun line (compressed; all-planet
          lineup is schematic). Official state vectors:{' '}
          <a href="https://www.nasa.gov/trackartemis" target="_blank" rel="noreferrer">
            NASA AROW
          </a>
          . Drag to orbit · pinch/scroll to zoom · reset restores camera.
        </p>
      </div>

      <div className="trajectory-viz-split">
        <div className="trajectory-canvas-column">
          <div className="trajectory-canvas-wrap">
            <button
              type="button"
              className="trajectory-reset-view mcc-btn"
              onClick={() => viewApiRef.current.reset()}
            >
              Reset view
            </button>
            <Suspense
              fallback={
                <div className="trajectory-canvas-fallback mono mcc-blink">INITIALIZING 3D SCENE…</div>
              }
            >
              <Canvas
                className="trajectory-canvas"
                camera={{ position: initialView.position, fov: 44 }}
                dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)]}
                gl={{
                  antialias: true,
                  alpha: false,
                  powerPreference: 'high-performance',
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.12,
                }}
              >
                <TrajectoryScene
                  progress={progress}
                  reducedMotion={reducedMotion}
                  apiRef={viewApiRef}
                  distEarthMi={shipDist}
                  speedMph={shipSpeed}
                  initialPosition={initialView.position}
                  initialTarget={initialView.target}
                />
              </Canvas>
            </Suspense>
          </div>
        </div>

        <aside className="trajectory-telemetry-column" aria-label="Telemetry alongside mission view">
          <TelemetryPanel
            embedded
            data={telemetry}
            error={telemetryError}
            isReplay={isReplay}
            fetchError={telemetryFetchError}
          />
        </aside>
      </div>

      <MissionReplayControls
        embedded
        displayMet={replay.displayMet}
        metNow={replay.metNow}
        followLive={replay.followLive}
        scrubHours={replay.scrubHours}
        setScrub={replay.setScrub}
        jumpToLive={replay.jumpToLive}
      />
    </div>
  )
}

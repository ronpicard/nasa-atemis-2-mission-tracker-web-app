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
import { ECLIPTIC_BODIES, initialOrbitCamera, type EclipticBodySpec } from '../lib/solarSystemLayout'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { TelemetrySnapshot } from '../lib/telemetrySource'
import { TelemetryPanel } from './TelemetryPanel'

const EARTH_MAP =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/earth_atmos_2048.jpg'
const MOON_MAP =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/textures/planets/moon_1024.jpg'

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

  return <directionalLight ref={lightRef} intensity={2.05} color="#fff6dd" castShadow={false} />
}

function TexturedMoon({
  position,
  radius,
  spinSpeed,
}: {
  position: [number, number, number]
  radius: number
  spinSpeed: number
}) {
  const map = useTexture(MOON_MAP, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  })
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    m.rotation.y += delta * spinSpeed
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={map}
        roughness={0.92}
        metalness={0.02}
        emissive="#1a1a22"
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

function EarthWithMarkers({
  worldPosition,
  radius,
  spinSpeed,
}: {
  worldPosition: [number, number, number]
  radius: number
  spinSpeed: number
}) {
  const map = useTexture(EARTH_MAP, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  })
  const spinRef = useRef<THREE.Group>(null)

  const launch = useMemo(
    () => markerDirectionOnEarth(KSC_39B.lat, KSC_39B.lon).multiplyScalar(radius * 1.05),
    [radius],
  )
  const land = useMemo(
    () =>
      markerDirectionOnEarth(PACIFIC_SPLASHDOWN_NOMINAL.lat, PACIFIC_SPLASHDOWN_NOMINAL.lon).multiplyScalar(
        radius * 1.05,
      ),
    [radius],
  )

  useFrame((_, delta) => {
    const g = spinRef.current
    if (!g) return
    g.rotation.y += delta * spinSpeed
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
            emissive="#020810"
            emissiveIntensity={0.04}
          />
        </mesh>
        <Html position={[launch.x, launch.y, launch.z]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className="traj-globe-label">{KSC_39B.label}</div>
        </Html>
        <Html position={[land.x, land.y, land.z]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
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
  const labelLift = spec.radius + Math.max(0.15, spec.radius * 0.12)

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const u = sunDirectionFromEarth(new Date())
    g.position.copy(ev).add(u.clone().multiplyScalar(spec.along))
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[spec.radius, isSun ? 48 : 32, isSun ? 48 : 32]} />
        {isSun ? (
          <meshBasicMaterial color={spec.color} toneMapped={false} />
        ) : (
          <meshStandardMaterial
            color={spec.color}
            roughness={spec.roughness ?? 0.85}
            metalness={spec.metalness ?? 0.04}
            emissive={spec.emissive ?? '#000000'}
            emissiveIntensity={spec.emissiveIntensity ?? 0}
          />
        )}
      </mesh>
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
      <Html position={[0, labelLift, 0]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
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

  useFrame(() => {
    const g = group.current
    if (!g) return
    const [x, y, z] = trajectoryPoint3D(progress)
    g.position.set(x, y, z)
    const ahead = progress >= 0.99 ? Math.max(0, progress - 0.04) : Math.min(1, progress + 0.04)
    const [tx, ty, tz] = trajectoryPoint3D(ahead)
    g.lookAt(tx, ty, tz)
  })

  return (
    <group ref={group}>
      <mesh position={[0, 0, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.065, 0.2, 20]} />
        <meshStandardMaterial color="#e8eaef" metalness={0.38} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.095, 0.32, 20]} />
        <meshStandardMaterial color="#d8dce3" metalness={0.28} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.092, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.052, 0.016, 0.026]} />
        <meshStandardMaterial color="#0a1620" emissive="#66ccff" emissiveIntensity={0.95} />
      </mesh>
      <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.098, 0.11, 0.22, 20]} />
        <meshStandardMaterial color="#8f97a3" metalness={0.48} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.125, 0.15, 0.16, 20]} />
        <meshStandardMaterial color="#3d4450" metalness={0.52} roughness={0.52} />
      </mesh>
      <mesh position={[0, 0, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.07, 0.1, 12]} />
        <meshStandardMaterial color="#2a3038" emissive="#ff6a2d" emissiveIntensity={0.35} />
      </mesh>
      <pointLight distance={7} intensity={0.85} color="#ffc14d" decay={2} />
      <Html position={[0, 0.55, 0]} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <div className="traj-ship-hud">
          <div>Earth {distEarthMi.toLocaleString()} mi</div>
          <div>{speedMph.toLocaleString()} mph</div>
        </div>
      </Html>
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
    const speeds = [1.9, 1.35, 2.4]
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

function Bodies({ reducedMotion }: { reducedMotion: boolean }) {
  const { earth, moon } = earthMoonWorldPositions()
  return (
    <>
      <Suspense fallback={null}>
        <EarthWithMarkers
          worldPosition={earth}
          radius={1.08}
          spinSpeed={reducedMotion ? 0.04 : 0.1}
        />
      </Suspense>
      <Suspense fallback={null}>
        <TexturedMoon position={moon} radius={0.36} spinSpeed={reducedMotion ? 0.015 : 0.035} />
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
      <color attach="background" args={['#030806']} />
      <ambientLight intensity={0.07} />
      <SunLighting />
      <pointLight position={[0, 0, 0]} intensity={0.15} color="#aac8ff" distance={80} decay={2} />
      <Stars
        radius={165}
        depth={70}
        count={reducedMotion ? 2000 : 4500}
        factor={2.8}
        saturation={0.15}
        fade
        speed={reducedMotion ? 0 : 0.35}
      />
      <SolarSystemBackdrop earth={earth} />
      <AnimatedTrail path={path} reducedMotion={reducedMotion} />
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
        maxDistance={130}
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
    const { earth, moon } = earthMoonWorldPositions()
    return initialOrbitCamera(earth, moon)
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
                camera={{ position: initialView.position, fov: 52 }}
                dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)]}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
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

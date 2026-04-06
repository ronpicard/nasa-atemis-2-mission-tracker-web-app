import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls, Stars } from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  earthMoonWorldPositions,
  trajectoryPoint3D,
  trajectoryWorldPoints,
} from '../lib/missionTimeline'

function BodySphere({
  position,
  color,
  emissive,
  radius,
  spinSpeed,
}: {
  position: [number, number, number]
  color: string
  emissive: string
  radius: number
  spinSpeed: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    m.rotation.y += delta * spinSpeed
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 40, 40]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.4}
        roughness={0.88}
        metalness={0.08}
      />
    </mesh>
  )
}

function Spacecraft({ progress }: { progress: number }) {
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
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.32, 12]} />
        <meshStandardMaterial color="#ffc14d" emissive="#ff8c00" emissiveIntensity={0.75} />
      </mesh>
      <pointLight distance={5} intensity={1.6} color="#ffc14d" decay={2} />
    </group>
  )
}

function TrajectoryScene({ progress }: { progress: number }) {
  const { earth, moon } = earthMoonWorldPositions()
  const path = useMemo(
    () => trajectoryWorldPoints(180).map((p) => new THREE.Vector3(...p)),
    [],
  )

  return (
    <>
      <color attach="background" args={['#040c0a']} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[22, 14, 10]} intensity={1.25} color="#fff8ee" />
      <pointLight position={[-12, -4, 6]} intensity={0.45} color="#41ffb3" />
      <Stars radius={90} depth={60} count={4000} factor={2.8} saturation={0} fade speed={0.5} />
      <Line
        points={path}
        color="#41ffb3"
        opacity={0.42}
        transparent
        lineWidth={1.5}
        dashed
        dashScale={3}
        dashSize={0.2}
        gapSize={0.12}
      />
      <BodySphere position={earth} color="#1a5c4a" emissive="#0a2820" radius={1.08} spinSpeed={0.12} />
      <BodySphere position={moon} color="#9aa8b4" emissive="#1c2832" radius={0.36} spinSpeed={0.04} />
      <Spacecraft progress={progress} />
      <OrbitControls
        enablePan={false}
        minDistance={5.5}
        maxDistance={36}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.15}
        autoRotate
        autoRotateSpeed={0.4}
        makeDefault
      />
    </>
  )
}

type Props = { progress: number; replayMode: boolean }

/** Interactive 3D Earth–Moon free-return diagram; Orion position follows mission progress. */
export function TrajectoryView({ progress, replayMode }: Props) {
  return (
    <div className="trajectory-card mcc-panel mcc-trajectory mcc-interactive-panel">
      <div className="trajectory-head">
        <div className="panel-title-row">
          <span className="mcc-deco" aria-hidden />
          <h2>Orbital plot · Earth–Moon (3D)</h2>
        </div>
        {replayMode ? <span className="source-pill replay">REPLAY</span> : null}
        <p className="trajectory-caption">
          Illustrative free-return path. Official state vectors:{' '}
          <a href="https://www.nasa.gov/trackartemis" target="_blank" rel="noreferrer">
            NASA AROW
          </a>
          . Drag the view to orbit; scroll to zoom.
        </p>
      </div>
      <div className="trajectory-canvas-wrap">
        <Suspense
          fallback={
            <div className="trajectory-canvas-fallback mono mcc-blink">INITIALIZING 3D SCENE…</div>
          }
        >
          <Canvas
            className="trajectory-canvas"
            camera={{ position: [0.2, 5.2, 13.5], fov: 46 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false }}
          >
            <TrajectoryScene progress={progress} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  )
}

import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

const SUN_VERT = `
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const SUN_FRAG = `
uniform float uTime;
uniform vec3 uCameraPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.55;
  mat3 m = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
  for (int i = 0; i < 5; i++) {
    v += a * noise3(p);
    p = m * p * 2.02 + vec3(uTime * 0.04);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  float mu = abs(dot(n, viewDir));
  float limb = pow(1.0 - mu, 2.8);

  vec3 p = normalize(vWorldPos) * 3.2 + vec3(uTime * 0.03, uTime * 0.021, uTime * 0.017);
  float gran = fbm(p);
  float boil = 0.5 + 0.5 * sin(p.x * 14.0 + uTime * 0.6) * sin(p.y * 11.0 - uTime * 0.45) * sin(p.z * 9.0 + uTime * 0.35);
  gran = gran * 0.65 + boil * 0.35;

  vec3 darkC = vec3(0.55, 0.12, 0.02);
  vec3 midC = vec3(1.0, 0.42, 0.06);
  vec3 brightC = vec3(1.0, 0.88, 0.45);
  vec3 hotC = vec3(1.0, 0.97, 0.88);

  vec3 base = mix(darkC, midC, smoothstep(0.15, 0.45, gran));
  base = mix(base, brightC, smoothstep(0.42, 0.72, gran));
  float flare = smoothstep(0.78, 0.98, gran + 0.12 * sin(dot(vWorldPos, vec3(2.1, 1.7, 3.3)) + uTime * 0.5));
  base = mix(base, hotC, flare);

  base += vec3(0.55, 0.42, 0.22) * limb;
  base += vec3(0.25, 0.18, 0.08) * pow(limb, 0.45);

  gl_FragColor = vec4(base, 1.0);
}
`

type Props = { radius: number }

export function SunRealistic({ radius }: Props) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
    }),
    [],
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uCameraPos.value.copy(state.camera.position)
  })

  return (
    <mesh>
      <sphereGeometry args={[radius, 96, 96]} />
      <shaderMaterial vertexShader={SUN_VERT} fragmentShader={SUN_FRAG} uniforms={uniforms} toneMapped={false} />
    </mesh>
  )
}

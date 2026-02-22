import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const MAX_COLORS = 8;

const ColorBendsMaterial = shaderMaterial(
  {
    uCanvas: new THREE.Vector2(1, 1),
    uTime: 0,
    uSpeed: 0.2,
    uRot: new THREE.Vector2(1, 0),
    uColorCount: 0,
    uColors: Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0)),
    uTransparent: 1,
    uScale: 1,
    uFrequency: 1,
    uWarpStrength: 1,
    uPointer: new THREE.Vector2(0, 0),
    uMouseInfluence: 1,
    uParallax: 0.5,
    uNoise: 0.1
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    #define MAX_COLORS ${MAX_COLORS}
    uniform vec2 uCanvas;
    uniform float uTime;
    uniform float uSpeed;
    uniform vec2 uRot;
    uniform int uColorCount;
    uniform vec3 uColors[MAX_COLORS];
    uniform int uTransparent;
    uniform float uScale;
    uniform float uFrequency;
    uniform float uWarpStrength;
    uniform vec2 uPointer;
    uniform float uMouseInfluence;
    uniform float uParallax;
    uniform float uNoise;
    varying vec2 vUv;

    void main() {
      float t = uTime * uSpeed;
      vec2 p = vUv * 2.0 - 1.0;
      p += uPointer * uParallax * 0.1;
      vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
      vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
      q /= max(uScale, 0.0001);
      q /= 0.5 + 0.2 * dot(q, q);
      q += 0.2 * cos(t) - 7.56;
      vec2 toward = (uPointer - rp);
      q += toward * uMouseInfluence * 0.2;

      vec3 col = vec3(0.0);
      float a = 1.0;

      if (uColorCount > 0) {
        vec2 s = q;
        vec3 sumCol = vec3(0.0);
        float cover = 0.0;
        for (int i = 0; i < MAX_COLORS; ++i) {
          if (i >= uColorCount) break;
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float kBelow = clamp(uWarpStrength, 0.0, 1.0);
          float kMix = pow(kBelow, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * kBelow;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float m = mix(m0, m1, kMix);
          float w = 1.0 - exp(-6.0 / exp(6.0 * m));
          sumCol += uColors[i] * w;
          cover = max(cover, w);
        }
        col = clamp(sumCol, 0.0, 1.0);
        a = uTransparent > 0 ? cover : 1.0;
      } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
          float kBelow = clamp(uWarpStrength, 0.0, 1.0);
          float kMix = pow(kBelow, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * kBelow;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
          float m = mix(m0, m1, kMix);
          col[k] = 1.0 - exp(-6.0 / exp(6.0 * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
      }

      if (uNoise > 0.0001) {
        float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);
      }

      vec3 rgb = (uTransparent > 0) ? col * a : col;
      gl_FragColor = vec4(rgb, a);
    }
  `
);

extend({ ColorBendsMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      colorBendsMaterial: any;
    }
  }
}

export function ColorBendsR3F({
  colors = ["#ff5c7a", "#8a5cff", "#00ffd1"],
  rotation = 45,
  speed = 0.2,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.1,
  transparent = true,
  autoRotate = 0
}) {
  const materialRef = useRef<any>(null);
  const { size, viewport } = useThree();

  const toVec3 = (hex: string) => {
    const h = hex.replace('#', '').trim();
    const v =
      h.length === 3
        ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
        : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
  };

  const uColorsArray = useMemo(() => {
    const arr = new Array(MAX_COLORS).fill(null).map(() => new THREE.Vector3(0, 0, 0));
    colors.forEach((c, i) => {
      if (i < MAX_COLORS) {
        arr[i] = toVec3(c);
      }
    });
    return arr;
  }, [colors]);

  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.elapsedTime;
      materialRef.current.uTime = t;
      materialRef.current.uCanvas.set(size.width, size.height);
      
      const deg = (rotation % 360) + autoRotate * t;
      const rad = (deg * Math.PI) / 180;
      materialRef.current.uRot.set(Math.cos(rad), Math.sin(rad));
      
      // Sync uPointer with cube rotation instead of mouse
      const x = Math.sin(t * 0.1) * 0.5; 
      const y = Math.cos(t * 0.15) * 0.5;
      materialRef.current.uPointer.set(x, y);
    }
  });

  return (
    <mesh position={[0, 0, -5]} scale={[viewport.width * 2, viewport.height * 2, 1]}>
      <planeGeometry />
      {/* @ts-ignore */}
      <colorBendsMaterial
        ref={materialRef}
        uColors={uColorsArray}
        uColorCount={uColorsArray.length}
        uSpeed={speed}
        uScale={scale}
        uFrequency={frequency}
        uWarpStrength={warpStrength}
        uMouseInfluence={mouseInfluence}
        uParallax={parallax}
        uNoise={noise}
        uTransparent={transparent ? 1 : 0}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

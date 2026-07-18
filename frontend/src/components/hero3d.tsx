/**
 * The app's single 3D element: a globe of deployment sites on the dashboard.
 * Budget rules applied here:
 *  - lazy-loaded (React.lazy at the call site) so it never blocks FCP
 *  - instanced site markers, all geometry memoized — no per-frame allocation
 *  - delta-based rotation; rAF throttles automatically in hidden tabs
 *  - prefers-reduced-motion renders a single static frame (frameloop="demand")
 *  - R3F disposes the scene graph on unmount; DPR capped for integrated GPUs
 */
import { Line } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Site } from '../lib/types';

const GLOBE_RADIUS = 1.6;

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Read theme tokens off the document root (canvas can't consume CSS vars). */
function useThemeColors() {
  const read = () => {
    const style = getComputedStyle(document.documentElement);
    return {
      line: style.getPropertyValue('--line-2').trim() || '#c3c2b7',
      accent: style.getPropertyValue('--accent').trim() || '#2a78d6',
      ok: style.getPropertyValue('--ok').trim() || '#0ca30c',
      ink: style.getPropertyValue('--ink-3').trim() || '#898781',
    };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return colors;
}

function SiteMarkers({ sites, color }: { sites: Site[]; color: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    sites.forEach((site, i) => {
      const position = latLngToVec3(site.lat, site.lng, GLOBE_RADIUS * 1.01);
      matrix.setPosition(position);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [sites]);

  if (sites.length === 0) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, sites.length]}>
      <sphereGeometry args={[0.035, 12, 12]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
}

function Arcs({ sites, color }: { sites: Site[]; color: string }) {
  // Great-circle-ish bezier arcs from the first site (HQ) to the rest,
  // precomputed once per site set.
  const arcs = useMemo(() => {
    if (sites.length < 2) return [];
    const hq = latLngToVec3(sites[0].lat, sites[0].lng, GLOBE_RADIUS * 1.01);
    return sites.slice(1).map((site) => {
      const end = latLngToVec3(site.lat, site.lng, GLOBE_RADIUS * 1.01);
      const mid = hq.clone().add(end).multiplyScalar(0.5);
      mid.setLength(GLOBE_RADIUS * (1.15 + 0.25 * (hq.distanceTo(end) / (2 * GLOBE_RADIUS))));
      const curve = new THREE.QuadraticBezierCurve3(hq, mid, end);
      return curve.getPoints(32);
    });
  }, [sites]);

  return (
    <>
      {arcs.map((points, i) => (
        <Line key={i} points={points} color={color} lineWidth={1} transparent opacity={0.55} />
      ))}
    </>
  );
}

function Globe({ sites, animate }: { sites: Site[]; animate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = useThemeColors();

  useFrame((_, delta) => {
    if (animate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.35, 4.4, 0]}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 24]} />
        <meshBasicMaterial color={colors.line} wireframe transparent opacity={0.28} />
      </mesh>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 0.995, 32, 24]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={0.06} />
      </mesh>
      <SiteMarkers sites={sites} color={colors.ok} />
      <Arcs sites={sites} color={colors.accent} />
    </group>
  );
}

export default function DeploymentHero({ sites }: { sites: Site[] }) {
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  return (
    <div className="relative h-72">
      <div className="pointer-events-none absolute left-4 top-3 z-10">
        <h2 className="text-sm font-semibold text-ink-1">Deployment sites</h2>
        <p className="text-xs text-ink-2">
          {sites.length > 0
            ? `${sites.length} sites · ${sites.reduce((sum, s) => sum + s.deviceCount, 0)} devices`
            : 'Loading sites…'}
        </p>
      </div>
      <Canvas
        // Static single frame under reduced motion; continuous otherwise.
        frameloop={reducedMotion ? 'demand' : 'always'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
        camera={{ position: [0, 0.6, 4.2], fov: 45 }}
        aria-hidden
      >
        <Globe sites={sites} animate={!reducedMotion} />
      </Canvas>
    </div>
  );
}

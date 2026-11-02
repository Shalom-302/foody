"use client";

// React Three Fiber scene, loaded client-side only (next/dynamic, ssr: false).
// The real mignardises and ingredients, cut out of their photos (public/cutouts,
// see CREDITS.md), float freely in depth: no frame, a soft drop shadow, a slow
// sway that reveals their thickness. The camera flies through them as the page
// scrolls; `progress` (0 -> 1) comes from the GSAP ScrollTrigger scrub in
// hero-universe.tsx and is read every frame without re-rendering.

import { Sparkles, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

type Item = { name: string; size: number };

// Story order: bissap -> citron -> mignardises, matching the text chapters.
const STORY: Item[] = [
    { name: "glass-bissap", size: 1.9 },
    { name: "hibiscus", size: 1.1 },
    { name: "juice-splash", size: 2.1 },
    { name: "hibiscus", size: 0.7 },
    { name: "mint-sprig", size: 1.5 },
    { name: "lemon", size: 1.1 },
    { name: "lemon-halves", size: 1.2 },
    { name: "lemon-cut", size: 1.4 },
    { name: "mint-sprig", size: 1 },
    { name: "lemon", size: 0.7 },
    { name: "macarons-trio", size: 1.5 },
    { name: "tartlet-blueberry", size: 1.3 },
    { name: "macarons-hearts", size: 1.9 },
    { name: "tartlet-raspberry", size: 1.2 },
    { name: "tartlet-berries", size: 1.1 },
    { name: "macarons-chocolate", size: 1.7 },
    { name: "tartlet-raspberry-plate", size: 1 },
    { name: "hibiscus", size: 0.9 },
];

const NAMES = Array.from(new Set(STORY.map((i) => i.name)));
const url = (name: string) => `/cutouts/${name}.webp`;

export const DEPTH_STEP = 1.9;
const START_Z = 6.5;

function Floating({ item, index, texture }: { item: Item; index: number; texture: THREE.Texture }) {
    const group = useRef<THREE.Group>(null);
    const body = useRef<THREE.Mesh>(null);
    const shadow = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const camera = useThree((s) => s.camera);

    const image = texture.image as { width: number; height: number };
    const aspect = image.width / image.height;
    const h = item.size;
    const w = h * aspect;

    // Golden-angle spiral: never two objects on the same line of sight.
    const layout = useMemo(() => {
        const angle = index * 2.39996;
        const radius = 1.5 + (index % 3) * 0.6;
        return {
            x: Math.cos(angle) * radius * 1.35,
            y: Math.sin(angle) * radius * 0.8,
            z: -index * DEPTH_STEP,
            phase: index * 1.7,
            speed: 0.5 + (index % 5) * 0.12,
            tilt: (index % 2 ? 1 : -1) * (0.05 + (index % 3) * 0.05),
        };
    }, [index]);

    useFrame((state, dt) => {
        const g = group.current;
        if (!g) return;
        const t = state.clock.elapsedTime * layout.speed + layout.phase;
        // Float, sway (the plane turning shows the object's depth) and a lazy spin.
        g.position.set(layout.x + Math.sin(t * 0.7) * 0.12, layout.y + Math.sin(t) * 0.18, layout.z);
        g.rotation.y = Math.sin(t * 0.6) * 0.45 + (hovered ? Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0);
        g.rotation.z = layout.tilt + Math.sin(t * 0.8) * 0.08;
        const s = THREE.MathUtils.damp(g.scale.x, hovered ? 1.15 : 1, 6, dt);
        g.scale.setScalar(s);

        // Fade in from the depth, fade out just before passing the camera.
        const d = camera.position.z - layout.z;
        const o = THREE.MathUtils.clamp((16 - d) / 5, 0, 1) * THREE.MathUtils.clamp((d - 0.6) / 1.2, 0, 1);
        (body.current!.material as THREE.MeshBasicMaterial).opacity = o;
        (shadow.current!.material as THREE.MeshBasicMaterial).opacity = o * 0.16;
    });

    return (
        <group ref={group}>
            {/* Drop shadow: the same silhouette, tinted brown, slightly offset behind. */}
            <mesh ref={shadow} position={[0.08, -0.12, -0.05]} scale={[w * 1.02, h * 1.02, 1]}>
                <planeGeometry />
                <meshBasicMaterial map={texture} color="#493D26" transparent depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh
                ref={body}
                scale={[w, h, 1]}
                onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
                onPointerOut={() => setHovered(false)}
            >
                <planeGeometry />
                <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function Objects() {
    const textures = useTexture(NAMES.map(url)) as THREE.Texture[];
    const byName = useMemo(() => {
        const map: Record<string, THREE.Texture> = {};
        textures.forEach((t, i) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 4;
            map[NAMES[i]] = t;
        });
        return map;
    }, [textures]);
    const viewport = useThree((s) => s.viewport);
    // On wide screens the spiral drifts right, leaving the left third to the text.
    const wide = viewport.aspect > 1.1;
    return (
        <group position={[wide ? Math.min(viewport.width * 0.28, 3) : 0, wide ? 0 : -0.7, 0]}>
            {STORY.map((item, i) => (
                <Floating key={`${item.name}-${i}`} item={item} index={i} texture={byName[item.name]} />
            ))}
        </group>
    );
}

function Flight({ progress }: { progress: MutableRefObject<number> }) {
    const travel = (STORY.length - 1) * DEPTH_STEP + 1.5;
    useFrame((state, dt) => {
        const p = progress.current;
        const cam = state.camera;
        cam.position.z = THREE.MathUtils.damp(cam.position.z, START_Z - p * travel, 3.5, dt);
        // A slow swirl along the path plus pointer parallax.
        cam.position.x = THREE.MathUtils.damp(cam.position.x, Math.sin(p * Math.PI * 2) * 0.6 + state.pointer.x * 0.5, 2.5, dt);
        cam.position.y = THREE.MathUtils.damp(cam.position.y, Math.cos(p * Math.PI * 1.5) * 0.3 + state.pointer.y * 0.3, 2.5, dt);
        cam.rotation.z = THREE.MathUtils.damp(cam.rotation.z, Math.sin(p * Math.PI) * 0.1, 2.5, dt);
    });
    return null;
}

export default function ObjectUniverse({ progress, onReady }: { progress: MutableRefObject<number>; onReady?: () => void }) {
    const depth = STORY.length * DEPTH_STEP;
    return (
        <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, START_Z], fov: 50, near: 0.1, far: 60 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={() => onReady?.()}
        >
            <Suspense fallback={null}>
                <Objects />
            </Suspense>
            <Sparkles count={140} scale={[9, 6, depth]} position={[0, 0, -depth / 2]} size={2.6} speed={0.35} opacity={0.8} color="#F4C94E" />
            <Sparkles count={50} scale={[8, 5, depth]} position={[0, 0, -depth / 2]} size={4} speed={0.2} opacity={0.5} color="#C2416A" />
            <Flight progress={progress} />
        </Canvas>
    );
}

"use client";

// React Three Fiber scene, loaded client-side only (next/dynamic, ssr: false).
// Real photos float in a slow spiral that recedes into the depth; the camera
// flies through it as the page scrolls. `progress` (0 -> 1) comes from a GSAP
// ScrollTrigger scrub in hero-universe.tsx, read every frame without re-rendering.

import { Float, Image, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { PHOTOS, unsplash } from "@/lib/photos";

type Card = { id: string; aspect: number; position: [number, number, number]; tilt: number; size: number };

// Story order: bissap -> lemons -> mignardises, so each text chapter flies past its photos.
const ORDER: [string, number][] = [
    [PHOTOS.bissapGlass, 0.8], [PHOTOS.hibiscusFlower, 1], [PHOTOS.bissapCup, 1.25],
    [PHOTOS.driedHibiscus, 0.8], [PHOTOS.hibiscusBush, 1.25], [PHOTOS.bissapWine, 0.8],
    [PHOTOS.lemonadeJar, 0.8], [PHOTOS.lemonSlices, 1.25], [PHOTOS.lemonsFabric, 1],
    [PHOTOS.lemonYellow, 0.8], [PHOTOS.ginger, 1.25], [PHOTOS.lemonsPile, 1],
    [PHOTOS.macaronsRow, 1.25], [PHOTOS.fruitTartlets, 1], [PHOTOS.petitFoursStand, 0.8],
    [PHOTOS.lemonTartlets, 1.25], [PHOTOS.macaronsTrio, 0.8], [PHOTOS.savouryTartlets, 1],
    [PHOTOS.whiteChocolates, 1.25], [PHOTOS.berryTart, 1], [PHOTOS.hibiscusMacro, 1],
];

export const DEPTH_STEP = 2.6;
const START_Z = 7;

function useCards(): Card[] {
    return useMemo(
        () =>
            ORDER.map(([id, aspect], i) => {
                // Golden-angle spiral: never two photos on the same line of sight.
                const angle = i * 2.39996;
                const radius = 1.9 + (i % 3) * 0.55;
                return {
                    id,
                    aspect,
                    position: [Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 0.75, -i * DEPTH_STEP],
                    tilt: (i % 2 ? 1 : -1) * (0.08 + (i % 4) * 0.04),
                    size: 1.5 + (i % 3) * 0.25,
                };
            }),
        [],
    );
}

function Photo({ card, index }: { card: Card; index: number }) {
    const ref = useRef<THREE.Mesh & { material: THREE.ShaderMaterial & { zoom: number; grayscale: number; opacity: number } }>(null);
    const [hovered, setHovered] = useState(false);
    const camera = useThree((s) => s.camera);
    const w = card.size * card.aspect;
    const h = card.size;
    const url = unsplash(card.id, card.aspect >= 1 ? 900 : 640, card.aspect >= 1 ? Math.round(900 / card.aspect) : 800);

    useFrame((_, dt) => {
        const m = ref.current?.material;
        if (!m) return;
        // Fade in from the depth, fade out just before passing the camera.
        const d = camera.position.z - card.position[2];
        const target = THREE.MathUtils.clamp((18 - d) / 5, 0, 1) * THREE.MathUtils.clamp((d - 0.5) / 1.2, 0, 1);
        m.opacity = THREE.MathUtils.damp(m.opacity, target, 6, dt);
        m.zoom = THREE.MathUtils.damp(m.zoom, hovered ? 1.12 : 1, 6, dt);
        m.grayscale = 0;
    });

    return (
        <Float speed={1 + (index % 4) * 0.25} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.12, 0.12]}>
            <Image
                ref={ref as never}
                url={url}
                position={card.position}
                rotation={[0, -card.position[0] * 0.08, card.tilt]}
                scale={[w, h]}
                radius={0.08}
                transparent
                opacity={0}
                toneMapped={false}
                onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
                onPointerOut={() => setHovered(false)}
            />
        </Float>
    );
}

/** On wide screens the spiral drifts right, leaving the left third to the text. */
function Cards({ cards }: { cards: Card[] }) {
    const viewport = useThree((s) => s.viewport);
    const offset = viewport.aspect > 1.1 ? Math.min(viewport.width * 0.3, 3.2) : 0;
    return (
        <group position={[offset, viewport.aspect > 1.1 ? 0 : -0.6, 0]}>
            {cards.map((c, i) => (
                <Photo key={c.id + i} card={c} index={i} />
            ))}
        </group>
    );
}

function Flight({ progress, count }: { progress: MutableRefObject<number>; count: number }) {
    const travel = (count - 1) * DEPTH_STEP + 2;
    useFrame((state, dt) => {
        const p = progress.current;
        const cam = state.camera;
        const z = START_Z - p * travel;
        cam.position.z = THREE.MathUtils.damp(cam.position.z, z, 3.5, dt);
        // A slow swirl along the path plus pointer parallax.
        cam.position.x = THREE.MathUtils.damp(cam.position.x, Math.sin(p * Math.PI * 2) * 0.7 + state.pointer.x * 0.5, 2.5, dt);
        cam.position.y = THREE.MathUtils.damp(cam.position.y, Math.cos(p * Math.PI * 1.5) * 0.35 + state.pointer.y * 0.3, 2.5, dt);
        cam.rotation.z = THREE.MathUtils.damp(cam.rotation.z, Math.sin(p * Math.PI) * 0.12, 2.5, dt);
    });
    return null;
}

export default function PhotoUniverse({ progress, onReady }: { progress: MutableRefObject<number>; onReady?: () => void }) {
    const cards = useCards();
    return (
        <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, START_Z], fov: 50, near: 0.1, far: 60 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={() => onReady?.()}
        >
            <Suspense fallback={null}>
                <Cards cards={cards} />
            </Suspense>
            <Sparkles count={140} scale={[9, 6, cards.length * DEPTH_STEP]} position={[0, 0, -(cards.length * DEPTH_STEP) / 2]} size={2.6} speed={0.35} opacity={0.8} color="#F4C94E" />
            <Sparkles count={50} scale={[8, 5, cards.length * DEPTH_STEP]} position={[0, 0, -(cards.length * DEPTH_STEP) / 2]} size={4} speed={0.2} opacity={0.5} color="#C2416A" />
            <Flight progress={progress} count={cards.length} />
        </Canvas>
    );
}
